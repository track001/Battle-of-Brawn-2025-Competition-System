
import React, { useEffect } from "react";
import "./BrawnResults2026.css";

/**
 * ==========================================================
 * Battle of Brawn 2026 — Competition Results
 * Springs Climbing Center
 * Developed by Ti
 * ==========================================================
 *
 * Open Qualifiers: Published PDF
 * Citizens: Google Sheets podium and full results
 * Open Finals: Pending
 *
 * Display-only. No scoring calculations are performed here.
 * ==========================================================
 */

// ==========================================================
// RESULTS LINKS
// ==========================================================

const OPEN_RESULTS =
  "https://drive.google.com/file/d/1piE-aPXd6bkGW9C91ltod2pUu0UqA1sE/view?usp=drive_link";

const SHEET_ID =
  "1Tyqx9JMtAiblBcTH1QOsBDpenNAm209lR8beaP-7Puw";

const CITIZENS_PODIUM =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=310000102#gid=310000102`;

const CITIZENS_FULL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=310000103#gid=310000103`;

// ==========================================================
// RESULTS
// ==========================================================

const results = [
  {
    id: "open",
    title: "Open Qualifiers",
    date: "Friday, November 6",
    status: "Published",
    description:
      "Women's and men's qualifier standings and finalist placements.",
    links: [
      {
        label: "View Qualifier Results",
        url: OPEN_RESULTS,
      },
    ],
  },
  {
    id: "citizens",
    title: "Citizens",
    date: "Saturday, November 7",
    status: "Live / Provisional",
    description:
      "Podium standings and full results from the competition scoring workbook. Results remain provisional until published.",
    links: [
      {
        label: "Podium Results",
        url: CITIZENS_PODIUM,
      },
      {
        label: "Full Results",
        url: CITIZENS_FULL,
      },
    ],
  },
  {
    id: "finals",
    title: "Open Finals",
    date: "Saturday, November 7",
    status: "Pending",
    description:
      "Official Finals standings will be posted following the competition.",
    links: [],
  },
];

// ==========================================================
// PLANNING & PRODUCTION
// ==========================================================

const contributions = [
  {
    title: "Competition Planning & Coordination",
    items: [
      "Competition planning, scheduling, preparation, staff communication, and event logistics",
      "Coordinating meetings, deliveries, and preparation between competition staff, vendors, and outside partners",
      "Registration and check-in planning, competitor communications, and event-day troubleshooting",
    ],
  },
  {
    title: "Holds, Sponsors & Setting",
    items: [
      "Hold research, manufacturer outreach, and sponsorship coordination with Secret Holds, Escape Climbing, Trango/FRD, and other suppliers",
      "Hold and prize orders, invoices, freight, shipping, delivery scheduling, and tracking",
      "Citizens competition boulder setting, Open forerunning, testing, and setting preparation",
    ],
  },
  {
    title: "Scoring & Technical Development",
    items: [
      "Jotform digital scorecards, submission instructions, and Google Sheets integration",
      "Scoring formulas, attempt and flash bonuses, category bump-up rules, and duplicate detection",
      "Podium standings, full-results sheets, printable scoring reports, and publishing workflows",
      "Finals projector tools, PowerShell scripts, scoring displays, and Climbing Noise timer setup",
      "Projector configuration, screen mirroring, display sizing, and technical troubleshooting",
    ],
  },
  {
    title: "Open Finals & BetaBreakerz Livestream",
    items: [
      "Livestream planning and coordination with BetaBreakerz",
      "Meetings, production preparation, and communication between BetaBreakerz and competition staff",
      "Videographer applications, selection, scheduling, and communications",
      "Finalist identification, notification emails, and Climbing Noise athlete profile coordination",
      "Commentator communication, livestream displays, projector integration, and audiovisual setup",
    ],
  },
  {
    title: "Check-In & Event Operations",
    items: [
      "Rock Gym Pro customer and registration comparisons",
      "Waiver expiration queries, registration checks, and waiver reminder emails",
      "Staff-facing procedures, check-in support, technical testing, and event troubleshooting",
    ],
  },
];

// ==========================================================
// COMPONENT
// ==========================================================

export default function BrawnResults2026() {
  useEffect(() => {
    const scrollToSection = () => {
      const section = window.location.hash.split("/")[1];
      const element = document.getElementById(`brawn26-${section}`);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    scrollToSection();
    window.addEventListener("hashchange", scrollToSection);

    return () => {
      window.removeEventListener("hashchange", scrollToSection);
    };
  }, []);

  return (
    <div className="brawn26">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="brawn26-header">
        <div className="brawn26-headerline">
          <span>SPRINGS CLIMBING CENTER</span>
          <span>NOVEMBER 6–7, 2026</span>
        </div>

        <h1>Battle of Brawn 2026</h1>
        <p>Competition Results</p>

        <nav className="brawn26-nav" aria-label="Results navigation">
          <a href="#brawn2026/open">Open Qualifiers</a>
          <a href="#brawn2026/citizens">Citizens</a>
          <a href="#brawn2026/finals">Open Finals</a>
        </nav>
      </header>

      {/* ======================================================
          COMPETITION RESULTS
          ====================================================== */}

      <main className="brawn26-results">
        {results.map((result) => (
          <section
            id={`brawn26-${result.id}`}
            className="brawn26-result"
            key={result.id}
          >
            <div className="brawn26-resultheader">
              <div>
                <h2>{result.title}</h2>
                <p className="brawn26-date">{result.date}</p>
              </div>

              <span
                className={`brawn26-status ${
                  result.status === "Pending" ? "pending" : ""
                }`}
              >
                {result.status}
              </span>
            </div>

            <p className="brawn26-description">
              {result.description}
            </p>

            {result.links.length > 0 ? (
              <div className="brawn26-links">
                {result.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            ) : (
              <span className="brawn26-noresults">
                Results not yet available.
              </span>
            )}
          </section>
        ))}
      </main>

      {/* ======================================================
          PLANNING & PRODUCTION
          ====================================================== */}

      <section className="brawn26-production">
        <details>
          <summary>
            <div className="brawn26-productiontitle">
              <h2>Planning &amp; Production</h2>
              <span>Ti | Battle of Brawn 2026</span>
            </div>

            <span className="brawn26-expand">
              View contributions
            </span>
          </summary>

          <div className="brawn26-productioncontent">
            <p className="brawn26-productionintro">
              Competition planning, coordination, setting,
              scoring systems, and event operations.
            </p>

            {contributions.map((group) => (
              <div
                className="brawn26-contribution"
                key={group.title}
              >
                <h3>{group.title}</h3>

                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}

            <p className="brawn26-credit">
              Planning and technical development: Ti
            </p>
          </div>
        </details>
      </section>

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="brawn26-footer">
        <span>Springs Climbing Center</span>
        <span>Battle of Brawn 2026</span>
      </footer>
    </div>
  );
}
