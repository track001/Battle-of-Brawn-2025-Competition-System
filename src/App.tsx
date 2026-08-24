import React, { useEffect, useState, Suspense, lazy } from "react";
import "./styles/theme.css";
import { CONTACT } from "./config/constants";

// Eager pages
import DrawerCounter from "./components/pages/DrawerCounter";
import FinalsProjector from "./components/pages/FinalsProjector";
import FinalsTimer from "./components/pages/FinalsTimer";
import RaffleGenerator from "./components/pages/RaffleGenerator"; // NEW

// Lazy pages
const Onboarding = lazy(() => import("./components/pages/Onboarding"));
const ToolsWeUse = lazy(() => import("./components/pages/ToolsWeUse"));

/**
 * ============================================================================
 * SCC Operations SOP Hub — App.tsx
 * ----------------------------------------------------------------------------
 * RESPONSIBILITY:
 *   - Global header + footer
 *   - Hash-based routing to page components
 *
 * IMPORTANT:
 *   Do NOT wrap pages in a `.shell` or `.doc` here. Pages that need the
 *   two-column layout (e.g., Onboarding) render it themselves via SectionShell.
 *   Other pages render their own structure.
 * ============================================================================
 */

export default function App() {
  const [hash, setHash] = useState<string>(
    window.location.hash || "#drawer/overview"
  );

  // keep hash state in sync with URL
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#drawer/overview");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // redirect bare routes to /overview
  useEffect(() => {
    const bare = new Set([
      "#drawer",
      "#finals",
      "#timer",
      "#raffle", // NEW
      "#onboarding",
      "#tools",
    ]);
    if (bare.has(hash)) {
      window.location.hash = `${hash}/overview`;
    }
  }, [hash]);

  // minimal router
  const Page = (() => {
    if (hash.startsWith("#drawer")) return <DrawerCounter />;
    if (hash.startsWith("#finals")) return <FinalsProjector />;
    if (hash.startsWith("#timer")) return <FinalsTimer />;
    if (hash.startsWith("#raffle")) return <RaffleGenerator />; // NEW
    if (hash.startsWith("#onboarding"))
      return (
        <Suspense
          fallback={
            <div style={{ padding: 24 }} className="muted">
              Loading Onboarding…
            </div>
          }
        >
          <Onboarding />
        </Suspense>
      );
    if (hash.startsWith("#tools"))
      return (
        <Suspense
          fallback={
            <div style={{ padding: 24 }} className="muted">
              Loading Tools…
            </div>
          }
        >
          <ToolsWeUse />
        </Suspense>
      );

    return (
      <div style={{ padding: 24 }}>
        <h1>Page Not Found</h1>
        <p className="muted">
          The section <code>{hash || "(none)"}</code> is not available. Use the
          header buttons to open an existing SOP.
        </p>
      </div>
    );
  })();

  return (
    <div className="scc-root">
      {/* =================== HEADER =================== */}
      <header className="top">
        <div className="top-inner">
          <div className="brand">
            <img
              src="/SCC_OldLogo.jpg"
              className="logo"
              alt="Springs Climbing Center red logo"
            />
            <div className="wordmark">
              <div className="title">Springs Climbing Center</div>
              <div className="subtitle">Operations SOP Hub</div>
            </div>
          </div>

          {/* Deep-link each page to its Overview */}
          <a href="#drawer/overview" className="btn">
            Drawer Counter
          </a>
          <a href="#finals/overview" className="btn">
            Finals Projector
          </a>
          <a href="#timer/overview" className="btn">
            Finals Timer
          </a>
          <a href="#raffle/overview" className="btn">
            {" "}
            {/* NEW */}
            Raffle Generator
          </a>
          <a href="#onboarding/overview" className="btn">
            Onboarding
          </a>
          <a href="#tools/overview" className="btn">
            Tools We Use
          </a>
        </div>
      </header>

      {/* =================== MAIN =================== */}
      {/* No .shell/.doc wrapper here — pages render their own layout */}
      <main>{Page}</main>

      {/* =================== FOOTER =================== */}
      <footer className="foot">
        <div className="foot-inner">
          <div className="who">
            <div className="name">{CONTACT.name}</div>
            <div className="links">
              <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <span>•</span>
              <a href={CONTACT.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <span>•</span>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              <span>•</span>
              <a href={`tel:${CONTACT.phone.replace(/[^0-9]/g, "")}`}>
                {CONTACT.phone}
              </a>
            </div>
          </div>
          <div className="brand-mini">SCC • SOP Hub</div>
        </div>
      </footer>
    </div>
  );
}
