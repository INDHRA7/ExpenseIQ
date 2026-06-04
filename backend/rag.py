from pypdf import PdfReader
from sentence_transformers import SentenceTransformer, CrossEncoder
from langchain_text_splitters import RecursiveCharacterTextSplitter
import faiss
import numpy as np


def load_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    return text.strip()




def chunk_text(text: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=80,
        separators=["\n\n", "\n", ". ", "! ", "? ", " "],
    )

    chunks = splitter.split_text(text)
    return [c.strip() for c in chunks if c.strip()]


# -------------------- MODELS --------------------

embed_model = SentenceTransformer("all-MiniLM-L6-v2")
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


# -------------------- EMBEDDINGS --------------------

def create_embeddings(chunks: list[str]) -> np.ndarray:
    return embed_model.encode(chunks, normalize_embeddings=True)


def store_embeddings(embeddings: np.ndarray) -> faiss.IndexFlatIP:
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    return index


# -------------------- SEARCH --------------------

def search(
    query: str,
    index: faiss.IndexFlatIP,
    chunks: list[str],
    top_k: int = 5,
    final_k: int = 2,
) -> list[str]:

    query_vec = embed_model.encode([query], normalize_embeddings=True)

    distances, indices = index.search(query_vec, top_k)

    retrieved = [
        chunks[i] for i in indices[0]
        if 0 <= i < len(chunks)
    ]

    if not retrieved:
        return []

    pairs = [[query, chunk] for chunk in retrieved]
    scores = reranker.predict(pairs)

    ranked = sorted(
        zip(retrieved, scores),
        key=lambda x: x[1],
        reverse=True
    )

    return [chunk for chunk, _ in ranked[:final_k]]