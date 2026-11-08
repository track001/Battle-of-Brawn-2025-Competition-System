
import React, { useEffect, useState } from "react";
import "./BrawnResults2026.css";

/**
 * ==========================================================
 * Battle of Brawn 2026 — Competition Results
 * Springs Climbing Center
 * Developed by Ti
 * ==========================================================
 *
 * Event & Scoring Management: Ti
 *
 * Livestream: YouTube / BetaBreakerz
 * Open Qualifiers: Published PDF
 * Citizens: Published PDF + Google Sheets
 * Open Finals: Published PNG + rankings comparison
 * Scorecard Archive: Citizens + Open Jotform
 *
 * React: Create React App / react-scripts
 *
 * Display and distribution only.
 * No scoring calculations are performed here.
 * ==========================================================
 */

// ==========================================================
// LIVESTREAM
// ==========================================================

const LIVESTREAM_ID = "di7EF7pGIgk";

const LIVESTREAM_URL =
  `https://www.youtube.com/live/${LIVESTREAM_ID}`;

const LIVESTREAM_EMBED =
  `https://www.youtube-nocookie.com/embed/${LIVESTREAM_ID}`;

// ==========================================================
// PUBLISHED RESULTS
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
// FINALS PNG — public/results/ IN GITHUB
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
// ORIGINAL JOTFORM SCORECARDS
// ==========================================================

const CITIZENS_JOTFORM_URL =
  "https://www.jotform.com/form/253036330977055";

const OPEN_JOTFORM_URL =
  "https://form.jotform.com/263071395648061";

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

type Scorecard = {
  id: string;
  title: string;
  description: string;
  url: string;
  cutoff: string;
};

// ==========================================================
// FINALIST COMPARISONS
// ==========================================================

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
// RESULTS DATA
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
      "Overall women's and men's Finals results, with each finalist's qualifying rank shown alongside their final placement.",
    imageUrl: FINALS_IMAGE_URL,
    links: [],
  },
];

const scorecards: Scorecard[] = [
  {
    id: "citizens",
    title: "Citizens Digital Scorecard",
    description:
      "Original digital scorecard used for Citizens submissions, including boulder selections, attempts, and competition scoring.",
    url: CITIZENS_JOTFORM_URL,
    cutoff: "November 7, 2026 at 6:15 PM",
  },
  {
    id: "open",
    title: "Open Qualifier Digital Scorecard",
    description:
      "Original digital scorecard used to submit Open Qualifier results and determine finalists.",
    url: OPEN_JOTFORM_URL,
    cutoff: "November 7, 2026 at 9:30 AM",
  },
];

// ==========================================================
// SHARING HELPERS
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
        text: `View the Battle of Brawn 2026 ${title}.`,
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
    window.prompt("Copy this link:", url);
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
// LIVESTREAM
// ==========================================================

function BrawnLivestream() {
  return (
    <section
      id="brawn26-livestream"
      style={{
        width: "100%",
        maxWidth: "1180px",
        margin: "0 auto 36px",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            marginBottom: "10px",
          }}
        >
          Battle of Brawn 2026 | Livestream
        </h2>

        <p
          style={{
            lineHeight: 1.6,
            opacity: 0.85,
            margin: "0 auto",
            maxWidth: "760px",
          }}
        >
          Watch the Battle of Brawn 2026 competition
          livestream, produced in collaboration with
          BetaBreakerz.
        </p>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          backgroundColor: "#111",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
        }}
      >
        <iframe
          src={LIVESTREAM_EMBED}
          title="Battle of Brawn 2026 Livestream"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          marginTop: "18px",
        }}
      >
        <ActionButton
          primary
          label="Watch on YouTube"
          onClick={() =>
            window.open(
              LIVESTREAM_URL,
              "_blank",
              "noopener,noreferrer"
            )
          }
        />

        <ActionButton
          label="Copy Livestream Link"
          onClick={async () => {
            if (await copyLink(LIVESTREAM_URL)) {
              window.alert("Livestream link copied.");
            } else {
              window.prompt(
                "Copy livestream link:",
                LIVESTREAM_URL
              );
            }
          }}
        />

        <ActionButton
          label="Share Livestream"
          onClick={() =>
            shareResult("Livestream", LIVESTREAM_URL)
          }
        />
      </div>
    </section>
  );
}

// ==========================================================
// FINALS COMPARISON COMPONENT
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
              <th style={{ padding: "10px" }}>
                Athlete
              </th>

              <th
                style={{
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                Qualifier
              </th>

              <th
                style={{
                  padding: "10px",
                  textAlign: "center",
                }}
              >
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
                    fontWeight:
                      athlete.final <= 3 ? 700 : 400,
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
                    fontWeight:
                      athlete.final <= 3 ? 700 : 400,
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
// ORIGINAL COMPETITION SCORECARDS
// ==========================================================

function BrawnScorecardArchive() {
  return (
    <section
      id="brawn26-scorecards"
      style={{
        maxWidth: "1180px",
        margin: "40px auto",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ marginBottom: "10px" }}>
        Competition Scorecard Archive
      </h2>

      <p
        style={{
          lineHeight: 1.7,
          marginBottom: "12px",
        }}
      >
        The original digital scorecards used for
        Battle of Brawn 2026 are preserved here
        as references for the competition's scoring
        and submission workflows.
      </p>

      <p
        style={{
          fontWeight: 600,
          marginBottom: "24px",
        }}
      >
        Score submissions are closed. The official
        competition standings are available in
        the published results above.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "20px",
        }}
      >
        {scorecards.map((form) => (
          <article
            key={form.id}
            style={{
              border: "1px solid rgba(128,128,128,0.35)",
              borderRadius: "8px",
              padding: "22px",
              minWidth: 0,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {form.title}
            </h3>

            <p style={{ lineHeight: 1.6 }}>
              {form.description}
            </p>

            <p style={{ fontSize: "0.9rem" }}>
              <strong>Submission cutoff:</strong>{" "}
              {form.cutoff}
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                margin: "18px 0",
              }}
            >
              <a
                href={form.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "11px 16px",
                  borderRadius: "6px",
                  background: "#b91c1c",
                  color: "#fff",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View Original Form
              </a>

              <ActionButton
                label="Copy Form Link"
                onClick={async () => {
                  if (await copyLink(form.url)) {
                    window.alert("Form link copied.");
                  } else {
                    window.prompt(
                      "Copy form link:",
                      form.url
                    );
                  }
                }}
              />
            </div>

            <details style={{ marginTop: "16px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  padding: "10px 0",
                }}
              >
                Show Embedded Form
              </summary>

              <p
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.75,
                  lineHeight: 1.5,
                }}
              >
                Disabled Jotforms display their closure
                message rather than the original fields.
                To preserve the full layout, save a
                separate PDF or screenshot archive.
              </p>

              <div
                style={{
                  marginTop: "12px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <iframe
                  title={form.title}
                  src={form.url}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "480px",
                    border: 0,
                    display: "block",
                  }}
                />
              </div>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

// ==========================================================
// PLANNING & PRODUCTION
// ==========================================================

const contributions = [
  {
    title: "Event Management & Scoring Operations",
    items: [
      "Served as Event and Scoring Manager for Battle of Brawn 2026, overseeing competition operations, scoring systems, technical infrastructure, and coordination across all rounds",
      "Managed scoring operations for Youth, Citizens, Open Qualifiers, and Open Finals, supporting more than 250 competitors",
      "Coordinated event planning, scheduling, staff communications, sponsor relationships, registration logistics, and competition-day operations",
      "Led planning meetings and operational coordination with competition staff, vendors, and the BetaBreakerz livestream production team",
      "Managed time-sensitive scoring, event operations, and livestream coordination simultaneously under high-pressure competition conditions",
      "Developed and managed event programming, scoring software, technical tools, and competition workflows",
      "Identified operational pain points from Battle of Brawn 2025 and implemented process improvements for the 2026 event",
      "Processed, validated, and published competition scores within 30 minutes of each wave ending, with results available the same day for more than 250 competitors",
    ],
  },
  {
    title: "International Vendor Coordination, Sponsorships & Routesetting",
    items: [
      "Conducted international business communications, supplier coordination, and transactions with climbing hold manufacturers, including Secret Holds in Poland",
      "Coordinated international purchasing, invoicing, payment arrangements, shipping, freight, and delivery timelines",
      "Worked with Secret Holds, Escape Climbing, Trango/FRD, and additional manufacturers to source climbing holds, prizes, and competition resources",
      "Negotiated and secured manufacturer discounts, wholesale pricing, sponsorship contributions, and prize support to reduce competition costs",
      "Managed hold and prize orders, vendor relationships, delivery tracking, and competition inventory preparation",
      "Coordinated raffle planning, sponsor outreach, prize sourcing, and raffle logistics",
      "Routeset and foreran throughout competition week, contributing to Citizens boulders and Open competition preparation",
      "Tested, adjusted, and refined competition boulders for difficulty, movement quality, consistency, and athlete experience",
      "Collaborated with the setting team on problem development, testing, forerunning feedback, and final preparation",
    ],
  },
  {
    title: "Personal Investment & Community Support",
    items: [
      "Personally contributed approximately $4,000 toward Battle of Brawn 2026 to support hold diversity, prizes, competitor experience, and the Springs Climbing Center community",
      "Invested in competition resources to expand access to varied climbing holds, movement styles, and opportunities for athletes",
      "Supported additional prizes, event resources, and competition improvements to enhance the experience for competitors and the wider climbing community",
      "Prioritized long-term community value by investing in resources that could continue benefiting SCC beyond the competition",
    ],
  },
  {
    title: "Scoring Systems & Software Development",
    items: [
      "Designed, programmed, and managed the event's custom competition software, scoring systems, and technical workflows",
      "Built the Citizens digital scoring workflow using Jotform, Google Sheets, automated validation, and staff-facing review tools",
      "Developed scoring formulas, attempt validation, category bump-up logic, duplicate detection, and tie-review procedures",
      "Created real-time scoring dashboards, submission review tools, podium standings, full-results reports, and printable exports",
      "Built the public results website and organized downloadable PDFs, Finals images, shareable links, and published competition results",
      "Wrote custom PowerShell scripts to accommodate projector dimensions, manage Finals displays, and support competition scoring presentations",
      "Developed and maintained Finals projector software, scoring displays, technical utilities, and Climbing Noise timer integration",
      "Improved scoring reliability, automation, review procedures, and publishing turnaround based on lessons learned from the previous year's competition",
      "Resolved submission discrepancies, duplicate entries, athlete name corrections, category adjustments, and scoring concerns while preserving results integrity",
    ],
  },
  {
    title: "Livestream & Finals Production Management",
    items: [
      "Managed livestream coordination and technical requirements across the competition in partnership with BetaBreakerz",
      "Organized and participated in production planning meetings, technical coordination, scheduling discussions, and event preparation with the livestream team",
      "Coordinated videographer recruitment, applications, selection, scheduling, and communications",
      "Managed finalist identification, athlete notifications, commentator coordination, and Climbing Noise profile preparation",
      "Developed custom PowerShell Finals presentation software to accommodate projector dimensions and scoring display requirements",
      "Coordinated livestream displays, projector integration, audiovisual requirements, and competition scoring presentations",
      "Troubleshot technical issues during live competition while maintaining communication between scoring staff, event operations, and livestream production",
    ],
  },
  {
    title: "Registration, Check-In & Event Operations",
    items: [
      "Performed Rock Gym Pro customer database and competition registration comparisons",
      "Developed waiver expiration queries, registration verification processes, and bulk waiver reminder communications",
      "Created staff-facing procedures, check-in resources, technical tools, and troubleshooting documentation",
      "Supported staff with registration discrepancies, scoring questions, submission problems, and event-day technical issues",
      "Coordinated rapid issue resolution across competition waves to minimize delays and maintain scoring publication deadlines",
      "Balanced technical management, operational troubleshooting, and competition support throughout the event",
    ],
  },
];

// ==========================================================
// MAIN COMPONENT
// ==========================================================

export default function BrawnResults2026() {
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const scrollToSection = () => {
      const section =
        window.location.hash.split("/")[1];

      if (!section) return;

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

    window.addEventListener(
      "hashchange",
      scrollToSection
    );

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
    return (
      `${window.location.origin}` +
      `${window.location.pathname}` +
      `#brawn2026/${id}`
    );
  };

  return (
    <div className="brawn26">

      {/* ======================================================
          LIVESTREAM — TOP OF RESULTS PAGE
      ====================================================== */}

      <BrawnLivestream />

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="brawn26-header">
        <div className="brawn26-headerline">
          <span>
            SPRINGS CLIMBING CENTER
          </span>

          <span>
            NOVEMBER 6–7, 2026
          </span>
        </div>

        <h1>Battle of Brawn 2026</h1>

        <p>Competition Results</p>

        <nav
          className="brawn26-nav"
          aria-label="Results navigation"
        >
          <a href="#brawn2026/livestream">
            Livestream
          </a>

          <a href="#brawn2026/open">
            Open Qualifiers
          </a>

          <a href="#brawn2026/citizens">
            Citizens
          </a>

          <a href="#brawn2026/finals">
            Open Finals
          </a>

          <a href="#brawn2026/scorecards">
            Scorecards
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
                `${window.location.origin}${window.location.pathname}#brawn2026/`
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
                  CITIZENS YOUTH CATEGORIES
              ========================================== */}

              {result.id === "citizens" && (
                <div
                  style={{
                    marginTop: "16px",
                    marginBottom: "16px",
                    lineHeight: 1.7,
                  }}
                >
                  <strong>
                    Youth categories:
                  </strong>

                  <ul
                    style={{
                      marginTop: "6px",
                      paddingLeft: "22px",
                    }}
                  >
                    <li>
                      Youth 9 &amp; Under:
                      combined-gender results
                      and podium.
                    </li>

                    <li>
                      Youth 10–14:
                      separate girls' and boys'
                      results and podiums.
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
                  OPEN FINALS COMPARISON
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
                    Each finalist's qualifying
                    rank compared with their
                    overall Finals placement.
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
                  FINALS SCOREBOARD IMAGE
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
                    Download the Finals scoreboard
                    image for posting, printing,
                    or sharing.
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
                  SECTION SHARING
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
          ORIGINAL COMPETITION SCORECARDS
      ====================================================== */}

      <BrawnScorecardArchive />

      {/* ======================================================
          PLANNING & PRODUCTION
      ====================================================== */}

      <section className="brawn26-production">
        <details>
          <summary>
            <div className="brawn26-productiontitle">
              <h2>
                Planning &amp; Production
              </h2>

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
              Event and scoring management for
              Battle of Brawn 2026, supporting
              more than 250 competitors through
              custom software development,
              international vendor coordination,
              livestream production, routesetting,
              sponsorships, and competition operations.
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
              Event &amp; Scoring Management,
              Software Development,
              Livestream Coordination,
              and Personal Financial Contribution: Ti
            </p>
          </div>
        </details>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="brawn26-footer">
        <span>
          Springs Climbing Center
        </span>

        <span>
          Battle of Brawn 2026
        </span>
      </footer>
    </div>
  );
}
