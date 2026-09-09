import React, { useEffect, useState, Suspense, lazy } from "react";
import "./styles/theme.css";
import { CONTACT } from "./config/constants";

// ============================================================================
// EAGER PAGES
// ============================================================================
import DrawerCounter from "./components/pages/DrawerCounter";
import FinalsProjector from "./components/pages/FinalsProjector";
import FinalsTimer from "./components/pages/FinalsTimer";
import RaffleGenerator from "./components/pages/RaffleGenerator";
import RGPMySQL from "./components/pages/RGPMySQL";

// ============================================================================
// LAZY PAGES
// ============================================================================
const Onboarding = lazy(() => import("./components/pages/Onboarding"));

/**
 * ============================================================================
 * SCC Operations SOP Hub — App.tsx
 * ----------------------------------------------------------------------------
 * Handles:
 *   - Main SCC header
 *   - Navigation buttons
 *   - Hash-based page routing
 *   - Footer
 *
 * Pages currently available:
 *   - Drawer Counter
 *   - Finals Projector
 *   - Finals Timer
 *   - Raffle Generator
 *   - RGP / MySQL
 *   - Onboarding
 *
 * IMPORTANT:
 * Individual pages control their own layouts.
 * Do not add a .shell or .doc wrapper around Page here.
 * ============================================================================
 */

export default function App() {
  const [hash, setHash] = useState<string>(
    window.location.hash || "#drawer/overview"
  );

  // ==========================================================================
  // KEEP ROUTE STATE IN SYNC WITH THE URL
  // ==========================================================================
  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash || "#drawer/overview");
    };

    window.addEventListener("hashchange", onHash);

    return () => {
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  // ==========================================================================
  // REDIRECT BARE PAGE ROUTES TO THEIR OVERVIEW SECTION
  // ==========================================================================
  useEffect(() => {
    const bareRoutes = new Set([
      "#drawer",
      "#finals",
      "#timer",
      "#raffle",
      "#mysql",
      "#onboarding",
    ]);

    if (bareRoutes.has(hash)) {
      window.location.hash = `${hash}/overview`;
    }
  }, [hash]);

  // ==========================================================================
  // PAGE ROUTER
  // ==========================================================================
  const Page = (() => {
    if (hash.startsWith("#drawer")) {
      return <DrawerCounter />;
    }

    if (hash.startsWith("#finals")) {
      return <FinalsProjector />;
    }

    if (hash.startsWith("#timer")) {
      return <FinalsTimer />;
    }

    if (hash.startsWith("#raffle")) {
      return <RaffleGenerator />;
    }

    if (hash.startsWith("#mysql")) {
      return <RGPMySQL />;
    }

    if (hash.startsWith("#onboarding")) {
      return (
        <Suspense
          fallback={
            <div
              className="muted"
              style={{
                padding: 24,
              }}
            >
              Loading Onboarding…
            </div>
          }
        >
          <Onboarding />
        </Suspense>
      );
    }

    // Unknown route
    return (
      <div
        style={{
          padding: 24,
        }}
      >
        <h1>Page Not Found</h1>

        <p className="muted">
          The section <code>{hash || "(none)"}</code> is not available. Use the
          header buttons to open an existing SOP.
        </p>
      </div>
    );
  })();

  // ==========================================================================
  // APPLICATION
  // ==========================================================================
  return (
    <div className="scc-root">
      {/* ====================================================================
          HEADER
          ==================================================================== */}
      <header className="top">
        <div className="top-inner">
          {/* SCC BRAND */}
          <div className="brand">
            <img
              src={`${process.env.PUBLIC_URL}/SCC_OldLogo.jpg`}
              className="logo"
              alt="Springs Climbing Center red logo"
            />

            <div className="wordmark">
              <div className="title">Springs Climbing Center</div>
              <div className="subtitle">Operations SOP Hub</div>
            </div>
          </div>

          {/* ================================================================
              MAIN NAVIGATION
              ================================================================ */}

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
            Raffle Generator
          </a>

          <a href="#mysql/overview" className="btn">
            RGP / MySQL
          </a>

          <a href="#onboarding/overview" className="btn">
            Onboarding
          </a>
        </div>
      </header>

      {/* ====================================================================
          MAIN PAGE CONTENT
          ==================================================================== */}
      <main>{Page}</main>

      {/* ====================================================================
          FOOTER
          ==================================================================== */}
      <footer className="foot">
        <div className="foot-inner">
          <div className="who">
            <div className="name">{CONTACT.name}</div>

            <div className="links">
              <a
                href={CONTACT.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>

              <span>•</span>

              <a
                href={CONTACT.github}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>

              <span>•</span>

              <a href={`mailto:${CONTACT.email}`}>
                {CONTACT.email}
              </a>

              <span>•</span>

              <a
                href={`tel:${CONTACT.phone.replace(/[^0-9]/g, "")}`}
              >
                {CONTACT.phone}
              </a>
            </div>
          </div>

          <div className="brand-mini">
            SCC • SOP Hub
          </div>
        </div>
      </footer>
    </div>
  );
}
