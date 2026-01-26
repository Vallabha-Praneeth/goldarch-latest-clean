# Intent Contract — Client Requirements (Derived from Meetings)

This document is the **authoritative intent contract** derived from:
- Translated meeting transcripts
- Repeated verbal emphasis across sessions
- Clarifications explicitly stated by the client

This file is **not UI design**, **not tool comparison**, and **not implementation detail**.
It exists to lock *intent* before architecture or feature expansion.

---

## 1. Core Intent (High-Level) — **Explicit + Repeated**
The client wants a centralized construction and procurement management system that:
- Acts as a **single source of truth** (replacing WhatsApp, Excel, email, Dropbox)
- Starts **simple and controlled**, then expands in phases
- Is **permission-driven** from day one
- Enables **safe outsourcing of procurement work** across regions (India / China / US)
- Provides **project lifecycle visibility** without manual follow-ups

Source:
- Multiple references across both meetings to fragmentation, chasing updates, and loss of control.

---

## 2. Access & Control Intent — **Explicit / Non‑Negotiable**
The client explicitly requires:
- The system to be **private initially**
- Ability to **grant selective access later**
- Users must be restricted by:
  - Region
  - Category
  - Project
  - Role

Examples stated verbally:
- “For Joy login, only kitchen suppliers”
- “Only US suppliers, not China”

Admin must control:
- Who sees what
- What actions are allowed (view / send / rate / approve)

This is a **core requirement**, not an enhancement.

---

## 3. Supplier & Procurement Intent — **Explicit + Derived**
Procurement must be:
- Outsourcable
- Template-driven
- Filterable and searchable

Supplier system requirements:
- Master supplier database
- Categorization (category → subcategory)
- Filterable by geography, capability, project
- Internal notes and ratings (with controlled visibility)

Team members:
- Must send quotations **without seeing full supplier universe**
- Must work from **predefined formats**

---

## 4. Quotation, Documents & Templates — **Explicit Pain → Structured Intent**
The client wants structured handling of:
- Drawings
- Plans
- Bills
- Receipts
- Quotations

Key intent:
- Avoid ad‑hoc uploads
- Avoid re‑typing formats repeatedly
- Use **templates** for:
  - Quotations
  - Invoices
  - Emails
  - Follow‑ups
  - Meeting requests

Templates must allow:
- Editing values only (names, amounts, dates)
- Consistent formatting across teams

---

## 5. Project Lifecycle Intent — **Derived + Standardized**
Projects must have:
- Clear lifecycle states:
  - Planning
  - Active
  - Hold
  - Completed
  - Cancelled
- Progress tracking (percentage-based)
- Linkage to:
  - Payments
  - Milestones
  - Retention amounts

Each project must attach:
- Procurement data
- Finance data
- Operational data
- Documents
- Communications

---

## 6. Reporting & Dashboard Intent — **Explicit**
Client explicitly wants:
- High-level dashboards
- No manual chasing for updates
- Visibility into:
  - Work in progress
  - Pending payments
  - Completed vs pending work

Future-facing:
- Investor dashboards
- Read-only access
- No emails required for updates

---

## 7. Phased Execution Intent — **Explicit**
Client clearly defined phasing:

### Phase 1
- Define structure
- Add features
- Use sample / dummy data
- Validate usability

### Phase 2
- Upload real data
- Migrate Excel sheets
- Lock schema
- Avoid rework

Client explicitly does **not** want continuous schema changes after data entry.

---

## 8. Technology / Platform References — **Clarified Constraint**
The client references other tools only for:
- Conceptual understanding
- Inspiration

Explicit clarifications:
- “This is just for knowledge”
- “I’m showing the idea”

No requirement for:
- Feature parity
- Exact UI replication

---

## 9. URL / Access Intent — **Explicit**
Client requested:
- Web access link
- Ability to:
  - Sign up
  - Test with a sample project

Later:
- iOS app access

Interpretation:
- Web is mandatory
- Mobile is secondary
- Authentication + roles required from start

---

## 10. Explicit Exclusions (Scope Guardrail)
This intent contract **does NOT include**:
- UI layout decisions
- Tool comparisons
- Feature justification
- Screenshots interpretation
- Assumptions beyond verbal statements

Anything outside this document requires **explicit client confirmation**.

---

## Status
- This file supersedes fragmented markdown notes
- This file is the **single intent reference** for planning, architecture, and AI-assisted design
