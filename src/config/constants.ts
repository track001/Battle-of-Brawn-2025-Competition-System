/**
 * =====================================================================
 *  Springs Climbing Center — Configuration Constants
 * ---------------------------------------------------------------------
 *  PURPOSE:
 *    Centralizes all static operational data used throughout the SCC SOP Hub.
 *    These constants keep the front-end React components clean and DRY
 *    (Don’t Repeat Yourself) by isolating change-prone details—hours,
 *    staff contact info, URLs, and cross-team tools—into a single source
 *    of truth.
 *
 *  HOW IT WORKS:
 *    - React components import these exports directly.
 *    - If any info changes (hours, staff name, etc.), only this file
 *      needs to be updated.
 * =====================================================================
 */

/* ==============================
   CONTACT INFORMATION
   Used for footer, About section, and SOP ownership context.
   ============================== */
export const CONTACT = {
  name: "Tiana J. Schwarz",
  phone: "(720) 717-5523",
  email: "schwarztiana@gmail.com",
  linkedin: "https://www.linkedin.com/in/tschwarz001/",
  github: "https://github.com/track001",
};

/* ==============================
       OPERATING HOURS
       Pulled directly from the SCC public website footer.
       Stored as key–value pairs so React can iterate over them
       when rendering the “Hours” panel.
       ============================== */
export const HOURS = {
  Monday: "10 AM – 10 PM",
  Tuesday: "6 AM – 10 PM",
  Wednesday: "10 AM – 10 PM",
  Thursday: "6 AM – 10 PM",
  Friday: "10 AM – 10 PM",
  Saturday: "10 AM – 8 PM",
  Sunday: "12 PM – 8 PM",
};

/* ==============================
       MEMBERSHIP CANCELLATION LINK
       Reference to SCC’s official cancellation page so staff never
       manually type or guess the URL. The front-end imports this
       into a <CancelMembershipButton /> component.
       ============================== */
export const CANCELLATION_URL = "http://springsclimbingcenter.com/";

/* ==============================
       FACILITY NOTES
       Critical recurring operational notes for front-desk awareness.
       Rendered as a <ul> in the FrontDesk page.
       ============================== */
export const NOTES = [
  "Membership cancellations must be submitted through the official SCC website (no in-person or phone cancellations).",
  "Monthly billing runs on the 27th — verify payment updates before then.",
  "Cleaning crew visits Sunday, Tuesday, Thursday, and Friday evenings.",
];

/* ==============================
       TOOLS WE USE
       Replaces 'AppsWeUse' with human-readable tool references.
       Each object can include name, description, and optional link.
       ============================== */
export const TOOLS_WE_USE = [
  {
    name: "7Shifts",
    description:
      "Used for scheduling, requesting time off, and tracking shift swaps. PTO should also be logged in SCC’s Google Calendar (All-day event) under 'Time Off Requests'.",
  },
  {
    name: "Slack",
    description:
      "Primary communication hub. Staff join role-specific channels such as #desk-staff, #coaching, and #events.",
  },
  {
    name: "Google Calendar",
    description:
      "Used for logging time-off requests and checking scheduled events for SCC programs or parties.",
  },
  {
    name: "Band App",
    description:
      "Coach Alex Ford’s communication platform for parent coordination on practices and competitions.",
  },
];

/* ==============================
       VERSIONING / LAST UPDATED
       Helpful for automatic 'Last Updated' timestamps in the footer.
       Converts the system date to a locale string on import.
       ============================== */
export const LAST_UPDATED = new Date().toLocaleDateString();
