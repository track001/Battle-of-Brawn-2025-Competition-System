# Battle of Brawn 2025 Competition Scoring System

> Competition scoring, event operations, and automation platform developed for Springs Climbing Center in preparation for Battle of Brawn 2025.

**Primary Development Sprint:** October 19–26, 2025  
**Competition:** October 24–25, 2025  
**Event:** Battle of Brawn 2025 — Southern Colorado's Largest Climbing Competition  
**Scale:** 300+ anticipated competitors  
**Developer:** Tiana Schwarz
## Live System

**[Open the SCC Operations & Competition System](https://track001.github.io/Battle-of-Brawn-2025-Competition-System/)**

## Citizen Competition Scoring & Ranking

The citizen competition required processing results across multiple competitor categories from data collected through Google Forms and Google Sheets.

I developed a **Python-based scoring and ranking workflow** to process the exported competition data, separate competitors by category, calculate rankings, and produce organized results for the event.

Because registration and scoring data included manually entered values, the workflow also required **data validation and cleanup** to identify and correct inconsistent entries before final rankings were produced.

The workflow supported:

- Importing competition data collected through Google Forms / Google Sheets
- Cleaning and normalizing manually entered data
- Separating competitors into their appropriate categories
- Applying competition scoring and ranking logic
- Generating ordered results by category
- Reviewing anomalous or inconsistent entries before publishing results
- Producing timely citizen competition standings for a 300+ competitor event

Unlike the Finals Projector, this workflow was developed as a **Python data-processing tool rather than a staff-facing web interface**. Development occurred close to the event and was operated directly during competition, allowing implementation effort to remain focused on the public-facing finals scoring, timer, and projector systems.

**Technology:** `Python` · `Google Forms` · `Google Sheets` · `Data Processing` · `Data Validation` · `Ranking Logic`
### Competition Tools

- **[Finals Projector](https://2rfr8h.csb.app/#finals/overview)** — Live finals scoring and standings display
- **[Finals Timer](https://2rfr8h.csb.app/#timer/overview)** — Projector-safe competition timer with audible cues
- **[Raffle Generator](https://2rfr8h.csb.app/#raffle/overview)** — Randomized competitor raffle and winner tracking

### Operations Tools

- **Drawer Counter** — PowerShell-based end-of-day cash drawer reconciliation and audit workflow
- **[New Hire Onboarding](https://2rfr8h.csb.app/#onboarding/overview)** — Centralized onboarding procedures, account setup, forms, and front-desk references
- **Tools We Use** — Internal reference material for recurring operational workflows

---

## TL;DR

I designed and built this system in preparation for **Battle of Brawn 2025**, a climbing competition anticipating more than **300 competitors**, after identifying several operational workflows where staff would otherwise depend on disconnected tools, manual calculations, or information that was difficult to access during a live event.

The initial objective was straightforward: **reduce the amount of attention staff had to spend managing systems so they could spend more time running the competition and supporting the people participating in it.**

The resulting platform consolidated competition and operational tools into a single browser-accessible interface, including:

- Real-time finals scoring and rankings
- Projector-ready competition standings
- Competition timers with audible cues
- Raffle administration
- End-of-day cash drawer reconciliation
- Staff onboarding and operating procedures
- Centralized technical documentation

The competition-specific functionality was developed under an approximately **one-week implementation timeline** leading into Battle of Brawn.

The system was designed around a simple principle: **the technology should disappear into the background when people need it most.**

For competitors, that meant seeing accurate results quickly. For judges and competition staff, it meant having clear controls and immediate feedback. For gym staff, it meant reducing repetitive work and providing documented procedures that could be followed without depending on one person knowing how everything worked.

---

## The Problem

Battle of Brawn required multiple time-sensitive workflows to operate simultaneously.

During a climbing competition, scoring is not simply a recordkeeping task. Competitors need to know where they stand. Judges need consistent scoring behavior. Routesetters and organizers need confidence that results are accurate. Finals require synchronized timing and standings that can be presented to spectators without exposing administrative interfaces.

With an anticipated field of more than 300 competitors, I wanted to reduce dependence on manual processes and fragmented systems before competition day.

Rather than treating each problem independently, I built a centralized operations interface where staff could access the tools and documentation required to run the event.

---

# Competition Systems

## Finals Projector

The Finals Projector provides a live, projector-safe scoreboard for the Battle of Brawn finals.

The interface supports separate women's and men's standings and tracks:

- Boulder results
- Tops
- Zones
- Attempts to Tops
- Attempts to Zones
- Qualifier rank for tie-breaking
- Live ranking updates

Competition staff can enter results directly while rankings automatically update using IFSC-style scoring logic.

Operational controls include:

- Pause / Resume
- Manual overrides
- Reset overrides
- Blackout mode
- Display-width adjustment
- Projector title positioning
- Display tilt adjustment

The goal was to allow competition staff to update results without manipulating spreadsheets or exposing administrative tooling to the audience.

---

## Finals Timer

The Finals Timer provides a large-format, projector-safe countdown designed specifically for live climbing finals.

Features include:

- Configurable round duration
- Four-minute default competition timer
- 3–2–1 starting sequence
- Audible competition cues
- Pause / Resume
- Reset
- ±10-second adjustment
- Fullscreen display
- Blackout mode
- Drift-resistant countdown behavior
- Display positioning controls

The timer was designed so staff could operate it quickly during competition without navigating unnecessary controls.

---

## Raffle Generator

The Raffle Generator provides a controlled method for selecting prize winners from the competitor pool.

Names can be:

- Imported from CSV
- Pasted directly into the application
- Added individually

The system supports:

- Random winner selection
- Drawing with or without replacement
- Undo
- Winner history
- CSV export
- Configurable display titles

The remaining competitor pool is intentionally hidden from the audience while winners remain visible, allowing the same interface to function as both the administrative tool and public-facing display.

---

# Operations & Automation

## End-of-Day Drawer Counter

The Drawer Counter began as a PowerShell utility for simplifying nightly cash reconciliation.

The workflow standardizes denomination calculations against the expected drawer target and provides staff with a repeatable process for identifying discrepancies.

The tool supports:

- Standardized denomination calculations
- Comparison against the target drawer amount
- Consistent end-of-day reconciliation
- Screenshot generation for discrepancies
- Basic logging for traceability
- Documented PowerShell execution procedures

The objective was not simply to automate arithmetic. It was to make the process consistent across different employees and different nights while leaving evidence when the drawer did not reconcile correctly.

---

## New Hire Onboarding

The platform later expanded beyond competition operations into staff knowledge management.

The onboarding section centralizes references for:

- Employment forms
- Account and application access
- Slack
- 7Shifts
- Rock Gym Pro
- Clock-in / clock-out procedures
- Front-desk expectations
- Shift trading
- Operating hours
- Internal procedures

This reduced reliance on verbal knowledge transfer and provided new employees with a consistent reference for recurring workflows.

---

## Engineering Approach

This project was developed around operational requirements rather than as a standalone software exercise.

The development process generally followed:

**Operational Need → User Workflow → Technical Requirement → Implementation → Staff-Facing Documentation**

Examples:

| Operational Need | Technical Response |
|---|---|
| Competitors need immediate standings | Live ranking and finals projector |
| Finals require consistent round timing | Dedicated competition timer |
| Audience needs results without admin controls | Projector-safe display modes |
| Staff need rapid raffle administration | CSV-backed raffle generator |
| Drawer reconciliation varies between staff | Standardized PowerShell workflow |
| New employees depend on tribal knowledge | Centralized onboarding documentation |

The project emphasized usability, traceability, rapid access to information, and reducing cognitive load during time-sensitive operations.

---

## Design Philosophy

This project reinforced an engineering principle that has become increasingly important in my professional work:

> **A technically correct system is only useful if it provides the right information to the right people when they need it.**

For Battle of Brawn, the mission was running a safe, fair, and engaging climbing competition.

It was important that I recognize that the software was not the mission, but rather the software existed to support the mission.

This distinction influenced how I approached scoring, timing, documentation, automation, and interface design throughout this week long project.
Improvements, as always, can and will be made prior to Battle of Brawn 2026 (:

---

## Development Context

**Event:** Battle of Brawn 2025  
**Organization:** Springs Climbing Center  
**Scale:** 300+ anticipated competitors  
**Primary Development Window:** Approximately one week before competition  
**Developer:** Tiana Schwarz

### Technical Areas Demonstrated

`React` · `JavaScript` · `PowerShell` · `Web Application Development` · `Scoring Logic` · `UI/UX` · `Automation` · `Technical Documentation` · `Requirements Analysis` · `Operational Tooling` · `Data Handling` · `Knowledge Management`

---

## Current Hosting

The application is currently maintained as a browser-accessible CodeSandbox deployment.

This repository serves as the project portfolio, technical documentation, and development record for the Battle of Brawn 2025 competition system.
