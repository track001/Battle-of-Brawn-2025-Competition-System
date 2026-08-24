// src/components/pages/Onboarding.tsx
import React from "react";
import Panel from "../Panel";
import SectionShell from "../ui/SectionShell";
import {
  HOURS as HOURS_CONST,
  HOUSEKEEPING as HK_CONST,
} from "../../config/constants";

// Fallbacks to prevent runtime crashes if constants aren't defined
const HOURS = HOURS_CONST ?? {
  Monday: "10am–10pm",
  Tuesday: "6am–10pm",
  Wednesday: "10am–10pm",
  Thursday: "6am–10pm",
  Friday: "10am–10pm",
  Saturday: "10am–8pm",
  Sunday: "12pm–8pm",
};

const HOUSEKEEPING = HK_CONST ?? {
  billingRuns: "27th of each month",
  cleanersNights: ["Sunday", "Tuesday", "Thursday", "Friday"],
  cancelPolicy:
    "Cancellations must be submitted through springsclimbingcenter.com; no phone or in-person cancellations. The website form ensures proper documentation.",
};

/**
 * ============================================================================
 * Onboarding — First-day and week-one checklist (SCC)
 * ----------------------------------------------------------------------------
 * Audience: New staff. Action-first. Minimal jargon.
 * ============================================================================
 */

export default function Onboarding() {
  return (
    <SectionShell
      toc={[
        { id: "overview", label: "Overview" },
        { id: "forms", label: "Employment Forms" },
        { id: "accounts", label: "Accounts & Access" },
        { id: "rgp", label: "Rock Gym Pro (RGP) PIN" },
        { id: "rgp-quick", label: "RGP Timeclock — Quick Reference" },
        { id: "expectations", label: "Front Desk Expectations" },
        { id: "shift-trading", label: "Shift Trading Policy" },
      ]}
      standard={
        <ul style={{ margin: "8px 0 0 18px" }}>
          <li>Safety and paper trail first; speed comes after correctness.</li>
          <li>
            When unsure: pause, ask, then act. Document in Slack if relevant.
          </li>
        </ul>
      }
    >
      {/* ===================== Overview ===================== */}
      <section id="overview">
        <h1>Onboarding — First Day</h1>
        <div className="accent" />
        <p className="muted">
          This is your one-link orientation. Start at Employment Forms, then
          create your accounts, set your Rock Gym Pro PIN, and review front desk
          expectations.
        </p>

        <div className="grid2">
          <Panel title="What happens today">
            <ol>
              <li>Fill out employment forms with your manager.</li>
              <li>
                Get Slack + 7Shifts access working on your phone or SCC PC.
              </li>
              <li>Create your Rock Gym Pro (RGP) clock in/out PIN.</li>
              <li>Shadow a front-desk open or close during week one.</li>
            </ol>
          </Panel>

          <Panel title="Front Desk Hours (reference)">
            <table className="spec">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(HOURS).map(([day, open]) => (
                  <tr key={day}>
                    <td>{day}</td>
                    <td>{open}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </section>

      {/* ===================== Forms ===================== */}
      <section id="forms">
        <h2>Employment Forms (Day 1)</h2>

        <div className="grid2">
          <Panel title="Complete with manager present">
            <ol>
              <li>
                <b>Form I-9</b> — Employment eligibility verification. Bring
                your required IDs.
              </li>
              <li>
                <b>Form W-4</b> — Federal tax withholding. <b>Note:</b> W-2 is
                the year-end wage statement; you don’t fill it out.
              </li>
              <li>
                <b>Employee Acknowledgement</b> — Policy & safety agreement;
                media consent if needed.
              </li>
              <li>
                <b>Direct Deposit</b> (optional but recommended) — Provide
                routing and account numbers.
              </li>
            </ol>
          </Panel>

          {/* Downloads sub-panel */}
          <Panel title="Downloads (reference copies)">
            <p className="muted small">
              These are placeholders under <code>/public/forms</code>. Swap the
              links with the Google Drive versions when ready.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <a className="btn tiny" href="/forms/I-9.pdf" download>
                Download I-9
              </a>
              <a className="btn tiny" href="/forms/W-4.pdf" download>
                Download W-4
              </a>
              <a
                className="btn tiny"
                href="/forms/EmployeeAcknowledgement.pdf"
                download
              >
                Acknowledgement
              </a>
              <a className="btn tiny" href="/forms/DirectDeposit.pdf" download>
                Direct Deposit
              </a>
            </div>
          </Panel>
        </div>
      </section>

      {/* ===================== Accounts ===================== */}
      <section id="accounts">
        <h2>Accounts & Access</h2>

        <div className="grid2">
          <Panel title="Slack">
            <ul>
              <li>Accept your invite from management.</li>
              <li>Install mobile or desktop; set notifications.</li>
              <li>
                Join relevant channels like <code>#desk-staff</code> or{" "}
                <code> #coaching</code> .
              </li>
              <li>Use threads; post screenshots for drawer or timer issues.</li>
            </ul>
          </Panel>

          <Panel title="7Shifts">
            <ul>
              <li>
                Accept your invite, finish your profile, and set availability.
              </li>
              <li>
                Request time off in 7Shifts <i>and</i> log it (by creating an
                all-day 'event') in the Google Calendar under{" "}
                <b>“Staff Requested Time Off ”</b>
              </li>
            </ul>
          </Panel>
        </div>
      </section>

      {/* ===================== RGP PIN ===================== */}
      <section id="rgp">
        <h2>Rock Gym Pro (RGP) — Clock In/Out PIN</h2>

        <Panel title="What RGP is">
          <p>
            <b>Rock Gym Pro (RGP)</b> is the gym’s point-of-sale and membership
            system. It handles check-ins, retail, waivers, and the timeclock.
            Your <b>PIN</b> lets you clock in/out at the desk.
          </p>
        </Panel>

        <Panel title="Create or update your PIN">
          <ol>
            <li>
              At the front desk, open <b>RGP</b>.
            </li>
            <li>
              Manager opens <b>Employees → Timeclock</b>.
            </li>
            <li>Find your employee record and set a 4–6 digit PIN.</li>
            <li>Test: enter it on the timeclock to confirm it works.</li>
          </ol>
        </Panel>
      </section>

      {/* ===================== RGP QUICK REF ===================== */}
      <section id="rgp-quick">
        <h2>RGP Timeclock — Quick Reference</h2>

        <div className="grid2">
          <Panel title="Missed punch / wrong time">
            <ol>
              <li>
                Message <b> Denver </b> or <b> Alex </b> with date, shift, and
                what happened.
              </li>
            </ol>
          </Panel>

          <Panel title="If your PIN doesn’t work">
            <ul>
              <li>
                Confirm you’re on the timeclock screen (under{" "}
                <b> Data Entry </b>).
              </li>
              <li>Retry your PIN carefully.</li>
              <li>Still not working? Contact Denver or Alex.</li>
            </ul>
          </Panel>
        </div>
      </section>

      {/* ===================== Expectations ===================== */}
      <section id="expectations">
        <h2>Front Desk — Expectations</h2>

        <div className="grid2">
          <Panel title="Billing cadence">
            <p>
              Monthly billing runs on the <b>{HOUSEKEEPING.billingRuns}</b>.
              Expect questions; answer calmly, stick to facts.
            </p>
          </Panel>

          <Panel title="Membership cancellations">
            <p>{HOUSEKEEPING.cancelPolicy}</p>
          </Panel>

          <Panel title="Cleaners">
            <p>
              Night cleaners are scheduled:{" "}
              <b>{HOUSEKEEPING.cleanersNights.join(", ")}</b>.
            </p>
          </Panel>
        </div>
      </section>

      {/* {/* ===================== Shift Trading ===================== */}
      <section id="shift-trading">
        <h2>Shift Trading Policy</h2>

        <div className="grid2">
          <Panel title="Quick policy">
            <ul>
              <li>
                <b>
                  If no one takes your shift, you’re still responsible for
                  working it.
                </b>
              </li>
              <li>
                All trades are finalized only after <b>Denver</b> approves them
                in <b>7Shifts</b>.
              </li>
              <li>
                Use Slack for visibility, but the official record is the request
                in 7Shifts.
              </li>
            </ul>
          </Panel>

          <Panel title="How to request a trade (7Shifts)">
            <ol>
              <li>Open 7Shifts → find the shift you want to trade.</li>
              <li>
                Choose <b>Offer Shift</b> (or <b>Swap</b>, if you’re proposing a
                direct swap).
              </li>
              <li>
                Add a short note (date/time + reason). Keep it professional and
                concise.
              </li>
              <li>
                Post in <code>#desk-staff</code> on Slack with the same details
                and @tag people who might be able to cover.
              </li>
              <li>
                When someone accepts, the request still needs{" "}
                <b>Denver’s approval in 7Shifts</b> to be official.
              </li>
            </ol>
          </Panel>

          <Panel title="If no one picks it up">
            <ul>
              <li>
                You remain scheduled. <b>Plan to work the shift</b> unless it is
                approved and reassigned in 7Shifts.
              </li>
              <li>
                If it’s an emergency and you still cannot make it, contact{" "}
                <b>Denver</b> directly.
              </li>
            </ul>
          </Panel>

          <Panel title="Manager approval & best practices">
            <ul>
              <li>
                <b>Denver</b> (Gym Manager) final-approves trades in 7Shifts.{" "}
                <b>Alex</b> can help review edge cases or coverage conflicts.
              </li>
              <li>
                Request trades early (48–72 hours is ideal). Same-day trades may
                be denied if coverage is risky.
              </li>
              <li>
                Confirm after approval: verify your schedule in 7Shifts reflects
                the change.
              </li>
            </ul>
          </Panel>
        </div>
      </section>
    </SectionShell>
  );
}
