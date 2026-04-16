import { useState } from "react";

const API_URL = "/api/generate";

const WORD_COUNT_OPTIONS = [6, 9, 12, 18, 24];

const placeholderExamples = {
  what: "e.g. my birthday, a doctor visit, going to the store",
  who: "e.g. my doctor, my family, a stranger, my friend",
  where: "e.g. at home, at the hospital, at a restaurant",
};

const categoryColors = {
  "Actions": "#4A7C6F",
  "People": "#7C6F4A",
  "Places": "#4A5E7C",
  "Feelings": "#7C4A6A",
  "Objects / Things": "#4A7C56",
  "Phrases": "#6B4A7C",
  "Questions": "#7C5A4A",
  "Other": "#5A7C7C",
};

const getColor = (category) =>
  categoryColors[category] || "#5A6A7C";

export default function ConversationWordBank() {
  const [what, setWhat] = useState("");
  const [who, setWho] = useState("");
  const [where, setWhere] = useState("");
  const [wordCount, setWordCount] = useState(12);
  const [wordBank, setWordBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [spoken, setSpoken] = useState(null);

  const canGenerate = what.trim() || who.trim() || where.trim();

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.85;
      utter.pitch = 1;
      window.speechSynthesis.speak(utter);
      setSpoken(text);
      setTimeout(() => setSpoken(null), 2000);
    }
  };

  const buildPrompt = () => {
    const parts = [];
    if (what.trim()) parts.push(`Topic: "${what.trim()}"`);
    if (who.trim()) parts.push(`Talking to: "${who.trim()}"`);
    if (where.trim()) parts.push(`Location: "${where.trim()}"`);

    return `You are helping a person with aphasia prepare for a conversation. Generate exactly ${wordCount} words or short phrases they might want to use, grouped into categories.

Context provided:
${parts.join("\n")}

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "title": "A short 3-6 word title for this word bank",
  "groups": [
    {
      "category": "Category Name",
      "items": ["word or phrase", "word or phrase"]
    }
  ]
}

Rules:
- Exactly ${wordCount} total items across all groups
- Use simple, everyday language
- Short phrases are fine (2-4 words max)
- Categories should be relevant (e.g. Actions, Feelings, People, Places, Objects / Things, Phrases, Questions)
- 2–5 items per category, spread naturally
- Items should be genuinely useful for the conversation context given
- Do not number items
- No punctuation at the end of items`;
  };

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setWordBank(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: buildPrompt() }],
        }),
      });

      const data = await res.json();
      const raw = data.content?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setWordBank(parsed);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setWordBank(null);
    setWhat("");
    setWho("");
    setWhere("");
    setWordCount(12);
    setError(null);
  };

  const allItems = wordBank
    ? wordBank.groups.flatMap((g) => g.items)
    : [];

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <header style={styles.header}>
        <div style={styles.logoMark}>💬</div>
        <div>
          <h1 style={styles.title}>Conversation Word Bank</h1>
          <p style={styles.subtitle}>Build a word list to help you talk</p>
        </div>
      </header>

      {!wordBank ? (
        <div style={styles.formCard}>
          <p style={styles.formIntro}>
            Fill in what you can. You only need to answer <strong>one</strong> question.
          </p>

          <div style={styles.fields}>
            {/* WHAT */}
            <div style={styles.field}>
              <label style={styles.label}>
                <span style={styles.labelIcon}>📌</span>
                <span style={styles.labelMain}>What</span>
                <span style={styles.labelSub}>What do you want to talk about?</span>
              </label>
              <input
                style={styles.input}
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                placeholder={placeholderExamples.what}
                maxLength={80}
              />
            </div>

            {/* WHO */}
            <div style={styles.field}>
              <label style={styles.label}>
                <span style={styles.labelIcon}>👤</span>
                <span style={styles.labelMain}>Who</span>
                <span style={styles.labelSub}>Who are you talking to?</span>
              </label>
              <input
                style={styles.input}
                value={who}
                onChange={(e) => setWho(e.target.value)}
                placeholder={placeholderExamples.who}
                maxLength={80}
              />
            </div>

            {/* WHERE */}
            <div style={styles.field}>
              <label style={styles.label}>
                <span style={styles.labelIcon}>📍</span>
                <span style={styles.labelMain}>Where</span>
                <span style={styles.labelSub}>Where will you be talking?</span>
              </label>
              <input
                style={styles.input}
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder={placeholderExamples.where}
                maxLength={80}
              />
            </div>

            {/* WORD COUNT */}
            <div style={styles.field}>
              <label style={styles.label}>
                <span style={styles.labelIcon}>🔢</span>
                <span style={styles.labelMain}>How many words?</span>
                <span style={styles.labelSub}>Choose the size of your word bank</span>
              </label>
              <div style={styles.countOptions}>
                {WORD_COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    style={{
                      ...styles.countBtn,
                      ...(wordCount === n ? styles.countBtnActive : {}),
                    }}
                    onClick={() => setWordCount(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            style={{
              ...styles.generateBtn,
              ...(!canGenerate ? styles.generateBtnDisabled : {}),
            }}
            onClick={generate}
            disabled={!canGenerate || loading}
            className="generate-btn"
          >
            {loading ? (
              <span style={styles.loadingRow}>
                <span className="spinner" />
                Building your word bank…
              </span>
            ) : (
              "✨ Build My Word Bank"
            )}
          </button>

          {!canGenerate && (
            <p style={styles.hint}>
              Please fill in at least one field above
            </p>
          )}
        </div>
      ) : (
        <div style={styles.resultArea}>
          <div style={styles.resultHeader}>
            <div>
              <h2 style={styles.bankTitle}>{wordBank.title}</h2>
              <p style={styles.bankMeta}>
                {allItems.length} words · Tap any word to hear it
              </p>
            </div>
            <button style={styles.newBtn} onClick={reset} className="new-btn">
              ← New List
            </button>
          </div>

          <div style={styles.groups}>
            {wordBank.groups.map((group) => (
              <div key={group.category} style={styles.group}>
                <div
                  style={{
                    ...styles.groupHeader,
                    borderLeftColor: getColor(group.category),
                  }}
                >
                  <span
                    style={{
                      ...styles.groupDot,
                      background: getColor(group.category),
                    }}
                  />
                  {group.category}
                </div>
                <div style={styles.chips}>
                  {group.items.map((item) => (
                    <button
                      key={item}
                      style={{
                        ...styles.chip,
                        borderColor: getColor(group.category),
                        background:
                          spoken === item
                            ? getColor(group.category)
                            : "white",
                        color:
                          spoken === item
                            ? "white"
                            : styles.chip.color,
                      }}
                      onClick={() => speak(item)}
                      className="chip"
                    >
                      <span style={styles.chipSpeaker}>
                        {spoken === item ? "🔊" : "▶"}
                      </span>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.printRow}>
            <button
              style={styles.printBtn}
              onClick={() => window.print()}
              className="print-btn"
            >
              🖨 Print Word Bank
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #F5F0E8 0%, #EEF3EE 50%, #E8EFF5 100%)",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    padding: "24px 16px 60px",
    maxWidth: 680,
    margin: "0 auto",
    color: "#2C3E35",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
    paddingBottom: 20,
    borderBottom: "2px solid rgba(74, 124, 111, 0.2)",
  },
  logoMark: {
    fontSize: 48,
    lineHeight: 1,
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
  },
  title: {
    margin: 0,
    fontSize: "clamp(22px, 5vw, 30px)",
    fontWeight: 700,
    color: "#2C3E35",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 15,
    color: "#6A8A7E",
    fontStyle: "italic",
  },
  formCard: {
    background: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    padding: "28px 24px",
    boxShadow: "0 4px 24px rgba(44,62,53,0.08), 0 1px 3px rgba(44,62,53,0.05)",
    backdropFilter: "blur(8px)",
  },
  formIntro: {
    fontSize: 16,
    color: "#4A6A5A",
    marginBottom: 24,
    lineHeight: 1.6,
    borderLeft: "3px solid #4A7C6F",
    paddingLeft: 14,
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  label: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    flexWrap: "wrap",
  },
  labelIcon: {
    fontSize: 18,
  },
  labelMain: {
    fontSize: 18,
    fontWeight: 700,
    color: "#2C3E35",
    letterSpacing: "-0.3px",
  },
  labelSub: {
    fontSize: 13,
    color: "#7A9A8A",
    fontStyle: "italic",
    fontFamily: "Georgia, serif",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: 16,
    border: "2px solid #C8D8D0",
    borderRadius: 12,
    background: "#FAFCFB",
    color: "#2C3E35",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    fontFamily: "Georgia, serif",
  },
  countOptions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  countBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    border: "2px solid #C8D8D0",
    background: "#FAFCFB",
    fontSize: 18,
    fontWeight: 600,
    color: "#5A8A7A",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "Georgia, serif",
  },
  countBtnActive: {
    background: "#4A7C6F",
    borderColor: "#4A7C6F",
    color: "white",
    transform: "scale(1.05)",
    boxShadow: "0 3px 10px rgba(74,124,111,0.35)",
  },
  generateBtn: {
    marginTop: 28,
    width: "100%",
    padding: "18px 24px",
    fontSize: 18,
    fontWeight: 700,
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #4A7C6F 0%, #3A6A5A 100%)",
    color: "white",
    cursor: "pointer",
    letterSpacing: "-0.3px",
    transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
    boxShadow: "0 4px 16px rgba(74,124,111,0.35)",
    fontFamily: "Georgia, serif",
  },
  generateBtnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  hint: {
    textAlign: "center",
    fontSize: 13,
    color: "#9AB0A6",
    marginTop: 10,
    fontStyle: "italic",
  },
  error: {
    color: "#C0392B",
    background: "#FEF0EE",
    border: "1px solid #E8C0BB",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14,
    marginTop: 16,
  },
  resultArea: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    background: "rgba(255,255,255,0.85)",
    borderRadius: 16,
    padding: "20px 22px",
    boxShadow: "0 2px 12px rgba(44,62,53,0.07)",
  },
  bankTitle: {
    margin: 0,
    fontSize: "clamp(18px, 4vw, 24px)",
    fontWeight: 700,
    color: "#2C3E35",
    letterSpacing: "-0.4px",
  },
  bankMeta: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#7A9A8A",
    fontStyle: "italic",
  },
  newBtn: {
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 10,
    border: "2px solid #4A7C6F",
    background: "white",
    color: "#4A7C6F",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
    fontFamily: "Georgia, serif",
  },
  groups: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  group: {
    background: "rgba(255,255,255,0.88)",
    borderRadius: 16,
    padding: "18px 20px",
    boxShadow: "0 2px 10px rgba(44,62,53,0.06)",
  },
  groupHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#4A6A5A",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 14,
    borderLeft: "3px solid",
    paddingLeft: 10,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 18px",
    fontSize: 17,
    fontWeight: 500,
    borderRadius: 50,
    border: "2px solid",
    background: "white",
    color: "#2C3E35",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "Georgia, serif",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    lineHeight: 1.2,
  },
  chipSpeaker: {
    fontSize: 12,
    opacity: 0.6,
  },
  printRow: {
    display: "flex",
    justifyContent: "center",
    paddingTop: 8,
  },
  printBtn: {
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 12,
    border: "2px solid #C8D8D0",
    background: "white",
    color: "#4A7C6F",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "Georgia, serif",
  },
};

/* ─── CSS (animations + hover states + print) ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap');

  * { box-sizing: border-box; }

  body { font-family: 'Lora', Georgia, serif; }

  input:focus {
    border-color: #4A7C6F !important;
    box-shadow: 0 0 0 3px rgba(74,124,111,0.18) !important;
  }

  input::placeholder { color: #AABFB4; }

  .generate-btn:not(:disabled):hover {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(74,124,111,0.4) !important;
  }

  .generate-btn:not(:disabled):active {
    transform: translateY(0px);
  }

  .chip:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
  }

  .chip:active {
    transform: scale(0.97);
  }

  .new-btn:hover {
    background: #4A7C6F !important;
    color: white !important;
  }

  .print-btn:hover {
    background: #F0F7F4 !important;
    border-color: #4A7C6F !important;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.35);
    border-top-color: white;
    border-radius: 50%;
    display: inline-block;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media print {
    button { display: none !important; }
    body { background: white !important; }
    .chip { border: 1px solid #ccc !important; background: white !important; font-size: 14px !important; }
  }

  @media (max-width: 480px) {
    .chip { font-size: 15px; padding: 10px 14px; }
  }
`;
