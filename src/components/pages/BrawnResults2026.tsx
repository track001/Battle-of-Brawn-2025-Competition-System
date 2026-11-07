
import React, { useEffect } from "react";
import "./BrawnResults2026.css";

/**
 * ==========================================================
 * BATTLE OF BRAWN 2026 — RESULTS
 * Springs Climbing Center
 * ==========================================================
 *
 * Author: Tiana J. Schwarz
 *
 * Results only. No score calculations or edits.
 *
 * Open Qualifiers: Published PDF
 * Citizens: Google Sheets print tabs
 * Open Finals: Pending
 *
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
// CONTRIBUTIONS
// ==========================================================

const contributions = [
  {
    category: "HOLDS & SPONSORSHIPS",
    items: [
      "Manufacturer outreach, hold research, and coordination with Secret Holds, Escape Climbing, Trango/FRD, and additional brands",
      "Orders, invoices, freight, delivery timelines, sponsorship support, and prize coordination",
      "Hold inventory and preparation for competition setting",
    ],
  },
  {
    category: "SETTING & FORERUNNING",
    items: [
      "Citizens competition boulder setting",
      "Open Qualifier forerunning, climb testing, and setting support",
      "Competition preparation and setting coordination",
    ],
  },
  {
    category: "REGISTRATION & OPERATIONS",
    items: [
      "Competitor registration and check-in preparation",
      "Rock Gym Pro customer queries, registration comparisons, and waiver checks",
      "Expired waiver identification, reminder emails, and follow-up workflows",
      "Staff instructions, competition communications, and event troubleshooting",
    ],
  },
  {
    category: "SCORING & DEVELOPMENT",
    items: [
      "Digital Jotform scorecard design and submission workflow",
      "Google Sheets integration, scoring formulas, and competition data organization",
      "Flash and attempt scoring, category bump-up rules, and duplicate checks",
      "Podium standings, printable results, and score publishing workflows",
      "Competition system testing and technical troubleshooting",
    ],
  },
  {
    category: "OPEN FINALS & PRODUCTION",
    items: [
      "Open Qualifier results preparation and finalist identification",
      "Finalist notification emails and Climbing Noise athlete profile coordination",
      "Commentator communication, videographer selection, and volunteer coordination",
      "Climbing Noise timer configuration and Finals display preparation",
      "Finals projector, scoreboard, athlete name formatting, and screen mirroring",
      "Livestream coordination, audiovisual setup, and projector troubleshooting",
    ],
  },
];

const resultRows = [
  {
    number: "01",
    label: "OPEN QUALIFIERS",
    meta: "FRIDAY, NOVEMBER 6",
    description:
      "Women's and men's qualifier standings, including finalist placements.",
    status: "PUBLISHED",
    statusClass: "published",
    links: [
      { label: "VIEW OFFICIAL RESULTS", url: OPEN_RESULTS },
    ],
  },
  {
    number: "02",
    label: "CITIZENS",
    meta: "SATURDAY, NOVEMBER 7",
    description:
      "Podium standings and full results from the Jotform-connected competition workbook. Results are provisional until finalized.",
    status: "LIVE / PROVISIONAL",
    statusClass: "live",
    links: [
      { label: "PODIUM RESULTS", url: CITIZENS_PODIUM },
      { label: "FULL RESULTS", url: CITIZENS_FULL },
    ],
  },
  {
    number: "03",
    label: "OPEN FINALS",
    meta: "SATURDAY, NOVEMBER 7",
    description:
      "Official Finals standings will be available following the competition.",
    status: "PENDING",
    statusClass: "pending",
    links: [],
  },
];

// ==========================================================
// COMPONENT
// ==========================================================

export default function BrawnResults2026() {
  useEffect(() => {
    const scrollToSection = () => {
      const route = window.location.hash.split("/")[1];
      const element = document.getElementById(`brawn26-${route}`);

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
          TITLE
          ====================================================== */}

      <header className="brawn26-header">
        <div className="brawn26-topline">
          <span>SPRINGS CLIMBING CENTER</span>
          <span>06—07 NOV 2026</span>
        </div>

        <div className="brawn26-titleblock">
          <div className="brawn26-edition">
            COMPETITION ARCHIVE / 2026
          </div>

          <h1>
            BATTLE
            <span> OF </span>
            BRAWN
          </h1>

          <div className="brawn26-year">
            2026
          </div>

          <p>
            Official Competition Results
          </p>
        </div>

        <nav className="brawn26-localnav">
          <a href="#brawn2026/open">OPEN QUALIFIERS</a>
          <a href="#brawn2026/citizens">CITIZENS</a>
          <a href="#brawn2026/finals">OPEN FINALS</a>
          <a href="#brawn2026/credits">PRODUCTION NOTES</a>
        </nav>
      </header>

      {/* ======================================================
          RESULTS
          ====================================================== */}

      <main className="brawn26-results">
        <div className="brawn26-heading">
          <span className="brawn26-sectionnumber">
            01 / RESULTS
          </span>
          <h2>COMPETITION STANDINGS</h2>
        </div>

        <p className="brawn26-intro">
          Battle of Brawn 2026 at Springs Climbing Center.
          Select a competition division below to access its
          official results.
        </p>

        {resultRows.map((result, index) => {
          const sectionIds = ["open", "citizens", "finals"];

          return (
            <section
              className="brawn26-result"
              id={`brawn26-${sectionIds[index]}`}
              key={result.number}
            >
              <div className="brawn26-resultnumber">
                {result.number}
              </div>

              <div className="brawn26-resultcontent">
                <div className="brawn26-resulttop">
                  <div>
                    <p className="brawn26-meta">
                      {result.meta}
                    </p>

                    <h3>{result.label}</h3>
                  </div>

                  <span
                    className={`brawn26-resultstatus ${result.statusClass}`}
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
                        href={link.url}
                        key={link.label}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="brawn26-awaiting">
                    RESULTS TO FOLLOW
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </main>

      {/* ======================================================
          CONTRIBUTION LOG
          ====================================================== */}

      <section
        id="brawn26-credits"
        className="brawn26-credits"
      >
        <div className="brawn26-heading">
          <span className="brawn26-sectionnumber">
            02 / BEHIND THE WALL
          </span>

          <h2>THE WORK BEHIND BRAWN</h2>
        </div>

        <p className="brawn26-creditsintro">
          A record of the planning, setting, technical development,
          and event operations contributed by Tiana J. Schwarz.
          Much of the work behind a competition happens long before
          the first climber pulls onto the wall.
        </p>

        <div className="brawn26-creditlist">
          {contributions.map((group, index) => (
            <div
              className="brawn26-creditgroup"
              key={group.category}
            >
              <div className="brawn26-creditlabel">
                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3>{group.category}</h3>
              </div>

              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="brawn26-creditfoot">
          SELECTED CONTRIBUTIONS / NOT A VERIFIED TIMESHEET
        </p>
      </section>

      {/* ======================================================
          PAGE FOOTER
          ====================================================== */}

      <footer className="brawn26-footer">
        <span>SPRINGS CLIMBING CENTER</span>
        <span>BATTLE OF BRAWN / 2026</span>
      </footer>
    </div>
  );
}
