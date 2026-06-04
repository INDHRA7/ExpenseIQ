from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import re
import redis
import json
import logging

from supabase import create_client
from rag import load_pdf, chunk_text, create_embeddings, store_embeddings, search
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from langchain_core.tools import Tool
from datetime import datetime, timedelta, timezone
from dateutil import parser as dateparser

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REDIS ─────────────────────────────────────────────────────────────────────
try:
    r = redis.Redis(host="localhost", port=6379, decode_responses=True)
    r.ping()
    logger.info("Redis connected.")
except Exception as e:
    logger.warning(f"Redis unavailable: {e}")
    r = None

# ── RAG ───────────────────────────────────────────────────────────────────────
try:
    text       = load_pdf("data/banking.pdf")
    chunks     = chunk_text(text)
    embeddings = create_embeddings(chunks)
    index      = store_embeddings(embeddings)
    logger.info(f"RAG loaded. Chunks: {len(chunks)}")
except FileNotFoundError:
    raise RuntimeError("banking.pdf not found in data/ folder.")
except Exception as e:
    raise RuntimeError(f"RAG load failed: {e}")

# ── SUPABASE ──────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
if SUPABASE_URL.endswith("/rest/v1"):
    SUPABASE_URL = SUPABASE_URL[:-len("/rest/v1")]

SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL or SUPABASE_KEY missing in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
logger.info("Supabase client created.")

# ── LLM ───────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY missing in .env")

llm = ChatOpenAI(
    model="llama-3.3-70b-versatile",
    temperature=0,
    openai_api_key=GROQ_API_KEY,
    openai_api_base="https://api.groq.com/openai/v1",
)
logger.info("LLM ready.")

# ── SCHEMA ────────────────────────────────────────────────────────────────────
class PromptInput(BaseModel):
    prompt: str
    session_id: str
    user_id: str       # Supabase UUID from Google Auth


# ── DATE/TIME PARSER ──────────────────────────────────────────────────────────
def parse_date_range(query: str):
    """
    Parses natural language date/time ranges from a query string.

    Returns: (start_dt, end_dt) as timezone-aware datetime objects, or (None, None).
    """
    now = datetime.now(timezone.utc)
    q   = query.lower()

    # ── explicit range: "from May 6 to May 15 between 8am and 10am" ─────────
    range_match = re.search(
        r"from\s+(.+?)\s+to\s+(.+?)(?:\s+between\s+([\d:apm ]+)\s+and\s+([\d:apm ]+))?(?:\s|$)",
        q, re.IGNORECASE,
    )
    if range_match:
        raw_start = range_match.group(1).strip()
        raw_end   = range_match.group(2).strip()
        raw_ts    = range_match.group(3)
        raw_te    = range_match.group(4)
        try:
            start_dt = dateparser.parse(raw_start, default=now.replace(hour=0, minute=0, second=0, microsecond=0))
            end_dt   = dateparser.parse(raw_end,   default=now.replace(hour=23, minute=59, second=59, microsecond=0))
            if start_dt and end_dt:
                # apply time-of-day window if provided
                if raw_ts and raw_te:
                    ts = dateparser.parse(raw_ts)
                    te = dateparser.parse(raw_te)
                    if ts and te:
                        start_dt = start_dt.replace(hour=ts.hour, minute=ts.minute, second=0)
                        end_dt   = end_dt.replace(  hour=te.hour, minute=te.minute, second=59)
                return (
                    start_dt.replace(tzinfo=timezone.utc),
                    end_dt.replace(  tzinfo=timezone.utc),
                )
        except Exception:
            pass

    # ── last N days ───────────────────────────────────────────────────────────
    days_match = re.search(r"last\s+(\d+)\s+days?", q)
    if days_match:
        n = int(days_match.group(1))
        return now - timedelta(days=n), now

    # ── last week ─────────────────────────────────────────────────────────────
    if "last week" in q:
        start = now - timedelta(days=now.weekday() + 7)
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end   = start + timedelta(days=7)
        # apply time window if mentioned
        tw = _extract_time_window(q)
        if tw:
            start = start.replace(hour=tw[0].hour, minute=tw[0].minute)
            end   = (now - timedelta(days=now.weekday())).replace(hour=tw[1].hour, minute=tw[1].minute)
        return start, end

    # ── this week ─────────────────────────────────────────────────────────────
    if "this week" in q:
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now

    # ── last month ────────────────────────────────────────────────────────────
    if "last month" in q:
        first_this = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end   = first_this - timedelta(seconds=1)
        last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return last_month_start, first_this

    # ── this month ────────────────────────────────────────────────────────────
    if "this month" in q:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return start, now

    # ── today ─────────────────────────────────────────────────────────────────
    if "today" in q:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tw = _extract_time_window(q)
        if tw:
            start = start.replace(hour=tw[0].hour, minute=tw[0].minute)
            end   = now.replace(  hour=tw[1].hour, minute=tw[1].minute)
            return start, end
        return start, now

    # ── yesterday ─────────────────────────────────────────────────────────────
    if "yesterday" in q:
        start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end   = start.replace(hour=23, minute=59, second=59)
        return start, end

    return None, None


def _extract_time_window(text: str):
    """Extract 'between Xam and Ypm' style time window."""
    m = re.search(r"between\s+([\d:apm ]+)\s+and\s+([\d:apm ]+)", text, re.IGNORECASE)
    if m:
        try:
            ts = dateparser.parse(m.group(1).strip())
            te = dateparser.parse(m.group(2).strip())
            if ts and te:
                return ts, te
        except Exception:
            pass
    return None


# ── TOOL FUNCTIONS ─────────────────────────────────────────────────────────────

# Thread-local user_id — set per request before agent invocation
_current_user_id = None


def bank_search_func(query: str) -> str:
    try:
        results = search(query, index, chunks)
        if not results:
            return "No relevant banking information found."
        return "\n\n".join(results)
    except Exception as e:
        logger.error(f"bank_search error: {e}")
        return "Error searching the banking knowledge base."


def greet_func(input: str) -> str:
    return (
        "Hello! Welcome to BankAssist. "
        "How can I help you with your banking needs today?"
    )


def reject_func(input: str) -> str:
    return (
        "I'm sorry, I can only assist with banking-related questions. "
        
    )


def db_insert(user_id: str, amount: float, description: str) -> str:
    supabase.table("transactions").insert({
        "user_id":     user_id,
        "amount":      amount,
        "description": description,
    }).execute()
    logger.info(f"Inserted: user={user_id}, amount={amount}, description={description}")
    return f"Transaction recorded: ₹{amount:.2f} for '{description}'."


def db_select(user_id: str, start_dt=None, end_dt=None, limit: int = 15) -> str:
    """Fetch transactions for a user, optionally filtered by date/time range."""
    query = (
        supabase.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
    )
    if start_dt:
        query = query.gte("created_at", start_dt.isoformat())
    if end_dt:
        query = query.lte("created_at", end_dt.isoformat())

    response = query.limit(limit).execute()

    if not response.data:
        return "No transactions found for the specified period."

    total = sum(float(r["amount"]) for r in response.data)
    lines = [
        f"{row['created_at'][:16].replace('T', ' ')}  |  "
        f"₹{float(row['amount']):.2f}  |  "
        f"{row['description']}"
        for row in response.data
    ]
    header    = "Date & Time       |  Amount    |  Description"
    separator = "─" * 52
    footer    = f"\nTotal ({len(lines)} transactions): ₹{total:.2f}"
    return (
        "Transaction History:\n"
        + header + "\n" + separator + "\n"
        + "\n".join(lines)
        + footer
    )


def db_query_func(query: str) -> str:
    """
    Handles transaction operations with user isolation and date/time filtering.
    Called by the agent with natural-language input that includes the user_id prefix.

    Expected format from agent:
        "USER:<uuid> | <natural language query>"
    """
    global _current_user_id
    user_id = _current_user_id
    if not user_id:
        return "Error: no user context. Please log in again."

    query_lower = query.lower().strip()

    # ── INSERT ─────────────────────────────────────────────────────────────────
    insert_keywords = ["add", "insert", "record", "save", "spent", "spend", "bought", "buy"]
    if any(kw in query_lower for kw in insert_keywords):
        amount_match = re.search(r"(\d+(?:\.\d+)?)", query)
        if not amount_match:
            return (
                "Please include an amount. "
                "Example: 'add 500 for groceries' or 'record 200 for rent'."
            )
        amount = float(amount_match.group(1))

        for_match = re.search(r"\bfor\b\s+(.+)", query, re.IGNORECASE)
        if for_match:
            description = for_match.group(1).strip()
        else:
            cleaned = re.sub(r"\b(" + "|".join(insert_keywords) + r")\b", "", query_lower)
            cleaned = re.sub(r"\d+(?:\.\d+)?", "", cleaned)
            cleaned = re.sub(r"\b(rupees?|rs|inr|₹)\b", "", cleaned, flags=re.IGNORECASE)
            description = cleaned.strip(" .,")

        if not description:
            description = "General transaction"

        try:
            return db_insert(user_id, amount, description)
        except Exception as e:
            logger.error(f"db_insert error: {e}")
            return f"Failed to record transaction. Error: {e}"

    # ── SELECT (with date/time parsing) ────────────────────────────────────────
    select_keywords = [
        "show", "get", "fetch", "list", "view", "display",
        "recent", "history", "statement", "transactions", "select",
        "last month", "last week", "this month", "this week",
        "yesterday", "today", "expenses", "spending",
    ]
    if any(kw in query_lower for kw in select_keywords):
        start_dt, end_dt = parse_date_range(query_lower)
        try:
            return db_select(user_id, start_dt, end_dt)
        except Exception as e:
            logger.error(f"db_select error: {e}")
            return f"Failed to fetch transactions. Error: {e}"

    return (
        "I can help you view or record transactions.\n"
        "To record: 'add 500 for groceries'\n"
        "To view:   'show my last month expenses'\n"
        "To filter: 'show transactions from May 1 to May 15 between 8am and 10am'"
    )


# ── TOOLS ──────────────────────────────────────────────────────────────────────

bank_search_tool = Tool(
    name="bank_search",
    func=bank_search_func,
    description=(
        "Use for ANY banking knowledge question — accounts, savings, loans, "
        "interest rates, credit cards, KYC, RBI policies, deposits, withdrawals, "
        "online banking, bank fees, or banking regulations. "
        "Input: the user's question exactly as typed."
    ),
    return_direct=False,
)

greet_tool = Tool(
    name="greet_user",
    func=greet_func,
    description=(
        "Use ONLY when the user sends a greeting: "
        "hello, hi, hey, good morning, good evening, good afternoon, howdy."
    ),
    return_direct=True,
)

reject_tool = Tool(
    name="reject_query",
    func=reject_func,
    description=(
        "Use when the user asks about something completely unrelated to banking — "
        "sports, politics, cooking, geography, science, movies, weather, "
        "entertainment, or any general knowledge topic."
    ),
    return_direct=True,
)

db_tool = Tool(
    name="database_tool",
    func=db_query_func,
    description=(
        "Use for personal transaction operations. Use when user wants to:\n"
        "  - View recent transactions / check history / get statement\n"
        "  - Filter by date: 'last month', 'last week', 'this month', 'today'\n"
        "  - Filter by date range: 'from May 1 to May 15'\n"
        "  - Filter by time window: 'between 8am and 10am'\n"
        "  - Add / record / save a new transaction (needs amount + description)\n"
        "Input: plain English exactly as the user typed it.\n"
        "Examples:\n"
        "  'add 200 for lunch'\n"
        "  'record 1000 rupees for electricity bill'\n"
        "  'show my recent transactions'\n"
        "  'show my last month expenses'\n"
        "  'show expenses from May 6 to May 15 between 8am and 10am'\n"
        "  'what did I spend last week'"
    ),
    return_direct=False,
)

tools = [bank_search_tool, greet_tool, reject_tool, db_tool]


# ── REACT PROMPT ───────────────────────────────────────────────────────────────
REACT_PROMPT = PromptTemplate(
    input_variables=[
        "tools",
        "tool_names",
        "chat_history",
        "input",
        "agent_scratchpad",
    ],
    template="""You are a strict banking assistant with access to a private transaction database. You must always use a tool. Never answer directly from memory.

Available tools:
{tools}

Tool names: {tool_names}

Decision rules:
- User greets (hello / hi / hey / good morning)                     → use greet_user
- User asks a banking knowledge question                             → use bank_search
- User wants to view, add, or filter transactions                    → use database_tool
- User asks anything unrelated to banking                            → use reject_query

Important:
- NEVER skip using a tool
- Use each tool ONLY ONCE per turn
- ALWAYS write Final Answer right after Observation
- Keep Final Answer clean and clear, 2-3 sentences
- When showing transaction results, present them clearly with totals

Exact format to follow every time — do not change it:

Question: the user input
Thought: which tool to use and why
Action: tool_name_here
Action Input: exact input to pass to the tool
Observation: what the tool returned
Thought: I now have enough to answer
Final Answer: clear and helpful answer for the user

Previous conversation:
{chat_history}

Question: {input}
Thought:{agent_scratchpad}""",
)


# ── AGENT ──────────────────────────────────────────────────────────────────────
agent = create_react_agent(
    llm=llm,
    tools=tools,
    prompt=REACT_PROMPT,
)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    max_iterations=3,
    handle_parsing_errors=True,
    verbose=True,
)


# ── LEAK GUARD ────────────────────────────────────────────────────────────────
LEAK_SIGNALS = ["■", "□", "\x0c", "Page No.", "Sr.No.", "Figure "]

def is_chunk_leak(text: str) -> bool:
    return any(signal in text for signal in LEAK_SIGNALS) or text.count("\n") > 30


# ── REDIS HELPERS ─────────────────────────────────────────────────────────────
def get_history(session_id: str) -> list:
    if r is None:
        return []
    try:
        data = r.get(session_id)
        return json.loads(data) if data else []
    except Exception as e:
        logger.warning(f"Redis get error [{session_id}]: {e}")
        return []


def save_history(session_id: str, history: list) -> None:
    if r is None:
        return
    try:
        r.setex(session_id, 3600, json.dumps(history))
    except Exception as e:
        logger.warning(f"Redis save error [{session_id}]: {e}")


def format_chat_history(history: list) -> str:
    if not history:
        return "No previous conversation."
    return "\n".join(
        f"{'User' if h['role'] == 'user' else 'Assistant'}: {h['content']}"
        for h in history
    )


# ── HEALTH ENDPOINTS ──────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "redis": r is not None, "chunks": len(chunks)}


@app.get("/test-db")
async def test_db():
    try:
        res = supabase.table("transactions").select("*").limit(3).execute()
        return {"status": "connected", "rows": res.data}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


# ── CHAT ENDPOINT ─────────────────────────────────────────────────────────────
MAX_PROMPT_LEN = 500

@app.post("/chat")
async def chat(data: PromptInput):
    if not data.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    if len(data.prompt) > MAX_PROMPT_LEN:
        raise HTTPException(status_code=400, detail=f"Query too long. Keep it under {MAX_PROMPT_LEN} characters.")
    if not data.user_id:
        raise HTTPException(status_code=401, detail="User not authenticated.")

    global _current_user_id
    _current_user_id = data.user_id     # inject user context for db_tool

    try:
        history      = get_history(data.session_id)
        chat_history = format_chat_history(history)

        response = agent_executor.invoke({
            "input":        data.prompt,
            "chat_history": chat_history,
        })

        answer = response["output"].strip()

        if any(p in answer.lower() for p in ["iteration limit", "time limit", "agent stopped"]):
            answer = "I'm sorry, I couldn't process that. Please try rephrasing your question."

        if is_chunk_leak(answer):
            logger.warning(f"Chunk leak detected — session {data.session_id}")
            answer = (
                "I found relevant information but couldn't summarise it clearly. "
                "Please try rephrasing your question."
            )

        history.append({"role": "user",      "content": data.prompt})
        history.append({"role": "assistant", "content": answer})
        save_history(data.session_id, history[-8:])

        return {"response": answer}

    except Exception as e:
        logger.error(f"/chat error [{data.session_id}]: {e}")
        return {"error": "Something went wrong. Please try again."}
    finally:
        _current_user_id = None     # always clear after request
