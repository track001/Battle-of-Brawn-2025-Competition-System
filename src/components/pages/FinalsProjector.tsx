import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Battle of Brawn — Finals Projector (React/TSX)
 * Feature parity to PS/WPF build:
 * - ManualFinalists + PerRowIds
 * - Edit + Pips + PixelWidth
 * - AutoPause-on-edit (resume after 600ms idle)
 * - OverlayBlackout (Top-Right Exit only + B / ESC / Click)
 * - Credits "by Ti"
 * - Stealth (no extra chrome), Tilt, Footer (stable with clock)
 * - SOP + Developer Panel (wrap/copy/download .ps1 from /public)
 */

/* =========================
   Types & Constants
   ========================= */

type ScoreParse = {
  T: number;
  Z: number;
  AT: number;
  AZ: number;
  ShowZone: boolean;
  ShowTop: boolean;
};
type Row = {
  Id: string;
  Q: number | "";
  Climber: string;
  B1: string;
  B2: string;
  B3: string;
  B4: string;
  Tops: number;
  Zones: number;
  AttT: number;
  AttZ: number;
  B1ShowZone: boolean;
  B1ShowTop: boolean;
  B2ShowZone: boolean;
  B2ShowTop: boolean;
  B3ShowZone: boolean;
  B3ShowTop: boolean;
  B4ShowZone: boolean;
  B4ShowTop: boolean;
  Place?: number;
};
type BoulderKey = "B1" | "B2" | "B3" | "B4";

// Google Sheet ids kept for parity/reference (unused in manual mode)
const SpreadsheetId = "1qzEaH5ha8H6R1VeFLMxAy8hp3X2JMj3h39Arthu4mWY";
const MenGid = "1069906247";
const WomenGid = "2055835783";

// Behavior flags
const PollSeconds = 2;
const InferZoneOnTop = true;
const CreditsText = "by Ti";
const UseManualFinalists = true;

/* =========================
   Helpers
   ========================= */

   function uuid(): string {
    if (
      typeof crypto !== "undefined" &&
      typeof (crypto as any).randomUUID === "function"
    ) {
      return (crypto as any).randomUUID();
    }
  
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

function newEmptyRow(q: number): Row {
  return {
    Id: uuid(),
    Q: q,
    Climber: "",
    B1: "",
    B2: "",
    B3: "",
    B4: "",
    Tops: 0,
    Zones: 0,
    AttT: 0,
    AttZ: 0,
    B1ShowZone: false,
    B1ShowTop: false,
    B2ShowZone: false,
    B2ShowTop: false,
    B3ShowZone: false,
    B3ShowTop: false,
    B4ShowZone: false,
    B4ShowTop: false,
  };
}

function normalize(s: string | null | undefined): string {
  if (s == null) return "";
  const t = s.replace(/\u00A0/g, " ").trim();
  if (t.toLowerCase().replace(/ /g, "") === "0z0t") return ""; // explicit clear
  return t;
}

function parseCellScore(s: string, inferZoneOnTop = true): ScoreParse {
  s = normalize(s);
  if (!s) return { T: 0, Z: 0, AT: 0, AZ: 0, ShowZone: false, ShowTop: false };
  const sl = s.toLowerCase().replace(/ /g, "");

  let t = 0,
    z = 0,
    at = 0,
    az = 0;

  const mT = sl.match(/(\d+)t/i);
  if (mT) {
    at = parseInt(mT[1], 10);
    if (at > 0) t = 1;
  }

  const mZ = sl.match(/(\d+)z/i);
  if (mZ) {
    az = parseInt(mZ[1], 10);
    if (az > 0) z = 1;
  }

  // tolerate "flash", "✓", or bare 't'/'z'
  if (t === 0) {
    if (
      /\bflash\b/i.test(sl) ||
      /✓/.test(sl) ||
      /(^|[^0-9])t($|[^a-z])/.test(sl)
    ) {
      t = 1;
      if (at === 0) at = 1;
    }
  }
  if (z === 0) {
    if (/(^|[^0-9])z($|[^a-z])/.test(sl)) {
      z = 1;
      if (az === 0) az = 1;
    }
  }
  if (inferZoneOnTop && t >= 1 && z < 1) {
    z = 1;
    if (az < 1) az = Math.max(1, at);
  }
  return {
    T: t,
    Z: z,
    AT: at,
    AZ: az,
    ShowZone: t < 1 && z >= 1,
    ShowTop: t >= 1,
  };
}

function recomputeAggregates(rows: Row[]) {
  for (const r of rows) {
    const p1 = parseCellScore(r.B1, InferZoneOnTop);
    const p2 = parseCellScore(r.B2, InferZoneOnTop);
    const p3 = parseCellScore(r.B3, InferZoneOnTop);
    const p4 = parseCellScore(r.B4, InferZoneOnTop);

    r.Tops = p1.T + p2.T + p3.T + p4.T;
    r.Zones = p1.Z + p2.Z + p3.Z + p4.Z;
    r.AttT = p1.AT + p2.AT + p3.AT + p4.AT;
    r.AttZ = p1.AZ + p2.AZ + p3.AZ + p4.AZ;

    r.B1ShowZone = p1.ShowZone;
    r.B1ShowTop = p1.ShowTop;
    r.B2ShowZone = p2.ShowZone;
    r.B2ShowTop = p2.ShowTop;
    r.B3ShowZone = p3.ShowZone;
    r.B3ShowTop = p3.ShowTop;
    r.B4ShowZone = p4.ShowZone;
    r.B4ShowTop = p4.ShowTop;
  }
}

function rankStandings(rows: Row[]): Row[] {
  const copy = rows.map((r) => ({ ...r }));
  copy.sort((a, b) => {
    if (b.Tops !== a.Tops) return b.Tops - a.Tops;
    if (b.Zones !== a.Zones) return b.Zones - a.Zones;
    if (a.AttT !== b.AttT) return a.AttT - b.AttT;
    if (a.AttZ !== b.AttZ) return a.AttZ - b.AttZ;
    const aq = a.Q === "" ? Number.MAX_SAFE_INTEGER : (a.Q as number);
    const bq = b.Q === "" ? Number.MAX_SAFE_INTEGER : (b.Q as number);
    return aq - bq;
  });
  let place = 0;
  let prev: Row | null = null;
  for (const r of copy) {
    if (
      !prev ||
      r.Tops !== prev.Tops ||
      r.Zones !== prev.Zones ||
      r.AttT !== prev.AttT ||
      r.AttZ !== prev.AttZ ||
      r.Q !== prev.Q
    ) {
      place++;
    }
    r.Place = place;
    prev = r;
  }
  return copy;
}

// quick pip cycle: none -> 1Z -> 1T1Z -> none
function cycleScoreString(current: string): string {
  const s = (current || "").trim().toLowerCase();
  if (!s) return "1Z";
  if (s === "1z" || s === "z" || s === "0t1z") return "1T1Z";
  return "";
}

/* =========================
   Small UI bits
   ========================= */

const Pip: React.FC<{
  showTop: boolean;
  showZone: boolean;
  onToggle: () => void;
  color?: string;
}> = ({ showTop, showZone, onToggle, color = "yellow" }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      onToggle();
    }}
    style={{
      width: 28,
      height: 16,
      position: "relative",
      borderRadius: 3,
      background: "#333",
      color,
      border: "none",
      cursor: "pointer",
      padding: 0,
    }}
    title="Click to toggle Zone / Top"
  >
    {showTop && (
      <div
        style={{ position: "absolute", inset: 2, background: "currentColor" }}
      />
    )}
    {showZone && (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 8,
          background: "currentColor",
        }}
      />
    )}
  </button>
);

const HeadCell: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <th
    style={{
      background: "rgb(204,0,0)",
      color: "white",
      fontWeight: 700,
      fontSize: 18,
      padding: "6px 10px",
      border: "none",
      textAlign: "left",
      ...style,
    }}
  >
    {children}
  </th>
);

const DataCell: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <td
    style={{
      color: "white",
      fontSize: 18,
      padding: "4px 8px",
      borderBottom: "1px solid #222",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </td>
);

const btnStyle: React.CSSProperties = {
  background: "#222",
  color: "white",
  border: "1px solid #333",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
};

const lblStyle: React.CSSProperties = {
  marginLeft: 16,
  marginRight: 6,
  color: "white",
  opacity: 0.9,
};

/* =========================
   Developer Panel
   ========================= */

const DeveloperPanel: React.FC<{
  title?: string;
  path?: string;
  filename?: string;
}> = ({
  title = "Developer Script (Full Source, Finals Projector)",
  path = `${process.env.PUBLIC_URL}/FinalsProjector.ps1`,
  filename = "FinalsProjector.ps1",
}) => {
  const [text, setText] = useState<string>("");
  const [wrap, setWrap] = useState<boolean>(false);

  useEffect(() => {
    fetch(path)
      .then((r) => r.text())
      .then(setText)
      .catch(() => setText("# Unable to load script from " + path));
  }, [path]);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied full script to clipboard.");
    } catch {
      alert("Copy failed.");
    }
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section
      style={{
        margin: "28px 24px 36px",
        background: "#0f0f0f",
        borderRadius: 12,
        border: "1px solid #262626",
      }}
    >
      <div
        style={{ padding: "14px 16px 10px", borderBottom: "1px solid #262626" }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{title}</h2>
        <p style={{ margin: "6px 0 10px", opacity: 0.8 }}>
          Keep the authoritative copy in source control. Use the buttons to copy
          or download a reference copy.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btnStyle} onClick={() => setWrap((w) => !w)}>
            {wrap ? "Disable wrap" : "Enable wrap"}
          </button>
          <button style={btnStyle} onClick={copyAll}>
            Copy all
          </button>
          <button style={btnStyle} onClick={download}>
            Download .ps1
          </button>
        </div>
      </div>
      <div style={{ padding: 12, maxHeight: 420, overflow: "auto" }}>
        <pre
          style={{
            margin: 0,
            whiteSpace: wrap ? "pre-wrap" : "pre",
            wordBreak: wrap ? "break-word" : "normal",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {text}
        </pre>
      </div>
    </section>
  );
};

/* =========================
   Hooks
   ========================= */

function useClock(tickSeconds: number) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), tickSeconds * 1000);
    return () => clearInterval(id);
  }, [tickSeconds]);
  return now;
}

/* =========================
   Main Component
   ========================= */

export default function FinalsProjector() {
  // Manual finalists baseline
  const [women, setWomen] = useState<Row[]>(() =>
    Array.from({ length: 6 }, (_, i) => newEmptyRow(i + 1))
  );
  const [men, setMen] = useState<Row[]>(() =>
    Array.from({ length: 6 }, (_, i) => newEmptyRow(i + 1))
  );

  // Overrides (edits to B1..B4 are mirrored here for parity)
  const [overrides, setOverrides] = useState<
    Record<string, Partial<Record<BoulderKey, string>>>
  >({});

  // UI state
  const [manualPaused, setManualPaused] = useState<boolean>(false);
  const [editingPaused, setEditingPaused] = useState<boolean>(false);
  const [blackout, setBlackout] = useState<boolean>(false);

  const [climberWidthPx, setClimberWidthPx] = useState<number>(160);
  const [titleOffsetY, setTitleOffsetY] = useState<number>(20);
  const [tiltDeg, setTiltDeg] = useState<number>(0);

  const editIdleTimer = useRef<number | null>(null);

  // Apply overrides + recompute + rank — memoized view
  const { womenView, menView, snap } = useMemo(() => {
    const cloneW = women.map((r) => ({ ...r }));
    const cloneM = men.map((r) => ({ ...r }));
    // Apply overrides
    for (const rows of [cloneW, cloneM]) {
      for (const r of rows) {
        const ov = overrides[r.Id];
        if (ov) {
          for (const k of ["B1", "B2", "B3", "B4"] as const) {
            if (ov[k] != null) {
              (r as any)[k] = normalize(ov[k] as string);
            }
          }
        }
      }
    }
    // Compute aggregates
    recomputeAggregates(cloneW);
    recomputeAggregates(cloneM);

    const wv = rankStandings(cloneW);
    const mv = rankStandings(cloneM);

    const ss = [...wv, { Id: "---" } as any, ...mv]
      .map((r) => {
        if ((r as any).Id === "---") return "---";
        return `${r.Place}|${r.Climber}|${r.B1}|${r.B2}|${r.B3}|${r.B4}|${r.Tops}|${r.Zones}|${r.AttT}|${r.AttZ}`;
      })
      .join("\n");

    return { womenView: wv, menView: mv, snap: ss };
  }, [women, men, overrides]);

  // Footer clock + meta
  const now = useClock(1);
  const footerText = useMemo(() => {
    const stamp = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
    const pausedNow = manualPaused || editingPaused;
    return `updated ${stamp}  |  Poll:${PollSeconds}s  |  Paused:${pausedNow}  |  Overrides:${
      Object.keys(overrides).length
    }  |  Manual:${UseManualFinalists}`;
  }, [now, manualPaused, editingPaused, overrides]);

  // Global keys for blackout
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b") {
        setBlackout((b) => !b);
      } else if (e.key === "Escape") {
        setBlackout(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // “Auto-pause” while editing; resume 600ms after last edit commit
  const nudgeEditIdle = () => {
    if (editIdleTimer.current) window.clearTimeout(editIdleTimer.current);
    editIdleTimer.current = window.setTimeout(() => {
      setEditingPaused(false);
    }, 600);
  };

  // Handlers
  const updateCell = (
    gender: "Women" | "Men",
    rowId: string,
    field: keyof Row,
    value: string | number | ""
  ) => {
    // Start/refresh edit pause
    setEditingPaused(true);
    nudgeEditIdle();

    const asQ = (v: any): number | "" => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : "";
    };

    if (
      field === "Climber" ||
      field === "Q" ||
      field === "B1" ||
      field === "B2" ||
      field === "B3" ||
      field === "B4"
    ) {
      const patch = (r: Row) => ({
        ...r,
        [field]: field === "Q" ? asQ(value) : (value as string),
      });

      if (gender === "Women") {
        setWomen((prev) => prev.map((r) => (r.Id === rowId ? patch(r) : r)));
      } else {
        setMen((prev) => prev.map((r) => (r.Id === rowId ? patch(r) : r)));
      }

      // Mirror to overrides for B1..B4
      if (
        field === "B1" ||
        field === "B2" ||
        field === "B3" ||
        field === "B4"
      ) {
        setOverrides((prev) => {
          const next = { ...prev };
          if (!next[rowId]) next[rowId] = {};
          (next[rowId] as any)[field] = value as string;
          return next;
        });
      }
    }
  };

  const togglePip = (gender: "Women" | "Men", row: Row, b: BoulderKey) => {
    const next = cycleScoreString((row as any)[b] as string);
    updateCell(gender, row.Id, b, next);
  };

  // Styles that depend on state
  const climberInputStyle: React.CSSProperties = {
    width: climberWidthPx,
    minWidth: 10,
    background: "#1a1a1a",
    color: "white",
    border: "1px solid #333",
    borderRadius: 6,
    padding: "6px 8px",
    outline: "none",
  };
  const smallInputStyle: React.CSSProperties = {
    width: 72,
    background: "#1a1a1a",
    color: "white",
    border: "1px solid #333",
    borderRadius: 6,
    padding: "6px 8px",
    outline: "none",
  };
  const qInputStyle: React.CSSProperties = { width: 48, ...smallInputStyle };

  const pipColor = "yellow";

  return (
    <div
      style={{
        background: "#111",
        minHeight: "100dvh",
        color: "white",
        transform: `skewY(${tiltDeg}deg)`,
        transition: "transform 120ms linear",
      }}
    >
      {/* Title */}
      <div style={{ position: "relative", paddingTop: 10 }}>
        <h1
          style={{
            fontSize: 46,
            fontWeight: 800,
            textAlign: "center",
            margin: 0,
            marginTop: titleOffsetY,
          }}
        >
          Battle of Brawn — Finals
        </h1>
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            opacity: 0.75,
            fontSize: 14,
          }}
        >
          {CreditsText}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 24px 1fr",
          gap: 0,
          padding: 24,
        }}
      >
        {/* LEFT: WOMEN */}
        <div style={{ background: "#1a1a1a", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
            Women — Standings
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "white",
            }}
          >
            <thead>
              <tr>
                <HeadCell style={{ width: 50, textAlign: "center" }}>
                  #
                </HeadCell>
                <HeadCell>Climber</HeadCell>
                <HeadCell style={{ width: 52, textAlign: "center" }}>
                  B1
                </HeadCell>
                <HeadCell style={{ width: 52, textAlign: "center" }}>
                  B2
                </HeadCell>
                <HeadCell style={{ width: 52, textAlign: "center" }}>
                  B3
                </HeadCell>
                <HeadCell style={{ width: 52, textAlign: "center" }}>
                  B4
                </HeadCell>
                <HeadCell style={{ width: 60, textAlign: "center" }}>
                  Tops
                </HeadCell>
                <HeadCell style={{ width: 70, textAlign: "center" }}>
                  Zones
                </HeadCell>
                <HeadCell style={{ width: 60, textAlign: "center" }}>
                  AttT
                </HeadCell>
                <HeadCell style={{ width: 60, textAlign: "center" }}>
                  AttZ
                </HeadCell>
                <HeadCell style={{ width: 40, textAlign: "center" }}>
                  Q
                </HeadCell>
              </tr>
            </thead>
            <tbody>
              {womenView.map((r) => (
                <tr key={r.Id}>
                  <DataCell style={{ textAlign: "center", fontWeight: 800 }}>
                    {r.Place}
                  </DataCell>
                  <DataCell>
                    <input
                      style={{ ...climberInputStyle }}
                      value={r.Climber}
                      onFocus={(e) => {
                        setEditingPaused(true);
                        (e.target as HTMLInputElement).select();
                      }}
                      onChange={(e) =>
                        updateCell("Women", r.Id, "Climber", e.target.value)
                      }
                      onBlur={() => nudgeEditIdle()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          (e.currentTarget as HTMLInputElement).blur();
                      }}
                    />
                  </DataCell>

                  {(["B1", "B2", "B3", "B4"] as const).map((b) => (
                    <DataCell
                      key={b}
                      style={{ textAlign: "center", color: pipColor }}
                    >
                      <Pip
                        showTop={(r as any)[`${b}ShowTop`]}
                        showZone={(r as any)[`${b}ShowZone`]}
                        onToggle={() => togglePip("Women", r, b)}
                      />
                      <div style={{ marginTop: 6 }}>
                        <input
                          style={{ ...smallInputStyle }}
                          value={(r as any)[b]}
                          onFocus={(e) => {
                            setEditingPaused(true);
                            (e.target as HTMLInputElement).select();
                          }}
                          onChange={(e) =>
                            updateCell("Women", r.Id, b, e.target.value)
                          }
                          onBlur={() => nudgeEditIdle()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              (e.currentTarget as HTMLInputElement).blur();
                          }}
                          placeholder="1T1Z"
                        />
                      </div>
                    </DataCell>
                  ))}

                  <DataCell style={{ textAlign: "center", fontWeight: 800 }}>
                    {r.Tops}
                  </DataCell>
                  <DataCell style={{ textAlign: "center", fontWeight: 800 }}>
                    {r.Zones}
                  </DataCell>
                  <DataCell style={{ textAlign: "center" }}>{r.AttT}</DataCell>
                  <DataCell style={{ textAlign: "center" }}>{r.AttZ}</DataCell>
                  <DataCell style={{ textAlign: "center" }}>
                    <input
                      style={{ ...qInputStyle, textAlign: "center" }}
                      value={r.Q}
                      onFocus={(e) => {
                        setEditingPaused(true);
                        (e.target as HTMLInputElement).select();
                      }}
                      onChange={(e) =>
                        updateCell("Women", r.Id, "Q", e.target.value)
                      }
                      onBlur={() => nudgeEditIdle()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          (e.currentTarget as HTMLInputElement).blur();
                      }}
                      placeholder="Q"
                    />
                  </DataCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* spacer */}
        <div />

        {/* RIGHT: MEN */}
        <div style={{ background: "#1a1a1a", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
            Men — Standings
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "white",
            }}
          >
            <thead>
              <tr>
                <HeadCell style={{ width: 50, textAlign: "center" }}>
                  #
                </HeadCell>
                <HeadCell>Climber</HeadCell>
                <HeadCell style={{ width: 52, textAlign: "center" }}>
                  B1
                </HeadCell>
                <HeadCell style={{ width: 52, textAlign: "center" }}>
                  B2
                </HeadCell>
                <HeadCell style={{ width: 52, textAlign: "center" }}>
                  B3
                </HeadCell>
                <HeadCell style={{ width: 52, textAlign: "center" }}>
                  B4
                </HeadCell>
                <HeadCell style={{ width: 60, textAlign: "center" }}>
                  Tops
                </HeadCell>
                <HeadCell style={{ width: 70, textAlign: "center" }}>
                  Zones
                </HeadCell>
                <HeadCell style={{ width: 60, textAlign: "center" }}>
                  AttT
                </HeadCell>
                <HeadCell style={{ width: 60, textAlign: "center" }}>
                  AttZ
                </HeadCell>
                <HeadCell style={{ width: 40, textAlign: "center" }}>
                  Q
                </HeadCell>
              </tr>
            </thead>
            <tbody>
              {menView.map((r) => (
                <tr key={r.Id}>
                  <DataCell style={{ textAlign: "center", fontWeight: 800 }}>
                    {r.Place}
                  </DataCell>
                  <DataCell>
                    <input
                      style={{ ...climberInputStyle }}
                      value={r.Climber}
                      onFocus={(e) => {
                        setEditingPaused(true);
                        (e.target as HTMLInputElement).select();
                      }}
                      onChange={(e) =>
                        updateCell("Men", r.Id, "Climber", e.target.value)
                      }
                      onBlur={() => nudgeEditIdle()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          (e.currentTarget as HTMLInputElement).blur();
                      }}
                    />
                  </DataCell>

                  {(["B1", "B2", "B3", "B4"] as const).map((b) => (
                    <DataCell
                      key={b}
                      style={{ textAlign: "center", color: pipColor }}
                    >
                      <Pip
                        showTop={(r as any)[`${b}ShowTop`]}
                        showZone={(r as any)[`${b}ShowZone`]}
                        onToggle={() => togglePip("Men", r, b)}
                      />
                      <div style={{ marginTop: 6 }}>
                        <input
                          style={{ ...smallInputStyle }}
                          value={(r as any)[b]}
                          onFocus={(e) => {
                            setEditingPaused(true);
                            (e.target as HTMLInputElement).select();
                          }}
                          onChange={(e) =>
                            updateCell("Men", r.Id, b, e.target.value)
                          }
                          onBlur={() => nudgeEditIdle()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              (e.currentTarget as HTMLInputElement).blur();
                          }}
                          placeholder="1T1Z"
                        />
                      </div>
                    </DataCell>
                  ))}

                  <DataCell style={{ textAlign: "center", fontWeight: 800 }}>
                    {r.Tops}
                  </DataCell>
                  <DataCell style={{ textAlign: "center", fontWeight: 800 }}>
                    {r.Zones}
                  </DataCell>
                  <DataCell style={{ textAlign: "center" }}>{r.AttT}</DataCell>
                  <DataCell style={{ textAlign: "center" }}>{r.AttZ}</DataCell>
                  <DataCell style={{ textAlign: "center" }}>
                    <input
                      style={{ ...qInputStyle, textAlign: "center" }}
                      value={r.Q}
                      onFocus={(e) => {
                        setEditingPaused(true);
                        (e.target as HTMLInputElement).select();
                      }}
                      onChange={(e) =>
                        updateCell("Men", r.Id, "Q", e.target.value)
                      }
                      onBlur={() => nudgeEditIdle()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          (e.currentTarget as HTMLInputElement).blur();
                      }}
                      placeholder="Q"
                    />
                  </DataCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer (clock + controls) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          alignItems: "center",
          gap: 12,
          padding: "0 24px 18px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button onClick={() => setManualPaused((p) => !p)} style={btnStyle}>
            {manualPaused ? "Resume" : "Pause"}
          </button>
          <button onClick={() => setOverrides({})} style={btnStyle}>
            Reset Overrides
          </button>
          <button onClick={() => setBlackout((b) => !b)} style={btnStyle}>
            Blackout
          </button>

          <label style={lblStyle}>Climber width (px)</label>
          <input
            type="range"
            min={20}
            max={500}
            value={climberWidthPx}
            onChange={(e) => setClimberWidthPx(Number(e.target.value))}
            style={{ width: 160 }}
          />

          <label style={lblStyle}>Title offset</label>
          <input
            type="range"
            min={0}
            max={300}
            value={titleOffsetY}
            onChange={(e) => setTitleOffsetY(Number(e.target.value))}
            style={{ width: 130 }}
          />

          <label style={lblStyle}>Tilt</label>
          <input
            type="range"
            min={-10}
            max={10}
            value={tiltDeg}
            onChange={(e) => setTiltDeg(Number(e.target.value))}
            style={{ width: 130 }}
          />
        </div>
        <div style={{ textAlign: "right", fontSize: 18 }}>{footerText}</div>
      </div>

      {/* --- SOP SECTION (Operator-facing) --- */}
      <section
        style={{
          margin: "28px 24px 36px",
          background: "#161616",
          borderRadius: 12,
          padding: "20px 20px 18px",
          lineHeight: 1.5,
          border: "1px solid #262626",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
          SOP — Finals Projector
        </h2>
        <p style={{ opacity: 0.9, marginTop: 6 }}>
          Purpose: a clean, projector-safe scoreboard for Battle of Brawn finals
          that staff can edit live without touching Sheets.
        </p>

        <h3 style={{ marginTop: 16, fontSize: 18 }}>Quick start</h3>
        <ol style={{ marginTop: 6, paddingLeft: 20 }}>
          <li>
            Type finalist names into <b>Climber</b> (Women left, Men right).
          </li>
          <li>
            Enter boulder results in <b>B1–B4</b> (e.g., <code>1T1Z</code>,{" "}
            <code>2t</code>, <code>1z</code>, <code>✓</code>, <code>flash</code>
            ).
          </li>
          <li>
            Optionally set <b>Q</b> to the qualifier rank (last tiebreaker).
          </li>
          <li>Ranking updates when you stop typing for ~0.6s.</li>
        </ol>

        <h3 style={{ marginTop: 16, fontSize: 18 }}>Data entry rules</h3>
        <ul style={{ marginTop: 6, paddingLeft: 20 }}>
          <li>
            Accepted: <code>1T</code>, <code>1Z</code>, <code>1T1Z</code>,{" "}
            <code>2t</code>, <code>3z</code>, <code>✓</code>, <code>flash</code>
            .
          </li>
          <li>
            <b>Top without Zone</b> → Zone inferred (IFSC-style).
          </li>
          <li>
            Use <code>0Z0T</code> (or blank) to clear.
          </li>
        </ul>

        <h3 style={{ marginTop: 16, fontSize: 18 }}>Controls</h3>
        <ul style={{ marginTop: 6, paddingLeft: 20 }}>
          <li>
            <b>Pause/Resume</b> — freeze recompute while doing bulk edits.
          </li>
          <li>
            <b>Reset Overrides</b> — clears per-boulder edits.
          </li>
          <li>
            <b>Blackout</b> — full-screen black; exit via top-right button,{" "}
            <b>B</b>, <b>Esc</b>, or click.
          </li>
          <li>
            <b>Climber width</b> — name column width.
          </li>
          <li>
            <b>Title offset</b> — nudge title vertically.
          </li>
          <li>
            <b>Tilt</b> — skew correction for projector angle.
          </li>
        </ul>

        <h3 style={{ marginTop: 16, fontSize: 18 }}>
          Ranking logic (tie-breaks)
        </h3>
        <p style={{ marginTop: 6 }}>
          Sort by: <b>Tops ↓</b>, then <b>Zones ↓</b>, then{" "}
          <b>Attempts-to-Top ↑</b>, then <b>Attempts-to-Zone ↑</b>, then{" "}
          <b>Q ↑</b>.
        </p>

        <h3 style={{ marginTop: 16, fontSize: 18 }}>Shortcuts</h3>
        <ul style={{ marginTop: 6, paddingLeft: 20 }}>
          <li>
            <b>B</b> — toggle blackout
          </li>
          <li>
            <b>Esc</b> — exit blackout
          </li>
        </ul>

        <h3 style={{ marginTop: 16, fontSize: 18 }}>Troubleshooting</h3>
        <ul style={{ marginTop: 6, paddingLeft: 20 }}>
          <li>
            No update? You’re in edit pause. Wait ~0.6s or click <b>Resume</b>.
          </li>
          <li>
            Odd projector geometry? Adjust <b>Tilt</b> and <b>Climber width</b>.
          </li>
          <li>
            Overlay stuck? Hit <b>Esc</b> or use the top-right exit.
          </li>
        </ul>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #262626",
            margin: "14px 0",
          }}
        />

        <h3 style={{ marginTop: 8, fontSize: 18 }}>
          Developer: Download / View PowerShell build
        </h3>
        <p style={{ marginTop: 6 }}>
          <a href={`${process.env.PUBLIC_URL}/FinalsProjector.ps1`} download>
            Download <code>FinalsProjector.ps1</code>
          </a>
        </p>
      </section>

      {/* Developer source panel */}
      <DeveloperPanel
        title="Developer Script (Full Source, Finals Projector)"
        path={`${process.env.PUBLIC_URL}/FinalsProjector.ps1`}
        filename="FinalsProjector.ps1"
      />

      {/* FULLSCREEN BLACKOUT OVERLAY (Top-Right Exit only) */}
      {blackout && (
        <div
          onClick={() => setBlackout(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "black",
            zIndex: 9999,
          }}
        >
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setBlackout(false);
              }}
              style={btnStyle}
            >
              Esc to Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
