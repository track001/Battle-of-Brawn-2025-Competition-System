
import React, { useEffect, useState } from "react";
import "./BrawnResults2026.css";

/**
 * ==========================================================
 * Battle of Brawn 2026 — Results Page
 * ==========================================================
 *
 * Open Qualifiers:
 *   Published PDF (November 6, 2026)
 *
 * Citizens:
 *   Live Jotform → Google Sheets results
 *   02 PODIUM PRINT
 *   03 FULL RESULTS PRINT
 *
 * Open Finals:
 *   Pending official results
 *
 * This page is display-only.
 * It does not calculate, edit, or approve scores.
 * ==========================================================
 */

const SHEET_ID =
  "1Tyqx9JMtAiblBcTH1QOsBDpenNAm209lR8beaP-7Puw";

const CITIZENS_TABS = [
  {
    label: "Podium Print",
    gid: "310000102",
    tab: "02 PODIUM PRINT",
  },
  {
    label: "Full Results Print",
    gid: "310000103",
    tab: "03 FULL RESULTS PRINT",
  },
];

const OPEN_PDF =
  `${process.env.PUBLIC_URL}/results/2026/open-qualifier-results.pdf`;

function publishedTab(gid: string): string {
  return (
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}` +
    `/pubhtml?gid=${gid}&single=true&widget=false&headers=false`
  );
}

function workbookTab(gid: string): string {
  return (
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}` +
    `/edit#gid=${gid}`
  );
}

const contributions = [
  "Competition planning, operating workflows, staffing coordination, and event communications",
  "Hold research, manufacturer outreach, orders, freight coordination, sponsor support, and hold deliveries, including Secret Holds, Escape Climbing, and Trango/FRD",
  "Citizens boulder setting, Open forerunning, climb testing, and setting support",
  "Registration support, competitor check-in preparation, Rock Gym Pro customer matching, waiver expiration queries, and waiver reminder emails",
  "Jotform digital scorecard design, competition instructions, score submission workflows, and Google Sheets integration",
  "Citizens scoring formulas, attempts and flash bonuses, category bump-up logic, duplicate detection, podium standings, and full results printing",
  "Open Qualifier scoring preparation, results coordination, finalist identification, and finalist notifications",
  "Finalist emails, Climbing Noise athlete profile coordination, commentator communications, and competition correspondence",
  "Livestream setup coordination, videographer selection, volunteer communication, and production support",
  "Climbing Noise Finals timer setup, event code configuration, and competition display integration",
  "Finals projector, scoreboard displays, athlete name formatting, screen mirroring, and audiovisual troubleshooting",
  "Technical documentation, testing, score publishing preparation, event troubleshooting, and staff support",
];

export default function BrawnResults2026() {
  const [citizensTab, setCitizensTab] = useState(0);

  const tab = CITIZENS_TABS[citizensTab];

  useEffect(() => {
    const scrollToSection = () => {
      const route = window.location.hash.split("/")[1];

      if (["open", "citizens", "finals"].includes(route)) {
        document
          .getElementById(`brawn26-${route}`)
          ?.scrollIntoView({
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
      {/* ==========================================================
          EVENT HEADER
          ========================================================== */}

      <header className="brawn26-hero">
        <p className="brawn26-eyebrow">
          Springs Climbing Center | November 6–7, 2026
        </p>

        <h1>Battle of Brawn 2026</h1>

        <p className="brawn26-sub">
          Competition Results | Citizens, Open Qualifiers &amp; Finals
        </p>

        <div className="brawn26-stategrid">
          <a href="#brawn2026/open" className="brawn26-status">
            <b>Open Qualifiers</b>
            <span className="brawn26-pill brawn26-published">
              Published
            </span>
          </a>

          <a href="#brawn2026/citizens" className="brawn26-status">
            <b>Citizens</b>
            <span className="brawn26-pill brawn26-live">
              Live / Provisional
            </span>
          </a>

          <a href="#brawn2026/finals" className="brawn26-status">
            <b>Open Finals</b>
            <span className="brawn26-pill brawn26-pending">
              Pending
            </span>
          </a>
        </div>
      </header>

      {/* ==========================================================
          OPEN QUALIFIER RESULTS
          ========================================================== */}

      <section id="brawn26-open" className="brawn26-section">
        <div className="brawn26-sectionheading">
          <div>
            <h2>Open Qualifiers</h2>
            <p>
              Friday, November 6 | Women's and Men's Results
            </p>
          </div>

          <span className="brawn26-pill brawn26-published">
            Published
          </span>
        </div>

        <p className="brawn26-copy">
          Official Open Qualifier standings, including the women's
          and men's results, are available below.
        </p>

        <div className="brawn26-actions">
          <a href={OPEN_PDF} target="_blank" rel="noreferrer">
            View Results PDF
          </a>

          <a
            href={OPEN_PDF}
            download="Battle-of-Brawn-2026-Open-Qualifier-Results.pdf"
          >
            Download Results
          </a>
        </div>

        <iframe
          className="brawn26-pdf"
          title="Battle of Brawn Open Qualifier Results"
          src={OPEN_PDF}
        />
      </section>

      {/* ==========================================================
          CITIZENS RESULTS
          ========================================================== */}

      <section id="brawn26-citizens" className="brawn26-section">
        <div className="brawn26-sectionheading">
          <div>
            <h2>Citizens Results</h2>
            <p>
              Saturday, November 7 | Jotform → Google Sheets
            </p>
          </div>

          <span className="brawn26-pill brawn26-live">
            Live / Provisional
          </span>
        </div>

        <p className="brawn26-copy">
          Citizens standings are displayed directly from the existing
          Jotform-connected Google Sheets competition workbook.
          Results are provisional until finalized and published.
        </p>

        <div className="brawn26-tabs" role="tablist">
          {CITIZENS_TABS.map((item, index) => (
            <button
              key={item.gid}
              type="button"
              role="tab"
              aria-selected={citizensTab === index}
              className={citizensTab === index ? "active" : ""}
              onClick={() => setCitizensTab(index)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="brawn26-actions">
          <a
            href={workbookTab(tab.gid)}
            target="_blank"
            rel="noreferrer"
          >
            Open {tab.label} in Google Sheets
          </a>

          <a
            href={publishedTab(tab.gid)}
            target="_blank"
            rel="noreferrer"
          >
            Open Published View
          </a>
        </div>

        <div className="brawn26-embedwrap">
          <iframe
            key={tab.gid}
            className="brawn26-sheet"
            title={`Citizens ${tab.tab}`}
            src={publishedTab(tab.gid)}
            loading="lazy"
          />
        </div>

        <p className="brawn26-note">
          Google Sheets controls the refresh frequency of published
          results. This display does not modify the existing scoring
          formulas, validation rules, or competition data.
        </p>
      </section>

      {/* ==========================================================
          OPEN FINALS
          ========================================================== */}

      <section id="brawn26-finals" className="brawn26-section">
        <div className="brawn26-sectionheading">
          <div>
            <h2>Open Finals</h2>
            <p>Saturday, November 7, 2026</p>
          </div>

          <span className="brawn26-pill brawn26-pending">
            Pending
          </span>
        </div>

        <p className="brawn26-copy">
          Official Open Finals standings will be published after
          the competition has concluded.
        </p>
      </section>

      {/* ==========================================================
          CONTRIBUTIONS
          ========================================================== */}

      <footer className="brawn26-section brawn26-contrib">
        <h2>Behind the Competition</h2>

        <p className="brawn26-copy">
          Planning, technical development, setting, and competition
          operations contributed by Ti Schwarz for
          Battle of Brawn 2026.
        </p>

        <ul>
          {contributions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="brawn26-note">
          Summary of contributions, not a verified timesheet.
        </p>
      </footer>
    </div>
  );
}
