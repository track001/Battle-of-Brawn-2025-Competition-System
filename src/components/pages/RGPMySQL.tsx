import React, { useEffect, useState } from "react";
import SectionShell from "../ui/SectionShell";

/**
 * ============================================================================
 * SCC RGP / MySQL Connection Workaround
 * Created by Ti Schwarz
 * ============================================================================
 *
 * FRONT DESK LAYOUT
 *
 * COMPUTER 1 = RIGHT computer
 *              Rock Gym Pro / MySQL database server
 *              Run SCC-RGP-Connection-Helper.ps1 here
 *
 * COMPUTER 2 = LEFT computer
 *              Rock Gym Pro front desk workstation
 *
 * STAFF WORKFLOW
 *
 * 1. If Check-In cannot connect, go to Computer 1 (RIGHT).
 * 2. Run SCC-RGP-Connection-Helper.ps1 in Windows PowerShell ISE.
 * 3. Press F5 / Run.
 * 4. Follow the helper.
 * 5. Only change Computer 2 if the helper directs you to.
 *
 * EXISTING DATABASE:
 * springsclimbingcenter
 *
 * DO NOT CREATE A NEW DATABASE.
 *
 * ============================================================================
 * SCRIPT PATH WHEN MOVING TO GITHUB PAGES
 * ============================================================================
 *
 * CodeSandbox:
 *   /SCC-RGP-Connection-Helper.ps1
 *
 * GitHub Pages:
 *   /Battle-of-Brawn-2025-Competition-System/SCC-RGP-Connection-Helper.ps1
 *
 * When moving this page to GitHub Pages:
 *
 * COMMENT OUT:
 * const SCRIPT_PATH = "/SCC-RGP-Connection-Helper.ps1";
 *
 * UNCOMMENT:
 * const SCRIPT_PATH =
 *   "/Battle-of-Brawn-2025-Competition-System/SCC-RGP-Connection-Helper.ps1";
 *
 * ============================================================================
 */

// CURRENT PATH — CODESANDBOX
// const SCRIPT_PATH = "/SCC-RGP-Connection-Helper.ps1";

// GITHUB PAGES PATH — UNCOMMENT WHEN MOVING TO GITHUB
const SCRIPT_PATH =
   "/Battle-of-Brawn-2025-Competition-System/SCC-RGP-Connection-Helper.ps1";

export default function RGPMySQL() {
  const [scriptText, setScriptText] = useState("");
  const [wrapScript, setWrapScript] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(SCRIPT_PATH)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load PowerShell script.");
        }

        return response.text();
      })
      .then((text) => {
        setScriptText(text);
      })
      .catch(() => {
        setScriptText(
          "Unable to display SCC-RGP-Connection-Helper.ps1. " +
            "Use the Download .ps1 button instead."
        );
      });
  }, []);

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptText);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  /**
   * SectionShell expects `toc`, not `sections`.
   * This creates the links in the left "ON THIS PAGE" menu.
   */
  const toc = [
    { id: "overview", label: "Overview" },
    { id: "computers", label: "Which Computer?" },
    { id: "run-helper", label: "Run the Helper" },
    { id: "what-it-does", label: "What It Checks" },
    { id: "rgp", label: "RGP Instructions" },
    { id: "script", label: "PowerShell Script" },
  ];

  return (
    <SectionShell toc={toc}>
      {/* ================================================================ */}
      {/* OVERVIEW                                                         */}
      {/* ================================================================ */}

      <section id="overview">
        <h1>RGP / MySQL Connection Workaround</h1>

        <p>
          Use this page when <strong>Rock Gym Pro Check-In</strong> on
          Computer 2 cannot connect to the SCC database.
        </p>

        <div className="card">
          <h3>Start on Computer 1</h3>

          <p>
            Go to <strong>Computer 1</strong>, the{" "}
            <strong>RIGHT computer at the front desk</strong>.
          </p>

          <p>
            Run the <strong>RGP Connection Helper</strong>. It checks Computer
            1, finds its current server address, and tells you what to do next.
          </p>

          <p>
            <strong>Do not guess an IP address.</strong>
          </p>
        </div>

        <div
          className="card"
          style={{
            marginTop: "16px",
            borderColor: "rgba(239, 68, 68, 0.55)",
          }}
        >
          <h3>Do not create a new database</h3>

          <p>The SCC Rock Gym Pro database already exists.</p>

          <p>Always use:</p>

          <pre>
            <code>springsclimbingcenter</code>
          </pre>
        </div>
      </section>

      {/* ================================================================ */}
      {/* COMPUTER IDENTIFICATION                                          */}
      {/* ================================================================ */}

      <section id="computers">
        <h2>Which Computer?</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          <div className="card">
            <h3>Computer 1</h3>

            <p>
              <strong>RIGHT computer at the front desk</strong>
            </p>

            <p>
              This computer hosts the Rock Gym Pro / MySQL database.
            </p>

            <p>
              <strong>Run the RGP Connection Helper here.</strong>
            </p>
          </div>

          <div className="card">
            <h3>Computer 2</h3>

            <p>
              <strong>LEFT computer at the front desk</strong>
            </p>

            <p>
              This is the Rock Gym Pro workstation that connects to Computer
              1.
            </p>

            <p>
              Only change its database connection if the helper directs you
              to.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* RUN HELPER                                                       */}
      {/* ================================================================ */}

      <section id="run-helper">
        <h2>Run the RGP Connection Helper</h2>

        <div className="card">
          <h3>On Computer 1 — RIGHT computer</h3>

          <ol>
            <li>
              Download <strong>SCC-RGP-Connection-Helper.ps1</strong> using
              the button at the bottom of this page.
            </li>

            <li>
              Open <strong>Windows PowerShell ISE</strong>.
            </li>

            <li>
              Open:
              <pre>
                <code>SCC-RGP-Connection-Helper.ps1</code>
              </pre>
            </li>

            <li>
              Press the <strong>green Run button</strong> or press{" "}
              <strong>F5</strong>.
            </li>

            <li>
              The <strong>RGP Connection Helper</strong> will open.
            </li>

            <li>Follow the instructions shown in the helper.</li>
          </ol>
        </div>

        <p className="muted">
          The helper does the connection checks for you. You should not need
          to manually run network commands or remember an old IP address.
        </p>
      </section>

      {/* ================================================================ */}
      {/* CHECKS                                                           */}
      {/* ================================================================ */}

      <section id="what-it-does">
        <h2>What the Helper Checks</h2>

        <p>
          Before anything is changed on Computer 2, the helper checks Computer
          1.
        </p>

        <div className="card">
          <ul>
            <li>Checks that Computer 1 has an active network connection.</li>

            <li>Finds Computer 1's current IPv4 address.</li>

            <li>Checks for the Rock Gym Pro / MySQL database service.</li>

            <li>
              Checks whether the MySQL database connection on{" "}
              <strong>TCP port 3306</strong> is available.
            </li>

            <li>
              Shows the server address Computer 2 should use when appropriate.
            </li>

            <li>
              Provides the Rock Gym Pro Configuration Wizard instructions.
            </li>
          </ul>
        </div>

        <p>
          If one of the Computer 1 checks fails, follow the message shown by
          the helper instead of immediately changing Computer 2.
        </p>
      </section>

      {/* ================================================================ */}
      {/* RGP CONFIGURATION                                                */}
      {/* ================================================================ */}

      <section id="rgp">
        <h2>If the Helper Tells You to Update Computer 2</h2>

        <p>
          The helper will show the current Computer 1 IP address. Use that
          address in the Rock Gym Pro Configuration Wizard.
        </p>

        <div className="card">
          <h3>On Computer 2 — LEFT computer</h3>

          <ol>
            <li>
              Close <strong>Rock Gym Pro</strong> if it is open.
            </li>

            <li>
              Open the{" "}
              <strong>Rock Gym Pro Database Configuration Wizard</strong>.
            </li>

            <li>
              On the welcome screen, click <strong>Next</strong>.
              <br />
              <strong>Do not use Advanced Setup.</strong>
            </li>

            <li>
              On{" "}
              <strong>
                Compatible MySQL Server 5 Database Location
              </strong>
              , choose:
              <br />
              <br />
              <strong>
                I am adding a new workstation to an existing RGP deployment
                and my database server is running on another computer on my
                network.
              </strong>
            </li>

            <li>
              Find <strong>Fixed IP Address / Server Name</strong>.
              <br />
              <br />
              Enter the IP address shown by the RGP Connection Helper on
              Computer 1.
            </li>

            <li>
              On <strong>Database Server Username and Password</strong>, keep
              the existing SCC database credentials.
            </li>

            <li>
              On <strong>Rock Gym Pro Database Selection</strong>, choose:
              <br />
              <br />
              <strong>
                I already created a Rock Gym Pro database.
              </strong>
            </li>

            <li>
              Select:
              <pre>
                <code>springsclimbingcenter</code>
              </pre>
            </li>

            <li>
              If the <strong>Master Encryption Key</strong> screen appears,
              use the <strong>existing SCC encryption key</strong>.
              <br />
              <br />
              <strong>Do not create or guess a new encryption key.</strong>
            </li>

            <li>
              On <strong>Configuration Complete</strong>, verify:
              <ul>
                <li>
                  <strong>Database Server</strong> matches the IP address shown
                  by the helper.
                </li>

                <li>
                  <strong>Database Name</strong> is{" "}
                  <code>springsclimbingcenter</code>.
                </li>
              </ul>
            </li>

            <li>
              If both are correct, click <strong>Start</strong>.
            </li>
          </ol>
        </div>

        <div
          className="card"
          style={{
            marginTop: "16px",
            borderColor: "rgba(239, 68, 68, 0.55)",
          }}
        >
          <h3>If your screen does not match these instructions, stop.</h3>

          <p>
            Do not guess database settings, passwords, encryption keys, or IP
            addresses.
          </p>

          <p>
            <strong>Never create a new Rock Gym Pro database.</strong>
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* POWERSHELL SCRIPT                                                */}
      {/* ================================================================ */}

      <section id="script">
        <h2>RGP Connection Helper</h2>

        <p>
          Run this on <strong>Computer 1</strong>, the{" "}
          <strong>RIGHT computer at the front desk</strong>.
        </p>

        <div className="card">
          <h3>Download / View PowerShell Build</h3>

          <p>
            <strong>SCC-RGP-Connection-Helper.ps1</strong>
          </p>

          <a
            className="btn"
            href={SCRIPT_PATH}
            download="SCC-RGP-Connection-Helper.ps1"
          >
            Download SCC-RGP-Connection-Helper.ps1
          </a>
        </div>

        {/* ============================================================ */}
        {/* FULL SOURCE VIEWER                                           */}
        {/* ============================================================ */}

        <div
          className="card"
          style={{
            marginTop: "24px",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 20px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                borderLeft: "4px solid #ef4444",
                paddingLeft: "12px",
              }}
            >
              Developer Script (Full Source, RGP Connection Helper)
            </h3>

            <p
              className="muted"
              style={{
                marginBottom: "16px",
              }}
            >
              View the script in the browser, copy the full source, or
              download the ready-to-run PowerShell file.
            </p>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="btn"
                onClick={() => setWrapScript((current) => !current)}
              >
                {wrapScript ? "Disable wrap" : "Enable wrap"}
              </button>

              <button
                type="button"
                className="btn"
                onClick={copyScript}
                disabled={!scriptText}
              >
                {copied ? "Copied!" : "Copy all"}
              </button>

              <a
                className="btn"
                href={SCRIPT_PATH}
                download="SCC-RGP-Connection-Helper.ps1"
              >
                Download .ps1
              </a>
            </div>
          </div>

          <pre
            style={{
              margin: 0,
              padding: "18px",
              maxHeight: "650px",
              overflow: "auto",
              whiteSpace: wrapScript ? "pre-wrap" : "pre",
              overflowWrap: wrapScript ? "anywhere" : "normal",
              borderRadius: 0,
            }}
          >
            <code>
              {scriptText ||
                "Loading SCC-RGP-Connection-Helper.ps1..."}
            </code>
          </pre>
        </div>

        <p
          className="muted"
          style={{
            marginTop: "16px",
          }}
        >
          RGP Connection Helper created by Ti Schwarz for Springs Climbing
          Center.
        </p>
      </section>
    </SectionShell>
  );
}
