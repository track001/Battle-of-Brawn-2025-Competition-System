import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ============================================================================
 * Raffle Generator — SCC (no Tailwind, matches theme.css)
 * - Always in editable mode (no Present Mode toggle)
 * - Draw / Undo / Clear / Export CSV
 * - Upload CSV (First Name/Last Name OR Name), paste, or add one-by-one
 * - Winners auto-number + auto-scroll; remaining pool stays hidden
 * - Optional "Draw with replacement"
 * - No source-code footer
 * ============================================================================
 */

const BG = "#0b0b0b";
const CARD = "#121212";
const INK = "#f2f2f2";
const BORDER = "#222";
const SCC_RED = "#CE0201";

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Robust parser (Sheets-friendly):
 * - Accepts headers like First Name / Last Name / Name (any case/spaces)
 * - Accepts comma, semicolon, or tab separators
 * - Handles simple quoted fields
 * - Falls back to first two non-empty columns or numeric-indexed lines
 */
function parseCsvNames(csv: string): string[] {
  const raw = csv.replace(/\r/g, "");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const splitRow = (line: string) => {
    const parts: string[] = [];
    let cur = "",
      inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
        cur += ch;
        continue;
      }
      const isSep = ch === "," || ch === ";" || ch === "\t";
      if (isSep && !inQ) {
        parts.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    parts.push(cur);
    return parts.map((s) => s.replace(/^"(.*)"$/, "$1").trim());
  };

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

  const headerCols = splitRow(lines[0]);
  const headerNorm = headerCols.map(norm);

  const isFirst = (h: string) =>
    ["first", "firstname", "given", "forename", "f"].includes(h);
  const isLast = (h: string) =>
    ["last", "lastname", "surname", "familyname", "l"].includes(h);
  const isName = (h: string) =>
    ["name", "fullname", "participant", "registrant", "attendee"].includes(h);

  let firstIdx = -1,
    lastIdx = -1,
    nameIdx = -1;
  headerNorm.forEach((h, i) => {
    if (isFirst(h) && firstIdx === -1) firstIdx = i;
    if (isLast(h) && lastIdx === -1) lastIdx = i;
    if (isName(h) && nameIdx === -1) nameIdx = i;
  });

  const out: string[] = [];

  if (firstIdx >= 0 || lastIdx >= 0 || nameIdx >= 0) {
    for (let i = 1; i < lines.length; i++) {
      const cols = splitRow(lines[i]);
      let n = "";
      if (nameIdx >= 0 && cols[nameIdx]) {
        n = cols[nameIdx].trim();
      } else {
        const f = firstIdx >= 0 && cols[firstIdx] ? cols[firstIdx].trim() : "";
        const l = lastIdx >= 0 && cols[lastIdx] ? cols[lastIdx].trim() : "";
        n = `${f} ${l}`.trim();
      }
      if (n && /[a-z]/i.test(n)) out.push(n);
    }
    return out;
  }

  // Fallbacks when no recognizable headers
  for (let i = 0; i < lines.length; i++) {
    const cols = splitRow(lines[i]).filter((c) => c.trim().length > 0);
    if (cols.length === 0) continue;
    let n = "";
    if (cols.length >= 2) n = `${cols[0]} ${cols[1]}`.trim();
    else n = cols[0].trim();

    // Strip leading row numbers like "12 - Alex Kim"
    n = n.replace(/^\s*\d+\s*[-.)]*\s*/, "").trim();

    if (n && /[a-z]/i.test(n)) out.push(n);
  }
  return out;
}

export default function RaffleGenerator() {
  // state
  const [names, setNames] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [winners, setWinners] = useState<string[]>([]);
  const [withReplacement, setWithReplacement] = useState(false);

  const [title, setTitle] = useState("Raffle Generator");
  const [subTitle, setSubTitle] = useState("Springs Climbing Center");
  const [newName, setNewName] = useState("");
  const [sopOpen, setSopOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [winners.length]);

  useEffect(() => {
    if (!withReplacement) setPool(names);
  }, [names, withReplacement]);

  const canDraw = useMemo(
    () => (withReplacement ? names.length > 0 : pool.length > 0),
    [withReplacement, names.length, pool.length]
  );

  // handlers
  function handleUploadFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = parseCsvNames(text);
      if (parsed.length === 0) {
        alert(
          'No names detected in the CSV. Try headers like "First Name, Last Name" or a single "Name" column.'
        );
        return;
      }
      setNames(parsed);
      setPool(parsed);
      setWinners([]);
    };
    reader.readAsText(file);
  }

  function handleDraw() {
    if (!canDraw) return;
    const src = withReplacement ? names : pool;
    const idx = Math.floor(Math.random() * src.length);
    const chosen = src[idx];
    setWinners((prev) => [...prev, chosen]);
    if (!withReplacement) {
      const next = src.slice();
      next.splice(idx, 1);
      setPool(next);
    }
  }

  function handleUndo() {
    setWinners((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (!withReplacement) setPool((p) => [...p, last]);
      return prev.slice(0, -1);
    });
  }

  function handleClear() {
    setWinners([]);
    setPool(withReplacement ? pool : names);
  }

  function handleDownload() {
    if (winners.length === 0) return;
    const rows = ["#,Name", ...winners.map((w, i) => `${i + 1},${w}`)];
    downloadText(
      `raffle_winners_${new Date().toISOString().slice(0, 10)}.csv`,
      rows.join("\n")
    );
  }

  function addManualName() {
    const n = newName.trim();
    if (!n) return;
    setNames((prev) => [...prev, n]);
    setPool((prev) => (withReplacement ? prev : [...prev, n]));
    setNewName("");
  }

  function handlePaste(txt: string) {
    const raw = txt.replace(/\r/g, "\n");
    const parts = raw
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...names, ...parts]));
    setNames(merged);
    setPool(withReplacement ? pool : merged);
  }

  // styles
  const page: React.CSSProperties = { background: BG, color: INK };
  const wrap: React.CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 24,
  };
  const topBar: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: `1px solid ${BORDER}`,
    position: "sticky",
    top: 0,
    background: BG,
    padding: "12px 24px",
    zIndex: 5,
  };
  const byTi: React.CSSProperties = {
    marginLeft: "auto",
    fontSize: 12,
    color: "#bbb",
  };
  const card: React.CSSProperties = {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    padding: 16,
  };
  const bigNameCard: React.CSSProperties = {
    background: "#0F0F0F",
    border: "1px solid #2a2a2a",
    borderRadius: 16,
    padding: 24,
    minHeight: 120,
  };
  const drawRow: React.CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  };
  const btn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    background: "#1a1a1a",
    color: INK,
    cursor: "pointer",
  };
  const btnRed: React.CSSProperties = {
    ...btn,
    border: `1px solid ${SCC_RED}`,
  };
  const btnDisabled: React.CSSProperties = {
    ...btn,
    opacity: 0.5,
    cursor: "not-allowed",
  };
  const winnersBox: React.CSSProperties = {
    border: `1px solid #2a2a2a`,
    borderRadius: 12,
    background: "#0b0b0b",
    maxHeight: "60vh",
    overflowY: "auto",
  };
  const winnersHeader: React.CSSProperties = {
    position: "sticky",
    top: 0,
    background: BG,
    borderBottom: `1px solid #2a2a2a`,
    padding: "8px 12px",
    display: "flex",
    color: "#bbb",
  };
  const winnersRow: React.CSSProperties = {
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    borderTop: `1px solid #1b1b1b`,
  };
  const colNum: React.CSSProperties = {
    width: 48,
    color: SCC_RED,
    fontWeight: 700,
  };
  const input: React.CSSProperties = {
    width: "100%",
    background: "#0b0b0b",
    border: `1px solid ${BORDER}`,
    color: INK,
    padding: 8,
    borderRadius: 8,
  };
  const small: React.CSSProperties = { fontSize: 12, color: "#aaa" };

  return (
    <div style={page}>
      <div style={topBar}>
        <div style={{ fontWeight: 900, fontSize: 20 }}>Raffle Generator</div>
        <div style={byTi}>by Ti</div>
      </div>

      <div style={wrap}>
        {/* LIVE AREA */}
        <div style={card}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>{title}</h1>
          <div style={{ marginTop: 4, color: "#bdbdbd" }}>{subTitle}</div>

          <div style={{ marginTop: 16, ...drawRow }}>
            <button
              onClick={handleDraw}
              disabled={!canDraw}
              style={!canDraw ? btnDisabled : btnRed}
            >
              Draw Next Winner
            </button>
            <button onClick={handleUndo} style={btn}>
              Undo
            </button>
            <button onClick={handleClear} style={btn}>
              Clear List
            </button>
            <button
              onClick={handleDownload}
              style={winners.length ? btn : btnDisabled}
            >
              Download CSV
            </button>

            <label
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                gap: 8,
                alignItems: "center",
                fontSize: 14,
                color: "#bbb",
              }}
            >
              <input
                type="checkbox"
                checked={withReplacement}
                onChange={(e) => setWithReplacement(e.target.checked)}
              />
              Draw with replacement
            </label>
          </div>

          {/* Current + Winners */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr",
              gap: 16,
              marginTop: 16,
            }}
          >
            <div style={bigNameCard}>
              <div style={{ fontSize: 14, color: "#bbb", marginBottom: 6 }}>
                Current Draw
              </div>
              <div style={{ fontSize: 40, fontWeight: 900 }}>
                {winners.length ? winners[winners.length - 1] : "—"}
              </div>
              {!withReplacement && pool.length === 0 && names.length > 0 && (
                <div style={{ marginTop: 8, ...small }}>
                  All names have been drawn.
                </div>
              )}
            </div>

            <div style={winnersBox}>
              <div style={winnersHeader}>
                <div style={{ width: 48 }}>#</div>
                <div style={{ flex: 1 }}>Winner</div>
              </div>
              <div>
                {winners.map((w, i) => (
                  <div key={`${w}-${i}`} style={winnersRow}>
                    <div style={colNum}>{i + 1}</div>
                    <div style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>
                      {w}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
          </div>
        </div>

        {/* SETUP + SOP */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 16,
          }}
        >
          {/* Controls */}
          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Setup</h2>
            <div style={small}>
              Upload a CSV or paste names. Remaining pool stays hidden from the
              audience.
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div style={{ ...card, padding: 12, background: "#0e0e0e" }}>
                <div style={small}>Upload CSV (First,Last or Name)</div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleUploadFile(f);
                  }}
                  style={{ marginTop: 8 }}
                />
                <button
                  onClick={() =>
                    downloadText(
                      "raffle_sample.csv",
                      "First Name,Last Name\nAlex,Kim\nJordan,Lee\nCasey,Nguyen"
                    )
                  }
                  className="btn"
                  style={{ marginTop: 8 }}
                >
                  Download sample CSV
                </button>
              </div>

              <div style={{ ...card, padding: 12, background: "#0e0e0e" }}>
                <div style={small}>Paste names (comma or new line)</div>
                <textarea
                  placeholder={"John Smith\nChris Sharma\nAlex Honnold"}
                  onBlur={(e) => handlePaste(e.target.value)}
                  style={{
                    width: "100%",
                    height: 96,
                    marginTop: 8,
                    background: "#0b0b0b",
                    color: INK,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    padding: 8,
                  }}
                />
                <div style={small}>(Names are added on blur.)</div>
              </div>

              <div style={{ ...card, padding: 12, background: "#0e0e0e" }}>
                <div style={small}>Add one name</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="First Last"
                    style={{ flex: 1, ...input }}
                  />
                  <button onClick={addManualName} className="btn">
                    Add
                  </button>
                </div>
              </div>

              <div style={{ ...card, padding: 12, background: "#0e0e0e" }}>
                <div style={small}>Titles</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ ...input, marginTop: 8 }}
                />
                <input
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  style={{ ...input, marginTop: 8 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 8, ...small }}>
              Loaded names: <b style={{ color: "#ddd" }}>{names.length}</b>{" "}
              &nbsp;·&nbsp; Winners:{" "}
              <b style={{ color: "#ddd" }}>{winners.length}</b>
            </div>
          </div>

          {/* SOP */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h2 style={{ margin: 0, flex: 1 }}>SOP — Running the Raffle</h2>
              <button onClick={() => setSopOpen((o) => !o)} className="btn">
                {sopOpen ? "Hide" : "Show"}
              </button>
            </div>
            {sopOpen && (
              <div style={{ marginTop: 12, lineHeight: 1.6 }}>
                <ol style={{ paddingLeft: 20 }}>
                  <li>
                    Load names by <b>uploading a CSV</b> (headers:
                    <code
                      style={{
                        margin: "0 6px",
                        background: "#0b0b0b",
                        padding: "2px 6px",
                        borderRadius: 6,
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      First Name, Last Name
                    </code>
                    or
                    <code
                      style={{
                        marginLeft: 6,
                        background: "#0b0b0b",
                        padding: "2px 6px",
                        borderRadius: 6,
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      Name
                    </code>
                    ) — or paste into the box.
                  </li>
                  <li>
                    Use <b>Draw Next Winner</b>. Each draw appends to the list
                    with an automatic number label. The list <i>auto-scrolls</i>{" "}
                    so the newest winner is visible.
                  </li>
                  <li>
                    Need duplicates? Toggle <b>Draw with replacement</b>.
                    Otherwise, each person is drawn at most once.
                  </li>
                  <li>
                    Mis-clicked? Hit <b>Undo</b>. To start over, use{" "}
                    <b>Clear List</b>.
                  </li>
                  <li>
                    When finished, export via <b>Download CSV</b> for records.
                  </li>
                </ol>
                <hr style={{ borderColor: BORDER, margin: "12px 0" }} />
                <div style={small}>
                  <b>Note:</b> The remaining pool is never shown to the
                  audience.
                </div>
                <div style={small}>
                  CSV is optional — you can paste or add names one-by-one
                  anytime.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
