import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── THEME PALETTES ───────────────────────────────────────────────────────────
const LIGHT = {
  bg:        "#FDFCF8",
  bgAlt:     "#F5F2EA",
  surface:   "#FFFFFF",
  surfaceAlt:"#F9F7F2",
  ink:       "#16120A",
  inkMid:    "#3A3018",
  inkLight:  "#6B5C38",
  inkGhost:  "#A09070",
  goldDeep:  "#7A5C0A",
  gold:      "#B8960C",
  goldMid:   "#D4AF37",
  goldLight: "#E8D078",
  goldPale:  "#F4E8A8",
  goldGhost: "#FBF6DC",
  bordHair:  "rgba(212,175,55,0.18)",
  bordSoft:  "rgba(212,175,55,0.32)",
  bordMid:   "rgba(184,150,12,0.50)",
  bordStr:   "#B8960C",
  green:     "#2D7A4F",
  greenBg:   "#F0FAF4",
  red:       "#C0392B",
  redBg:     "#FEF2F0",
  msgUser:   "#16120A",
  msgUserTxt:"#FDFCF8",
  msgBot:    "#FFFFFF",
  msgBotTxt: "#3A3018",
  inputBg:   "#F9F7F2",
  headerBg:  "#FFFFFF",
  shadow:    "0 2px 12px rgba(184,150,12,0.08), 0 1px 3px rgba(0,0,0,0.04)",
  shadowLg:  "0 8px 40px rgba(184,150,12,0.12), 0 2px 8px rgba(0,0,0,0.06)",
};

const DARK = {
  bg:        "#0E0C08",
  bgAlt:     "#151208",
  surface:   "#1A1610",
  surfaceAlt:"#201C12",
  ink:       "#F5F0E8",
  inkMid:    "#DDD0B0",
  inkLight:  "#A8966A",
  inkGhost:  "#6A5C38",
  goldDeep:  "#D4AF37",
  gold:      "#D4AF37",
  goldMid:   "#E8C84A",
  goldLight: "#F2D96A",
  goldPale:  "#6A5218",
  goldGhost: "#2A2010",
  bordHair:  "rgba(212,175,55,0.12)",
  bordSoft:  "rgba(212,175,55,0.22)",
  bordMid:   "rgba(232,200,74,0.40)",
  bordStr:   "#D4AF37",
  green:     "#4CAF7A",
  greenBg:   "#0D2018",
  red:       "#E06050",
  redBg:     "#200C0A",
  msgUser:   "#2A2010",
  msgUserTxt:"#F2D96A",
  msgBot:    "#1A1610",
  msgBotTxt: "#DDD0B0",
  inputBg:   "#151208",
  headerBg:  "#0E0C08",
  shadow:    "0 2px 12px rgba(0,0,0,0.30), 0 1px 3px rgba(0,0,0,0.20)",
  shadowLg:  "0 8px 40px rgba(0,0,0,0.40), 0 2px 8px rgba(212,175,55,0.10)",
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const makeCSS = (G) => `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Outfit:wght@300;400;500;600&family=Courier+Prime:ital,wght@0,400;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body {
    background: ${G.bg};
    color: ${G.ink};
    font-family: 'Outfit', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
    transition: background 0.35s ease, color 0.35s ease;
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.bordMid}; border-radius: 99px; }

  @keyframes goldSweep {
    0%   { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translateX(110vw) skewX(-12deg); opacity: 0; }
  }
  @keyframes goldPulse {
    0%,100% { opacity: 0.3; }
    50%     { opacity: 0.9; }
  }
  @keyframes shimmerBar {
    0%   { background-position: -400% center; }
    100% { background-position: 400% center; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes revealRight {
    from { opacity: 0; transform: translateX(28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes scaleReveal {
    from { opacity: 0; transform: scale(0.96) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes bounceY {
    0%,80%,100% { transform: translateY(0); }
    40%         { transform: translateY(-5px); }
  }
  @keyframes floatY {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-8px); }
  }
  @keyframes rotateHue {
    0%   { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(15deg); }
  }

  textarea:focus { outline: none; }
  button { cursor: pointer; border: none; background: none; font-family: inherit; }
  .cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }
  .mono { font-family: 'Courier Prime', 'Courier New', monospace; }

  @media (max-width: 900px)  { .hide-tab  { display: none !important; } }
  @media (max-width: 600px)  { .hide-mob  { display: none !important; } }
  @media (min-width: 901px)  { .show-mob  { display: none !important; } }
`;

// ─── GOLD BARS COMPONENT ──────────────────────────────────────────────────────
function GoldBars({ G }) {
  const bars = [
    { top: "12%", delay: "0s",   dur: "6s",   w: 220, thick: 1.5, opacity: 0.75 },
    { top: "28%", delay: "1.4s", dur: "8s",   w: 320, thick: 1,   opacity: 0.5  },
    { top: "44%", delay: "0.6s", dur: "7s",   w: 180, thick: 2,   opacity: 0.65 },
    { top: "61%", delay: "2.2s", dur: "6.5s", w: 280, thick: 1,   opacity: 0.45 },
    { top: "76%", delay: "3.1s", dur: "9s",   w: 150, thick: 1.5, opacity: 0.35 },
    { top: "88%", delay: "1.8s", dur: "7.5s", w: 240, thick: 1,   opacity: 0.3  },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* moving bars */}
      {bars.map((b, i) => (
        <div key={i} style={{
          position: "absolute",
          top: b.top, left: 0,
          height: b.thick,
          width: b.w,
          background: `linear-gradient(90deg,
            transparent 0%,
            ${G.goldMid}00 5%,
            ${G.goldMid} 35%,
            ${G.goldLight} 50%,
            ${G.goldMid} 65%,
            ${G.goldMid}00 95%,
            transparent 100%)`,
          opacity: b.opacity,
          animation: `goldSweep ${b.dur} ${b.delay} infinite linear`,
          willChange: "transform",
          filter: "blur(0.3px)",
        }} />
      ))}

      {/* static pulsing hairlines */}
      {["20%", "50%", "78%"].map((t, i) => (
        <div key={`s${i}`} style={{
          position: "absolute",
          top: t, left: "6%", right: "6%",
          height: "0.5px",
          background: `linear-gradient(90deg,
            transparent 0%,
            ${G.goldMid}20 10%,
            ${G.goldMid}55 35%,
            ${G.goldLight}75 50%,
            ${G.goldMid}55 65%,
            ${G.goldMid}20 90%,
            transparent 100%)`,
          animation: `goldPulse ${3.5 + i * 0.9}s ${i * 0.7}s infinite ease-in-out`,
        }} />
      ))}

      {/* corner glow orbs */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: `radial-gradient(circle, ${G.goldMid}18 0%, transparent 70%)`,
        animation: "floatY 6s 0s infinite ease-in-out",
      }} />
      <div style={{
        position: "absolute", bottom: -40, left: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: `radial-gradient(circle, ${G.goldPale}25 0%, transparent 70%)`,
        animation: "floatY 8s 2s infinite ease-in-out",
      }} />
    </div>
  );
}

// ─── THEME TOGGLE BUTTON ──────────────────────────────────────────────────────
function ThemeToggle({ dark, toggle, G }) {
  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      style={{
        width: 40, height: 22,
        borderRadius: 99,
        background: dark
          ? `linear-gradient(90deg, ${G.goldMid}, ${G.goldDeep})`
          : G.bgAlt,
        border: `1.5px solid ${G.bordMid}`,
        position: "relative",
        transition: "all 0.3s ease",
        flexShrink: 0,
        boxShadow: dark ? `0 0 8px ${G.goldMid}40` : "none",
      }}
    >
      <div style={{
        position: "absolute",
        top: 2,
        left: dark ? "calc(100% - 18px)" : 2,
        width: 14, height: 14, borderRadius: "50%",
        background: dark ? G.ink : G.goldMid,
        transition: "left 0.3s ease, background 0.3s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 8,
      }}>
        {dark ? "☀" : "☾"}
      </div>
    </button>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Ic = {
  Google: () => (
    <svg width="17" height="17" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Signout: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Ledger: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
      <line x1="9" y1="9" x2="9" y2="21"/>
    </svg>
  ),
  Person: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Star: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Assistant: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  ),
};

// ─── RICHTEXT ─────────────────────────────────────────────────────────────────
function RichText({ text, G }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} style={{ fontWeight: 600, color: G.goldMid }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

// ─── TYPING DOTS ──────────────────────────────────────────────────────────────
function TypingDots({ G }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%",
          background: G.goldMid, display: "inline-block",
          animation: `bounceY 0.9s ${i * 0.18}s infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

// ─── GOLD RULE ────────────────────────────────────────────────────────────────
function GoldRule({ G, my = 0, opacity = 1 }) {
  return (
    <div style={{
      height: 1, margin: `${my}px 0`, opacity,
      background: `linear-gradient(90deg, transparent, ${G.goldMid}50, ${G.goldLight}70, ${G.goldMid}50, transparent)`,
    }} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function LoginPage({ G, dark, toggleTheme }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const facts = [
    {
      num: "01",
      head: "Log in plain language",
      body: "Type \"Add ₹1,400 for electricity bill\" — it extracts the amount, description, and timestamps it against your account.",
    },
    {
      num: "02",
      head: "Query any time window",
      body: "Ask \"Show my expenses from June 1–15 between 9am and 7pm.\" The agent filters to the exact range and returns a total.",
    },
    {
      num: "03",
      head: "Period summaries on demand",
      body: "Request last week, last month, or a custom span. Receive an itemised list with a running total — no dashboards, no setup.",
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: G.bg,
      overflow: "hidden",
      transition: "background 0.35s ease",
    }}>

      {/* ════════════ LEFT PANEL ════════════ */}
      <div className="hide-tab" style={{
        flex: "0 0 52%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 60px",
        background: G.bg,
        borderRight: `1px solid ${G.bordSoft}`,
        overflow: "hidden",
      }}>
        <GoldBars G={G} />

        {/* wordmark */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 6,
              border: `1.5px solid ${G.goldMid}`,
              background: G.goldGhost,
              display: "flex", alignItems: "center",
              justifyContent: "center", color: G.gold,
              boxShadow: `0 0 20px ${G.goldMid}20`,
              transition: "background 0.35s, border-color 0.35s",
            }}>
              <Ic.Ledger />
            </div>
            <div>
              <div className="cormorant" style={{
                fontSize: 22, fontWeight: 500,
                color: G.ink, letterSpacing: "0.06em", lineHeight: 1,
              }}>
                ExpenseIQ
              </div>
              <div className="mono" style={{
                fontSize: 9, color: G.inkGhost,
                letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 3,
              }}>
                Personal Finance Agent
              </div>
            </div>
          </div>
        </div>

        {/* main statement */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {/* animated gold accent bar */}
          <div style={{
            width: 64, height: 2.5, marginBottom: 36,
            background: `linear-gradient(90deg, ${G.goldDeep}, ${G.goldMid}, ${G.goldLight})`,
            backgroundSize: "200% 100%",
            animation: "shimmerBar 2.5s linear infinite",
            borderRadius: 2,
          }} />

          <h1 className="cormorant" style={{
            fontSize: "clamp(40px, 4.2vw, 62px)",
            fontWeight: 300,
            lineHeight: 1.13,
            letterSpacing: "-0.3px",
            color: G.ink,
            marginBottom: 22,
            animation: "fadeUp 0.7s 0.1s ease both",
            animationFillMode: "both",
          }}>
            Every rupee you spend,<br />
            <span style={{
              fontStyle: "italic",
              background: `linear-gradient(135deg, ${G.goldDeep}, ${G.goldMid}, ${G.goldLight})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              perfectly recorded.
            </span>
          </h1>

          <p style={{
            fontSize: 15.5, fontWeight: 300,
            color: G.inkLight, lineHeight: 1.78,
            maxWidth: 400, marginBottom: 52,
            animation: "fadeUp 0.7s 0.2s ease both",
            animationFillMode: "both",
          }}>
            Tell the agent what you spent. Ask what you've been spending on.
            Get precise answers — no spreadsheets, no manual forms.
          </p>

          {/* fact rows */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {facts.map((f, i) => (
              <div key={i} style={{
                animation: `fadeUp 0.6s ${0.25 + i * 0.13}s ease both`,
                animationFillMode: "both",
              }}>
                {i === 0 && <GoldRule G={G} />}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr",
                  gap: "0 14px",
                  padding: "18px 0",
                }}>
                  <div className="mono" style={{
                    fontSize: 10, color: G.goldMid,
                    letterSpacing: "0.14em", paddingTop: 2,
                    textTransform: "uppercase",
                  }}>
                    {f.num}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: G.ink, marginBottom: 5, letterSpacing: "-0.1px",
                    }}>
                      {f.head}
                    </div>
                    <div style={{
                      fontSize: 13, color: G.inkLight,
                      lineHeight: 1.68, fontWeight: 300,
                    }}>
                      {f.body}
                    </div>
                  </div>
                </div>
                <GoldRule G={G} />
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <p className="mono" style={{
            fontSize: 10, color: G.inkGhost,
            letterSpacing: "0.09em",
          }}>
            Your data is isolated per account — never shared, never pooled.
          </p>
        </div>
      </div>

      {/* ════════════ RIGHT PANEL ════════════ */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px clamp(20px, 6vw, 60px)",
        background: G.bgAlt,
        position: "relative",
        overflow: "hidden",
        transition: "background 0.35s ease",
      }}>
        {/* subtle dot texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          opacity: dark ? 0.04 : 0.035,
          backgroundImage: `radial-gradient(${G.goldMid} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }} />

        {/* gold glow top-right */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 240, height: 240, borderRadius: "50%",
          background: `radial-gradient(circle, ${G.goldMid}15 0%, transparent 70%)`,
          animation: "floatY 7s 1s infinite ease-in-out",
          pointerEvents: "none",
        }} />

        {/* theme toggle — top right */}
        <div style={{
          position: "absolute", top: 20, right: 20,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span className="mono" style={{ fontSize: 9.5, color: G.inkGhost, letterSpacing: "0.1em" }}>
            {dark ? "DARK" : "LIGHT"}
          </span>
          <ThemeToggle dark={dark} toggle={toggleTheme} G={G} />
        </div>

        <div style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 380,
          animation: "scaleReveal 0.55s 0.1s ease both",
          animationFillMode: "both",
        }}>
          {/* mobile wordmark */}
          <div className="show-mob" style={{
            display: "flex",
            flexDirection: "column", alignItems: "center",
            marginBottom: 36, gap: 10,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 8,
              border: `1.5px solid ${G.goldMid}`,
              background: G.goldGhost,
              display: "flex", alignItems: "center",
              justifyContent: "center", color: G.gold,
            }}>
              <Ic.Ledger />
            </div>
            <div className="cormorant" style={{
              fontSize: 24, fontWeight: 500,
              color: G.ink, letterSpacing: "0.05em",
            }}>
              ExpenseIQ
            </div>
            <div className="mono" style={{
              fontSize: 9, color: G.inkGhost,
              letterSpacing: "0.2em", textTransform: "uppercase",
            }}>
              Personal Finance Agent
            </div>
          </div>

          {/* auth card */}
          <div style={{
            background: G.surface,
            border: `1px solid ${G.bordSoft}`,
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: G.shadowLg,
            transition: "background 0.35s, border-color 0.35s, box-shadow 0.35s",
          }}>
            {/* shimmer gold top bar */}
            <div style={{
              height: 3,
              background: `linear-gradient(90deg,
                ${G.goldDeep}, ${G.goldMid}, ${G.goldLight}, ${G.goldMid}, ${G.goldDeep})`,
              backgroundSize: "300% 100%",
              animation: "shimmerBar 2.8s linear infinite",
            }} />

            <div style={{ padding: "34px 30px 30px" }}>
              {/* heading */}
              <h2 className="cormorant" style={{
                fontSize: 30, fontWeight: 400,
                color: G.ink, letterSpacing: "-0.2px",
                marginBottom: 8, lineHeight: 1.2,
              }}>
                Sign in to continue
              </h2>
              <p style={{
                fontSize: 13.5, color: G.inkLight,
                fontWeight: 300, lineHeight: 1.65,
                marginBottom: 26,
              }}>
                Your Google account is used only for identity verification. No Gmail or Drive access is requested.
              </p>

              <GoldRule G={G} my={0} />

              {/* query examples */}
              <div style={{ margin: "18px 0 22px" }}>
                <p className="mono" style={{
                  fontSize: 9.5, color: G.goldDeep,
                  letterSpacing: "0.16em", textTransform: "uppercase",
                  marginBottom: 14,
                }}>
                  What you can ask after sign-in
                </p>
                {[
                  "Add ₹1,200 for monthly grocery run",
                  "Show expenses from June 1 to June 15",
                  "What did I spend last week between 9am–6pm?",
                ].map((q, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 9,
                    padding: "8px 0",
                    borderBottom: i < 2 ? `1px solid ${G.bordHair}` : "none",
                  }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                      background: G.goldGhost,
                      border: `1px solid ${G.bordSoft}`,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      color: G.goldMid, marginTop: 1,
                    }}>
                      <Ic.Star />
                    </span>
                    <span className="mono" style={{
                      fontSize: 11.5, color: G.inkMid,
                      lineHeight: 1.55, fontStyle: "italic",
                    }}>
                      "{q}"
                    </span>
                  </div>
                ))}
              </div>

              <GoldRule G={G} my={0} />

              {/* google button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: 22,
                  padding: "13px 20px",
                  background: loading ? G.surfaceAlt : G.surface,
                  border: `1.5px solid ${loading ? G.bordSoft : G.bordMid}`,
                  borderRadius: 11,
                  color: G.ink,
                  fontSize: 14.5, fontWeight: 600,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 10,
                  transition: "all 0.2s ease",
                  letterSpacing: "-0.1px",
                  boxShadow: loading ? "none" : `0 2px 8px ${G.goldMid}18`,
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = G.bordStr;
                    e.currentTarget.style.background  = G.goldGhost;
                    e.currentTarget.style.boxShadow   = `0 0 0 3px ${G.goldPale}60, 0 2px 8px ${G.goldMid}25`;
                  }
                }}
                onMouseLeave={e => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = G.bordMid;
                    e.currentTarget.style.background  = G.surface;
                    e.currentTarget.style.boxShadow   = `0 2px 8px ${G.goldMid}18`;
                  }
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 16, height: 16,
                      border: `2px solid ${G.bordSoft}`,
                      borderTopColor: G.gold,
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.75s linear infinite",
                    }} />
                    Redirecting to Google…
                  </>
                ) : (
                  <>
                    <Ic.Google />
                    Continue with Google
                  </>
                )}
              </button>

              {error && (
                <div style={{
                  marginTop: 14, padding: "10px 14px",
                  background: G.redBg,
                  border: `1px solid ${G.red}25`,
                  borderRadius: 8,
                  fontSize: 13, color: G.red, textAlign: "center",
                }}>
                  {error}
                </div>
              )}

              <p style={{
                marginTop: 18,
                fontSize: 11.5, color: G.inkGhost,
                textAlign: "center", lineHeight: 1.6, fontWeight: 300,
              }}>
                Your expense data is stored securely and is only accessible to you.
              </p>
            </div>
          </div>

          {/* trust badges */}
          <div style={{
            display: "flex", justifyContent: "center",
            flexWrap: "wrap", gap: "10px 24px",
            marginTop: 22,
          }}>
            {["Encrypted", "India ₹ Ready", "Private Data"].map((b, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 11.5, color: G.inkGhost, fontWeight: 400,
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: G.goldGhost,
                  border: `1px solid ${G.bordSoft}`,
                  display: "inline-flex", alignItems: "center",
                  justifyContent: "center", color: G.goldMid,
                }}>
                  <Ic.Star />
                </span>
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CHAT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function ChatPage({ user, userId, onLogout, G, dark, toggleTheme }) {
  const [prompt,   setPrompt]   = useState("");
  const [messages, setMessages] = useState([{
    role: "assistant",
    content:
      `Hello${user.user_metadata?.full_name
        ? ", " + user.user_metadata.full_name.split(" ")[0]
        : ""}.\n\n` +
      `I'm your expense agent. Here is what I can do for you:\n\n` +
      `• **Log an expense** — "Add ₹600 for fuel"\n` +
      `• **View history** — "Show my last month's expenses"\n` +
      `• **Date-range filter** — "Expenses from June 1 to June 15"\n` +
      `• **Time-window filter** — "Expenses between 9am and 6pm last week"\n` +
      `• **Banking queries** — Interest rates, loan types, savings accounts`,
  }]);
  const [loading,  setLoading]  = useState(false);
  const [sessionId]             = useState(() => crypto.randomUUID());
  const chatEndRef              = useRef(null);
  const textareaRef             = useRef(null);

  const displayName   = user.user_metadata?.full_name?.split(" ")[0]
    || user.email?.split("@")[0] || "User";
  const avatarInitial = displayName[0].toUpperCase();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [prompt]);

  const sendMessage = useCallback(async () => {
    const text = prompt.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setPrompt("");
    setLoading(true);
    try {
      const res  = await fetch("http://127.0.0.1:8000/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt: text, session_id: sessionId, user_id: userId }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: data.response ?? data.error ?? "Unexpected response.",
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: "Could not reach the server. Please ensure the backend is running on port 8000.",
      }]);
    }
    setLoading(false);
    textareaRef.current?.focus();
  }, [prompt, loading, sessionId, userId]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const suggestions = [
    "Show last month's expenses",
    "Add ₹350 for lunch",
    "Expenses from June 1–15",
    "Total spending this week",
  ];

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: G.bg, overflow: "hidden",
      transition: "background 0.35s ease",
    }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(14px, 4vw, 28px)",
        height: 58, flexShrink: 0,
        background: G.headerBg,
        borderBottom: `1px solid ${G.bordSoft}`,
        position: "relative",
        transition: "background 0.35s, border-color 0.35s",
      }}>
        {/* animated gold bottom edge */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${G.goldMid}40, ${G.goldLight}60, ${G.goldMid}40, transparent)`,
          animation: "goldPulse 3.5s infinite ease-in-out",
        }} />

        {/* brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            border: `1.5px solid ${G.goldMid}`,
            background: G.goldGhost,
            display: "flex", alignItems: "center",
            justifyContent: "center", color: G.gold,
            transition: "background 0.35s, border-color 0.35s",
          }}>
            <Ic.Ledger />
          </div>
          <div className="cormorant" style={{
            fontSize: 18, fontWeight: 500,
            color: G.ink, letterSpacing: "0.04em",
          }}>
            ExpenseIQ
          </div>
        </div>

        {/* right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* theme toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span className="mono hide-mob" style={{
              fontSize: 9.5, color: G.inkGhost, letterSpacing: "0.1em",
            }}>
              {dark ? "DARK" : "LIGHT"}
            </span>
            <ThemeToggle dark={dark} toggle={toggleTheme} G={G} />
          </div>

          {/* user pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "4px 10px 4px 5px",
            background: G.bgAlt,
            border: `1px solid ${G.bordSoft}`,
            borderRadius: 99,
            transition: "background 0.35s, border-color 0.35s",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: user.user_metadata?.avatar_url ? "transparent" : G.goldGhost,
              border: `1.5px solid ${G.bordMid}`,
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: G.gold,
            }}>
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt={avatarInitial}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : avatarInitial
              }
            </div>
            <span className="hide-mob" style={{
              fontSize: 13, fontWeight: 500, color: G.inkMid,
            }}>
              {displayName}
            </span>
          </div>

          {/* logout */}
          <button
            onClick={onLogout}
            title="Sign out"
            style={{
              width: 32, height: 32, borderRadius: 7,
              background: "transparent",
              border: `1px solid ${G.bordSoft}`,
              color: G.inkGhost,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = G.redBg;
              e.currentTarget.style.borderColor = `${G.red}30`;
              e.currentTarget.style.color       = G.red;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = "transparent";
              e.currentTarget.style.borderColor = G.bordSoft;
              e.currentTarget.style.color       = G.inkGhost;
            }}
          >
            <Ic.Signout />
          </button>
        </div>
      </header>

      {/* ── MESSAGES ───────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "clamp(16px, 3vw, 28px) clamp(12px, 8vw, 72px)",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            alignItems: "flex-end", gap: 9,
            animation: i === messages.length - 1 ? "fadeUp 0.26s ease both" : "none",
          }}>
            {/* avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: msg.role === "user"
                ? (user.user_metadata?.avatar_url ? "transparent" : G.goldGhost)
                : G.surfaceAlt,
              border: `1.5px solid ${msg.role === "user" ? G.bordMid : G.bordSoft}`,
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700,
              color: msg.role === "user" ? G.gold : G.inkGhost,
            }}>
              {msg.role === "user"
                ? (user.user_metadata?.avatar_url
                    ? <img src={user.user_metadata.avatar_url} alt={avatarInitial}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : avatarInitial
                  )
                : <Ic.Assistant />
              }
            </div>

            {/* bubble */}
            <div style={{
              maxWidth: "clamp(220px, 70%, 580px)",
              padding: "11px 16px",
              borderRadius: msg.role === "user"
                ? "14px 14px 3px 14px"
                : "14px 14px 14px 3px",
              background: msg.role === "user" ? G.msgUser : G.msgBot,
              border: msg.role === "user"
                ? `1px solid ${G.bordMid}`
                : `1px solid ${G.bordSoft}`,
              boxShadow: msg.role === "user"
                ? `0 4px 14px ${G.goldMid}15`
                : G.shadow,
              fontSize: "clamp(13px, 1.8vw, 14px)",
              lineHeight: 1.72,
              color: msg.role === "user" ? G.msgUserTxt : G.msgBotTxt,
              fontWeight: 300,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              transition: "background 0.35s, border-color 0.35s",
            }}>
              <RichText text={msg.content} G={G} />
            </div>
          </div>
        ))}

        {/* typing */}
        {loading && (
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 9,
            animation: "fadeIn 0.2s ease both",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: G.surfaceAlt,
              border: `1.5px solid ${G.bordSoft}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: G.inkGhost, flexShrink: 0,
            }}>
              <Ic.Assistant />
            </div>
            <div style={{
              padding: "12px 16px",
              borderRadius: "14px 14px 14px 3px",
              background: G.msgBot,
              border: `1px solid ${G.bordSoft}`,
              boxShadow: G.shadow,
            }}>
              <TypingDots G={G} />
            </div>
          </div>
        )}

        {/* suggestion chips */}
        {messages.length <= 1 && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4,
            animation: "fadeUp 0.4s 0.25s ease both",
            animationFillMode: "both", opacity: 0,
          }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { setPrompt(s); textareaRef.current?.focus(); }}
                style={{
                  padding: "7px 13px",
                  background: G.surface,
                  border: `1px solid ${G.bordSoft}`,
                  borderRadius: 99,
                  color: G.inkLight,
                  fontSize: 12.5, fontWeight: 400,
                  transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", gap: 5,
                  boxShadow: G.shadow,
                  letterSpacing: "-0.1px",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = G.bordMid;
                  e.currentTarget.style.background  = G.goldGhost;
                  e.currentTarget.style.color       = G.goldDeep;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = G.bordSoft;
                  e.currentTarget.style.background  = G.surface;
                  e.currentTarget.style.color       = G.inkLight;
                }}
              >
                <Ic.Arrow />{s}
              </button>
            ))}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── INPUT BAR ──────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${G.bordSoft}`,
        background: G.headerBg,
        padding: "12px clamp(12px, 8vw, 72px) 16px",
        flexShrink: 0, position: "relative",
        transition: "background 0.35s, border-color 0.35s",
      }}>
        {/* top gold glow */}
        <div style={{
          position: "absolute", top: 0, left: "12%", right: "12%", height: 1,
          background: `linear-gradient(90deg, transparent, ${G.goldMid}45, ${G.goldLight}65, ${G.goldMid}45, transparent)`,
          animation: "goldPulse 4s infinite ease-in-out",
        }} />

        <div style={{
          display: "flex", alignItems: "flex-end", gap: 10,
          background: G.inputBg,
          border: `1.5px solid ${G.bordSoft}`,
          borderRadius: 12, padding: "10px 10px 10px 16px",
          transition: "border-color 0.2s, box-shadow 0.2s, background 0.35s",
        }}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = G.bordMid;
            e.currentTarget.style.boxShadow   = `0 0 0 3px ${G.goldPale}50`;
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = G.bordSoft;
            e.currentTarget.style.boxShadow   = "none";
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKey}
            placeholder="e.g. Add ₹800 for dinner, or show last week's expenses…"
            style={{
              flex: 1, background: "transparent",
              color: G.ink,
              fontSize: "clamp(13px, 1.8vw, 14px)",
              lineHeight: 1.55, resize: "none", border: "none",
              fontFamily: "'Outfit', system-ui, sans-serif",
              maxHeight: 120, overflowY: "auto", paddingTop: 2,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!prompt.trim() || loading}
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: !prompt.trim() || loading ? G.surfaceAlt : G.ink,
              color: !prompt.trim() || loading ? G.inkGhost : G.goldLight,
              border: `1px solid ${!prompt.trim() || loading ? G.bordSoft : G.bordMid}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s ease",
              boxShadow: prompt.trim() && !loading
                ? `0 2px 10px ${G.goldMid}25` : "none",
            }}
            onMouseEnter={e => {
              if (prompt.trim() && !loading) {
                e.currentTarget.style.background  = G.goldDeep;
                e.currentTarget.style.borderColor = G.goldMid;
                e.currentTarget.style.color       = G.goldLight;
              }
            }}
            onMouseLeave={e => {
              if (prompt.trim() && !loading) {
                e.currentTarget.style.background  = G.ink;
                e.currentTarget.style.borderColor = G.bordMid;
                e.currentTarget.style.color       = G.goldLight;
              }
            }}
          >
            <Ic.Send />
          </button>
        </div>

        <p className="mono" style={{
          fontSize: 10, color: G.inkGhost,
          textAlign: "center", marginTop: 8,
          letterSpacing: "0.05em",
        }}>
          Enter to send · Shift + Enter for new line · Your data is private
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [session,     setSession]     = useState(null);
  const [userId,      setUserId]      = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dark,        setDark]        = useState(false);

  const G = dark ? DARK : LIGHT;

  const toggleTheme = useCallback(() => setDark(d => !d), []);

  const ensureUser = useCallback(async (user) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .upsert(
          { id: user.id, email: user.email, name: user.user_metadata?.full_name || null },
          { onConflict: "id", ignoreDuplicates: true }
        )
        .select("id")
        .single();

      if (!error && data) { setUserId(data.id); return; }

      const { data: existing, error: fe } = await supabase
        .from("users").select("id").eq("id", user.id).single();
      if (!fe && existing) { setUserId(existing.id); return; }

      setUserId(user.id);
    } catch {
      setUserId(user.id);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) ensureUser(session.user);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) ensureUser(session.user);
        else setUserId(null);
      }
    );
    return () => subscription.unsubscribe();
  }, [ensureUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserId(null);
  };

  // auth loading
  if (authLoading) {
    return (
      <>
        <style>{makeCSS(G)}</style>
        <div style={{
          height: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: G.bg, gap: 20,
          transition: "background 0.35s",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            border: `1.5px solid ${G.goldMid}`,
            background: G.goldGhost,
            display: "flex", alignItems: "center",
            justifyContent: "center", color: G.gold,
          }}>
            <Ic.Ledger />
          </div>
          <div style={{
            width: 18, height: 18,
            border: `2px solid ${G.bordSoft}`,
            borderTopColor: G.goldMid,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p className="mono" style={{
            fontSize: 10.5, color: G.inkGhost, letterSpacing: "0.12em",
          }}>
            Authenticating…
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{makeCSS(G)}</style>
      {!session || !session.user
        ? <LoginPage G={G} dark={dark} toggleTheme={toggleTheme} />
        : <ChatPage
            user={session.user}
            userId={userId || session.user.id}
            onLogout={handleLogout}
            G={G}
            dark={dark}
            toggleTheme={toggleTheme}
          />
      }
    </>
  );
}
