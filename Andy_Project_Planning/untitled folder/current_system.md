# Current System Overview

This document captures the **current framework state** that all future planning, refactoring, and AI-assisted design **must respect**.
It is derived from repository scans, audit context, and deep analysis reports.

---

## Current Framework

### Tech stack
- **Frontend**
  - Next.js 16.1+ (App Router)
  - React 19 + TypeScript 5.9
  - Tailwind CSS
  - Radix UI / shadcn/ui component library
  - React Query (@tanstack/react-query) for data fetching
  - React Hook Form + Zod for form validation
- **Backend / APIs**
  - Next.js API routes (`app/api/*`)
  - Framework B (AI/RAG services)
  - Resend (email service)
- **Database & Storage**
  - Supabase (Postgres, Auth, Storage)
- **Document Processing**
  - PDF parsing (pdf-parse)
  - DOCX processing (mammoth, docxtemplater)
  - 50MB upload limit configured
- **AI / Automation**
  - OpenAI (chat + embeddings)
  - Pinecone (vector database)
  - n8n (workflow automation – ticketing, ingestion, notifications)
- **Runtime / Tooling**
  - Node.js / Bun (mixed usage across subprojects)
  - Vercel deployment configuration present

---

### Auth model
- Supabase Authentication is present but **not consistently enforced**
- API routes under `app/api/*` currently:
  - Do **not** uniformly validate user sessions
  - Do **not** scope data by user / role
- Supabase RLS policies exist but are **permissive** in current SQL files
- Role-based access control is **conceptually planned** but **not fully implemented**

> ⚠️ Any new feature must assume **auth hardening is pending**, not completed.

---

### Data models (current)
Primary entities observed across UI and APIs:
- Users
- Projects
- Suppliers
- Deals
- Quotes
- Documents
- Tasks
- Activities

Characteristics:
- Relational structure via Supabase
- Weak enforcement of ownership / role boundaries
- Documents are stored and processed for:
  - Upload
  - AI summarization
  - Vector embedding (Framework B)

---

### Key flows already implemented

#### Leads
- Lead-like behavior exists via:
  - Deals
  - Projects
- No dedicated “Lead” lifecycle yet
- Leads are implicitly handled through Deals / Projects

#### Deals
- CRUD UI exists
- Linked to Projects
- Limited automation
- No enforced approval or role gating

#### Documents
- Upload UI exists
- Document processing pipeline exists (Framework B):
  - Upload → processing → embeddings → RAG search
- No strict document visibility rules enforced yet
- Templates exist conceptually but not as locked workflows

#### Suppliers
- Supplier listing and detail views exist
- Category-based navigation exists
- No strict supplier visibility restrictions by role/region yet
- Rating / internal notes are partially present or planned

---

### Known constraints (non-negotiable)

- **Do not change navigation structure**
- **Do not break existing APIs**
- Do not remove existing pages or routes
- Do not assume a greenfield rebuild
- Multiple parallel app folders exist — canonical runtime is **Next.js app router**
- Prototype / template folders must be treated as **read-only references**

---

## Architectural Reality (Important)
- Multiple parallel app implementations exist:
  - Next.js (canonical)
  - Vite-based apps (legacy / prototype)
  - Theme / showcase clones
- Only **one runtime should be treated as production**
- Framework B is structurally sound but requires:
  - Auth enforcement
  - Namespace scoping
  - Production hardening

---

## Usage Rule for LLMs
Any LLM or AI agent must:
- Treat this document as **ground truth**
- Cross-check against `intent_contract.md`
- Propose changes as **additive, not destructive**
- Never suggest breaking navigation or APIs
