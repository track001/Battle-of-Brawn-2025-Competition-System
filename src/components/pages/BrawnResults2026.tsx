
import React, { useEffect, useState } from "react";
import "./BrawnResults2026.css";

/**
 * ==========================================================
 * Battle of Brawn 2026 — Competition Results
 * Springs Climbing Center
 * Developed by Ti
 * ==========================================================
 *
 * Open Qualifiers: Published PDF
 * Citizens: Published PDF + Google Sheets
 * Open Finals: PNG scoreboard + finalist comparison
 *
 * React: Create React App / react-scripts
 *
 * Display and distribution only.
 * No scoring calculations are performed here.
 * ==========================================================
 */

// ==========================================================
// RESULTS LINKS
// ==========================================================

const CITIZENS_FILE_ID =
  "1HzHNlmjQN6QKky1OSp_IhdYlYANsxpba";

const OPEN_FILE_ID =
  "1ongg1FOPH405Fel-HOSpmhIEewRVzOy8";

const driveView = (id: string) =>
  `https://drive.google.com/file/d/${id}/view`;

const driveDownload = (id: string) =>
  `https://drive.google.com/uc?export=download&id=${id}`;

const CITIZENS_PDF = driveView(CITIZENS_FILE_ID);
const OPEN_PDF = driveView(OPEN_FILE_ID);

// ==========================================================
// FINALS IMAGE — GITHUB PUBLIC FOLDER
// ==========================================================

const FINALS_IMAGE_URL =
  `${process.env.PUBLIC_URL || ""}/results/Battle-of-Brawn-2026-Open-Finals-Results.png`;

// ==========================================================
// CITIZENS GOOGLE SHEETS
// ==========================================================

const SHEET_ID =
  "1Tyqx9JMtAiblBcTH1QOsBDpenNAm209lR8beaP-7Puw";

const CITIZENS_PODIUM =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=310000102#gid=310000102`;

const CITIZENS_FULL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=310000103#gid=310000103`;

// ==========================================================
// TYPES
// ==========================================================

type ResultLink = {
  label: string;
  url: string;
};

type Result = {
  id: string;
  title: string;
  date: string;
  status: string;
  description: string;
  cutoff?: string;
  fileUrl?: string;
  downloadUrl?: string;
  imageUrl?: string;
  links: ResultLink[];
};

type Finalist = {
  name: string;
  qualifier: number;
  final: number;
};

// ==========================================================
// FINALS COMPARISON
// ==========================================================

/**
 * Rankings based on the published Open Qualifier results
 * and the supplied Finals scoreboard.
 *
 * Update here only if an official placement is corrected.
 */

const womensFinalists: Finalist[] = [
  { name: "Adriene Clark", qualifier: 1, final: 1 },
  { name: "Anika Shoemaker", qualifier: 6, final: 2 },
  { name: "Anna Kelley", qualifier: 4, final: 3 },
  { name: "Maya Madere", qualifier: 5, final: 4 },
  { name: "Naomi Lahaie", qualifier: 2, final: 5 },
  { name: "Alexandra Inghilterra", qualifier: 3, final: 6 },
];

const mensFinalists: Finalist[] = [
  { name: "Lukas Gerhardt", qualifier: 1, final: 1 },
  { name: "Nikolas Karolides", qualifier: 2, final: 2 },
  { name: "Bayes Wilder", qualifier: 5, final: 3 },
  { name: "Matthew Sherman", qualifier: 6, final: 4 },
  { name: "Caden Shrewsbury", qualifier: 4, final: 5 },
  { name: "Jacob Kelleghan", qualifier: 3, final: 6 },
];

// ==========================================================
// RESULTS
// ==========================================================

const results: Result[] = [
  {
    id: "open",
    title: "Open Qualifiers",
    date: "Friday, November 6",
    status: "Published",
    description:
      "Women's and men's Open Qualifier standings, including the six finalists from each division.",
    cutoff:
      "Qualifier scorecard submission cutoff: Saturday, November 7, 2026 at 9:30 AM.",
    fileUrl: OPEN_PDF,
    downloadUrl: driveDownload(OPEN_FILE_ID),
    links: [],
  },
  {
    id: "citizens",
    title: "Citizens",
    date: "Saturday, November 7",
    status: "Published",
    description:
      "Full competition results for Youth, Master's (40+), Beginner, Intermediate, and Advanced divisions.",
    cutoff:
      "Citizens scoring cutoff: Saturday, November 7, 2026 at 6:15 PM.",
    fileUrl: CITIZENS_PDF,
    downloadUrl: driveDownload(CITIZENS_FILE_ID),
    links: [
      {
        label: "Podium Results (Google Sheets)",
        url: CITIZENS_PODIUM,
      },
      {
        label: "Full Results (Google Sheets)",
        url: CITIZENS_FULL,
      },
    ],
  },
  {
    id: "finals",
    title: "Open Finals",
    date: "Saturday, November 7",
    status: "Published",
    description:
      "Overall women's and men's Finals results, with each finalist's qualifying placement shown alongside their final standing.",
    imageUrl: FINALS_IMAGE_URL,
    links: [],
  },
];

// ==========================================================
// SHARE HELPERS
// ==========================================================

async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    const input = document.createElement("textarea");

    input.value = url;
    input.style.position = "fixed";
    input.style.opacity = "0";

    document.body.appendChild(input);
    input.select();

    const success = document.execCommand("copy");
    document.body.removeChild(input);

    return success;
  }
}

async function shareResult(
  title: string,
  url: string
): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Battle of Brawn 2026 | ${title}`,
        text: `View the Battle of Brawn 2026 ${title} results.`,
        url,
      });

      return;
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }
    }
  }

  if (await copyLink(url)) {
    window.alert("Share link copied to clipboard.");
  } else {
    window.prompt("Copy this share link:", url);
  }
}

// ==========================================================
// IMAGE DOWNLOAD
// ==========================================================

async function downloadImage(
  url: string,
  filename: string
): Promise<void> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Image could not be retrieved.");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// ==========================================================
// BUTTON COMPONENT
// ==========================================================

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  primary?: boolean;
};

function ActionButton({
  label,
  onClick,
  primary = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "11px 16px",
        borderRadius: "6px",
        border: primary
          ? "1px solid #b91c1c"
          : "1px solid #777",
        background: primary ? "#b91c1c" : "transparent",
        color: primary ? "#fff" : "inherit",
        font: "inherit",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ==========================================================
// FINALS RANKING COMPARISON
// ==========================================================

function FinalistComparison({
  title,
  finalists,
  accent,
}: {
  title: string;
  finalists: Finalist[];
  accent: string;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        flex: "1 1 320px",
        overflow: "hidden",
        borderRadius: "6px",
        border: "1px solid #444",
      }}
    >
      <h4
        style={{
          background: accent,
          color: "#fff",
          padding: "11px 14px",
          margin: 0,
          fontSize: "1rem",
        }}
      >
        {title}
      </h4>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
            textAlign: "left",
          }}
        >
          <thead>
            <tr>
              <th style={{ padding: "10px" }}>Athlete</th>
              <th style={{ padding: "10px", textAlign: "center" }}>
                Qualifier
              </th>
              <th style={{ padding: "10px", textAlign: "center" }}>
                Finals
              </th>
            </tr>
          </thead>

          <tbody>
            {finalists.map((athlete, index) => (
              <tr
                key={athlete.name}
                style={{
                  background:
                    index % 2 === 0
                      ? "rgba(128,128,128,0.09)"
                      : "transparent",
                  borderTop:
                    "1px solid rgba(128,128,128,0.2)",
                }}
              >
                <td
                  style={{
                    padding: "10px",
                    fontWeight: athlete.final <= 3 ? 700 : 400,
                  }}
                >
                  {athlete.name}
                </td>

                <td
                  style={{
                    padding: "10px",
                    textAlign: "center",
                  }}
                >
                  {athlete.qualifier}
                </td>

                <td
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    fontWeight: athlete.final <= 3 ? 700 : 400,
                  }}
                >
                  {athlete.final}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================================
// PLANNING & PRODUCTION
// ==========================================================

const contributions = [
  {
    title: "Competition Planning & Coordination",
    items: [
      "Competition planning, scheduling, preparation, staff communication, and event logistics",
      "Coordinating meetings, deliveries, preparation, and deadlines between competition staff, vendors, sponsors, and outside partners",
      "Registration and check-in planning, competitor communications, and event-day troubleshooting",
      "Coordinating event logistics and technical operations for a competition with more than 250 competitors",
      "Supporting time-sensitive operational decisions, resolving unexpected issues, and maintaining competition timelines under pressure",
    ],
  },
  {
    title: "Holds, Sponsors, Raffles & Setting",
    items: [
      "Hold research, manufacturer outreach, and sponsorship coordination with Secret Holds, Escape Climbing, Trango/FRD, and other suppliers",
      "Negotiating and securing manufacturer discounts, wholesale pricing, sponsorship contributions, and prize support to reduce event costs",
      "Hold and prize orders, invoices, freight, shipping, delivery scheduling, and tracking",
      "Raffle planning and coordination, prize sourcing, sponsor outreach, and organization of raffle-related materials and logistics",
      "Developing and maintaining relationships with climbing hold manufacturers, sponsors, and industry partners",
      "Routesetting and forerunning throughout competition week, including Citizens boulders and Open competition preparation",
      "Testing, adjusting, and refining competition problems for difficulty, movement quality, consistency, and athlete readiness",
      "Supporting the setting team through ongoing forerunning, feedback, and event preparation",
    ],
  },
  {
    title: "Scoring & Technical Development",
    items: [
      "Designing and implementing the Citizens digital scoring workflow using Jotform, Google Sheets, and automated validation",
      "Developing scoring formulas, attempt and flash bonuses, category bump-up rules, duplicate detection, and tie-review procedures",
      "Creating real-time submission dashboards, staff review tools, podium standings, and full-results reports",
      "Processing, validating, and publishing competition scores within 30 minutes of each wave ending, with results available the same day for more than 250 competitors",
      "Developing printable scoring reports, PDF exports, public results pages, and distribution workflows",
      "Writing custom PowerShell scripts to accommodate projector dimensions, manage the Finals scoring display, and support competition presentation requirements",
      "Building and maintaining Finals projector tools, scoring displays, and Climbing Noise timer integration",
      "Troubleshooting scoring, submission, display, and technical issues in high-pressure, time-sensitive competition environments",
      "Resolving data discrepancies, duplicate submissions, name corrections, and scoring questions while preserving results integrity",
      "Configuring projectors, screen mirroring, display sizing, and competition technical equipment",
    ],
  },
  {
    title: "Open Finals & BetaBreakerz Livestream",
    items: [
      "Livestream planning and production coordination with BetaBreakerz",
      "Meetings, production preparation, and communication between BetaBreakerz and competition staff",
      "Videographer recruitment, applications, selection, scheduling, and communications",
      "Finalist identification, notification emails, and Climbing Noise athlete profile coordination",
      "Commentator communication, livestream displays, projector integration, and audiovisual setup",
      "Supporting Finals scoring operations and troubleshooting live display or production issues during the event",
    ],
  },
  {
    title: "Check-In & Event Operations",
    items: [
      "Rock Gym Pro customer database and competition registration comparisons",
      "Waiver expiration queries, registration verification, and bulk waiver reminder communications",
      "Developing staff-facing procedures, check-in tools, and troubleshooting documentation",
      "Supporting competition-day staff with registration discrepancies, technical problems, and scoring questions",
      "Coordinating rapid issue resolution across multiple competition waves to minimize delays and maintain publishing deadlines",
    ],
  },
];

// ==========================================================
// COMPONENT
// ==========================================================

export default function BrawnResults2026() {
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const scrollToSection = () => {
      const section = window.location.hash.split("/")[1];

      const element = document.getElementById(
        `brawn26-${section}`
      );

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
      window.removeEventListener(
        "hashchange",
        scrollToSection
      );
    };
  }, []);

  const handleCopy = async (
    id: string,
    url: string
  ) => {
    const success = await copyLink(url);

    if (success) {
      setCopied(id);
    } else {
      window.prompt("Copy this link:", url);
    }
  };

  const getResultPageUrl = (id: string) => {
    return `${window.location.origin}${window.location.pathname}#brawn2026/${id}`;
  };

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

        <nav
          className="brawn26-nav"
          aria-label="Results navigation"
        >
          <a href="#brawn2026/open">
            Open Qualifiers
          </a>

          <a href="#brawn2026/citizens">
            Citizens
          </a>

          <a href="#brawn2026/finals">
            Open Finals
          </a>
        </nav>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "22px",
          }}
        >
          <ActionButton
            label="Share Results Page"
            onClick={() =>
              shareResult(
                "Competition Results",
                window.location.href
              )
            }
          />
        </div>
      </header>

      {/* ======================================================
          COMPETITION RESULTS
      ====================================================== */}

      <main className="brawn26-results">
        {results.map((result) => {
          const primaryUrl =
            result.fileUrl ||
            result.imageUrl ||
            getResultPageUrl(result.id);

          return (
            <section
              id={`brawn26-${result.id}`}
              className="brawn26-result"
              key={result.id}
            >
              <div className="brawn26-resultheader">
                <div>
                  <h2>{result.title}</h2>

                  <p className="brawn26-date">
                    {result.date}
                  </p>
                </div>

                <span className="brawn26-status">
                  {result.status}
                </span>
              </div>

              <p className="brawn26-description">
                {result.description}
              </p>

              {/* ==========================================
                  CITIZENS YOUTH CATEGORY DETAILS
              ========================================== */}

              {result.id === "citizens" && (
                <div
                  style={{
                    marginTop: "16px",
                    marginBottom: "16px",
                    lineHeight: 1.7,
                  }}
                >
                  <strong>Youth categories:</strong>

                  <ul
                    style={{
                      marginTop: "6px",
                      paddingLeft: "22px",
                    }}
                  >
                    <li>
                      Youth 9 &amp; Under:
                      combined-gender results and podium.
                    </li>

                    <li>
                      Youth 10–14:
                      separate girls' and boys' results
                      and podiums.
                    </li>
                  </ul>
                </div>
              )}

              {/* ==========================================
                  SUBMISSION CUTOFFS
              ========================================== */}

              {result.cutoff && (
                <p
                  style={{
                    marginTop: "12px",
                    marginBottom: "16px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {result.cutoff}
                </p>
              )}

              {/* ==========================================
                  PDF RESULTS
              ========================================== */}

              {result.fileUrl && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "18px",
                    marginBottom: "16px",
                  }}
                >
                  <ActionButton
                    primary
                    label="View PDF"
                    onClick={() =>
                      window.open(
                        result.fileUrl,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  />

                  {result.downloadUrl && (
                    <ActionButton
                      label="Download PDF"
                      onClick={() =>
                        window.open(
                          result.downloadUrl!,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    />
                  )}

                  <ActionButton
                    label={
                      copied === `${result.id}-file`
                        ? "Link Copied"
                        : "Copy PDF Link"
                    }
                    onClick={() =>
                      handleCopy(
                        `${result.id}-file`,
                        result.fileUrl!
                      )
                    }
                  />

                  <ActionButton
                    label="Share"
                    onClick={() =>
                      shareResult(
                        result.title,
                        primaryUrl
                      )
                    }
                  />
                </div>
              )}

              {/* ==========================================
                  OPEN FINALS RANKING COMPARISON
              ========================================== */}

              {result.id === "finals" && (
                <div style={{ marginTop: "20px" }}>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      marginBottom: "8px",
                    }}
                  >
                    Qualifiers vs. Finals
                  </h3>

                  <p
                    style={{
                      fontSize: "0.9rem",
                      opacity: 0.8,
                      marginBottom: "16px",
                    }}
                  >
                    A comparison of each finalist's
                    qualifying rank and overall Finals
                    placement.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <FinalistComparison
                      title="Women"
                      finalists={womensFinalists}
                      accent="#763db4"
                    />

                    <FinalistComparison
                      title="Men"
                      finalists={mensFinalists}
                      accent="#ba2138"
                    />
                  </div>
                </div>
              )}

              {/* ==========================================
                  OPEN FINALS SCOREBOARD IMAGE
              ========================================== */}

              {result.imageUrl && (
                <div style={{ marginTop: "24px" }}>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      marginBottom: "12px",
                    }}
                  >
                    Finals Scoreboard
                  </h3>

                  <img
                    src={result.imageUrl}
                    alt="Battle of Brawn 2026 Open Finals scoreboard"
                    loading="lazy"
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "1100px",
                      height: "auto",
                      borderRadius: "6px",
                      marginBottom: "16px",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    <ActionButton
                      primary
                      label="View Finals Image"
                      onClick={() =>
                        window.open(
                          result.imageUrl!,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    />

                    <ActionButton
                      label="Download PNG"
                      onClick={() =>
                        downloadImage(
                          result.imageUrl!,
                          "Battle-of-Brawn-2026-Open-Finals-Results.png"
                        )
                      }
                    />

                    <ActionButton
                      label={
                        copied === "finals-image"
                          ? "Link Copied"
                          : "Copy Image Link"
                      }
                      onClick={() =>
                        handleCopy(
                          "finals-image",
                          new URL(
                            result.imageUrl!,
                            window.location.href
                          ).href
                        )
                      }
                    />

                    <ActionButton
                      label="Share"
                      onClick={() =>
                        shareResult(
                          "Open Finals",
                          new URL(
                            result.imageUrl!,
                            window.location.href
                          ).href
                        )
                      }
                    />
                  </div>

                  <p
                    style={{
                      fontSize: "0.85rem",
                      opacity: 0.75,
                      marginTop: "12px",
                    }}
                  >
                    Download the Finals scoreboard image
                    for posting, printing, or sharing.
                  </p>
                </div>
              )}

              {/* ==========================================
                  ADDITIONAL GOOGLE SHEETS RESULTS
              ========================================== */}

              {result.links.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <h3
                    style={{
                      fontSize: "1rem",
                      marginBottom: "12px",
                    }}
                  >
                    Additional Results &amp; Reports
                  </h3>

                  <div className="brawn26-links">
                    {result.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}

                        <span aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ==========================================
                  SHARE SECTION LINK
                  Open Qualifiers uses only the PDF link.
              ========================================== */}

              {result.id !== "open" && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "18px",
                  }}
                >
                  <ActionButton
                    label={
                      copied === `${result.id}-page`
                        ? "Section Link Copied"
                        : "Copy Section Link"
                    }
                    onClick={() =>
                      handleCopy(
                        `${result.id}-page`,
                        getResultPageUrl(result.id)
                      )
                    }
                  />
                </div>
              )}
            </section>
          );
        })}
      </main>

      {/* ======================================================
          PLANNING & PRODUCTION
      ====================================================== */}

      <section className="brawn26-production">
        <details>
          <summary>
            <div className="brawn26-productiontitle">
              <h2>Planning &amp; Production</h2>

              <span>
                Ti | Battle of Brawn 2026
              </span>
            </div>

            <span className="brawn26-expand">
              View contributions
            </span>
          </summary>

          <div className="brawn26-productioncontent">
            <p className="brawn26-productionintro">
              Competition planning, coordination,
              routesetting, forerunning, sponsorship
              development, scoring systems, and event
              operations for more than 250 competitors.
            </p>

            {contributions.map((group) => (
              <div
                className="brawn26-contribution"
                key={group.title}
              >
                <h3>{group.title}</h3>

                <ul>
                  {group.items.map((item) => (
                    <li key={item}>
                      {item}
                    </li>
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
