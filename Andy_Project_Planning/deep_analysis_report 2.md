# Deep Analysis Report (Goldarch Web) — 2026-01-08

## What changed since last report

- Re-scan excluded all generated dirs (`.next/`, `node_modules/`, `.vercel/`, `dist/`, `build/`, `coverage/`, `out/`, `.turbo/`, `.cache/`) and included PDF/DOCX content with detailed summaries.
- PDF/DOCX review adds specific evidence of RAG chatbot scope (ticketing workflows, n8n/Airtable/Slack integrations, test scripts) and a product catalog PDF unrelated to app architecture.
- No additional plan/ADR files were discovered beyond the custom plan docs already listed.

## Executive summary

- The repository contains multiple parallel application codebases (Next.js app router, Vite app in `src/`, separate Vite app in `gold_arch_website/`, and additional template/prototype folders), making the canonical runtime unclear and raising deployment risk.
- Core CRM pages and Framework B API routes exist and are wired in Next.js, but API routes do not enforce authentication or user scoping.
- Supabase RLS policies are permissive in SQL files, contradicting security expectations in docs and creating a data exposure risk if applied as-is.
- Documentation and scripts drift from the actual repo state (missing test scripts, missing dependencies like `dotenv`), indicating incomplete operational readiness.
- Secrets are likely stored in `.env` and `.env.local` at repo root, increasing accidental exposure risk.
- PDF/DOCX plan artifacts reinforce the RAG/AI chatbot goals and detail an n8n ticketing automation track that is not visible in the app runtime.
- Framework B implementation is comprehensive and well-structured; production hardening (auth, rate limiting, monitoring, tests) remains the primary gap.

## Existing plans alignment

- Plan files found:
  - `PROJECT_STATUS.md`
  - `Modular_Multi-AI_Project_Plan_Skeleton_Architecture.md`
  - `Plan_for_Building_an_AI-Powered_Chatbot_Platform.md`
  - `Framework_B/ARCHITECTURE.md`
  - `FRAMEWORK_B_READY.md`
  - `chat-bot_framework/Plan_for_Building_an_AI-Powered_Chatbot_Platform.md`
  - `chat-bot_framework/Modular_Multi-AI_Project_Plan_Skeleton_Architecture.md`
  - `chat-bot_framework/RAG_Customer_Service_Chatbot_Business_Overview.pdf`
  - `chat-bot_framework/RAG_Customer_Service_Chatbot_Business_Overview.docx`
  - `chat-bot_framework/RAG_Customer_Service_Chatbot_Technical_Documentation.pdf`
  - `chat-bot_framework/RAG_Customer_Service_Chatbot_Technical_Documentation.docx`
- Alignment:
  - The repo aligns with the two-framework architecture (Framework A in `app/`, Framework B in `Framework_B`/`Framework_B_Implementation`).
  - Framework B design and services match the plan’s RAG and document processing goals; chat-bot framework docs reinforce this direction.
- Conflicts / decisions needed:
  - The plans assume a primary Next.js app, but the repo contains multiple separate app implementations (Vite/React apps and templates) with overlapping functionality and assets.
  - The plans call for production hardening (auth, rate limiting, monitoring, tests); current API routes and SQL policies are permissive and lack enforcement.

## System overview

```
                                      ┌───────────────────────────┐
                                      │     Next.js App Router    │
                                      │  app/* + app/api/* routes │
                                      └──────────────┬────────────┘
                                                     │
                                                     ▼
┌────────────────────────────┐            ┌────────────────────────┐
│        Framework A (CRM)   │            │     Framework B (AI)    │
│  app/app-dashboard/* pages │◀──────────▶│ Framework_B + Impl svc │
└────────────────────────────┘            └────────────────────────┘
                                                     │
                                                     ▼
                                  ┌────────────────────────────────┐
                                  │ External Services              │
                                  │ Supabase, OpenAI, Pinecone     │
                                  └────────────────────────────────┘

Parallel/secondary app bundles:
┌────────────────────────────┐  ┌──────────────────────────────┐  ┌──────────────────────────┐
│ Vite app (src/*)            │  │ gold_arch_website/ (Vite)     │  │ apply_theme/ (Next.js)   │
│ React Router + Vite config  │  │ separate package.json         │  │ separate package.json   │
└────────────────────────────┘  └──────────────────────────────┘  └──────────────────────────┘
```

Key components
- Next.js app router in `app/`, with CRM dashboard pages and API routes.
- Framework B services in `Framework_B_Implementation/` and configuration in `Framework_B/`.
- Multiple prototype/template folders with their own pages and assets (`add_pages/`, `quote_page/`, `task_managment_page/`, `activity_page/`, `themes/`).

## Data flow & boundaries

- CRM UI (Framework A) uses Supabase and React Query for data, with UI components in `components/` and `lib/`.
- Framework B API routes under `app/api/framework-b/*` orchestrate document ingestion and RAG queries.
- Document ingestion: file upload → DocumentProcessor → EmbeddingsService → VectorStore (Pinecone).
- Query flow: user question → embeddings → Pinecone similarity search → LLM response with citations.
- External services: Supabase (auth/db/storage), OpenAI (embeddings/chat), Pinecone (vector DB), Resend (email).

## Risk register

- High: Multiple parallel apps and templates blur the canonical runtime and increase accidental deployment of the wrong app (`app/`, `src/`, `gold_arch_website/`, `apply_theme/`).
- High: Framework B API routes do not enforce authentication or user-based scoping, enabling data access without user context (`app/api/framework-b/*`).
- High: Supabase RLS policies in SQL files are permissive (`USING (true)`), which would expose data if applied (`fix-rls-policy.sql`, `supabase-documents-table.sql`).
- Medium: Documentation references tests and scripts that do not exist in the root `package.json`, indicating operational drift (`docs/TECHNICAL_DOCUMENTATION.md`, `package.json`).
- Medium: `.env`/`.env.local` are present in repo root, raising the risk of secret leakage or inconsistent configuration.
- Medium: `scripts/setup-pinecone.js` depends on `dotenv`, but `dotenv` is not declared in root dependencies.
- Low: Prototype/template directories are mixed into the root, inflating repo size and slowing onboarding.

## Maintainability & architecture issues

- Overlapping app roots (`app/`, `src/`, `gold_arch_website/`, `apply_theme/`) make architecture and ownership unclear.
- Tooling is fragmented (Next.js config, Vite config, multiple Tailwind configs) and likely inconsistent across subprojects.
- Documentation is extensive but drifts from actual repo scripts and enforcement.
- Prototype/template directories are intermingled with production code, obscuring the real surface area.

## Performance & scalability notes

- Document processing and RAG workloads are cost/latency heavy; Framework B supports caching and batching but there is no operational enforcement in API routes.
- Next.js upload size limit is configured at 50MB; serverless environments may struggle with memory/timeouts.
- No explicit observability or performance instrumentation exists for API routes.

## Security & privacy notes

- Framework B endpoints accept requests without auth or user verification; they should enforce Supabase session validation and namespace scoping.
- SQL policies are permissive; production should use authenticated policies for all sensitive tables.
- `.env`/`.env.local` should not be versioned; ensure `.gitignore` coverage and rotate secrets if committed.
- Conversation storage in ChatService is in-memory only, with optional userId filtering; if persisted later, access controls must be enforced.

## Refactor plan (phased, with file-level guidance)

Phase 0: First 30 minutes
- Decide the canonical runtime (Next.js app router vs. Vite). Document the decision in `README.md` and identify which directories are legacy or prototypes.
- Ensure `.gitignore` covers `.env`, `.env.local`, and any local secrets; rotate keys if already committed.

Phase 1: 1–2 days (stability + clarity)
- Consolidate the repo to one primary app; archive or move `gold_arch_website/`, `apply_theme/`, `quote_page/`, `activity_page/`, `task_managment_page/`, and `add_pages/` out of the main tree.
- Normalize tooling: keep a single Tailwind config and one build system aligned with the canonical app.
- Fix script/dependency drift: add missing deps like `dotenv` for scripts or refactor scripts to not require it.

Phase 2: 2–5 days (production hardening)
- Enforce authentication and authorization on Framework B API routes in `app/api/framework-b/*`.
- Implement rate limiting and CORS policy for AI endpoints.
- Replace permissive RLS policies with authenticated policies for `suppliers`, `categories`, and `documents` tables.

Phase 3: 1–2 weeks (quality + scale)
- Add a minimal test harness that matches documented commands (unit + integration + E2E) or update docs to reflect actual tests.
- Add logging, error tracking, and usage metrics for AI endpoints.
- Validate performance with controlled document uploads and RAG queries under realistic loads.

## Test/verification plan

- `npm run lint` (verify linting passes after tooling consolidation).
- `npm run build` (verify the canonical app builds cleanly).
- Validate Framework B endpoints with documented curl commands in `FRAMEWORK_B_READY.md`.
- If test commands are added, wire them to CI and run on PRs.

## Appendix: important files + quick commands

Important files
- `package.json`
- `next.config.js`
- `app/layout.js`
- `app/app-dashboard/layout.tsx`
- `app/api/framework-b/documents/upload/route.ts`
- `app/api/framework-b/documents/search/route.ts`
- `app/api/framework-b/chat/send/route.ts`
- `Framework_B_Implementation/README.md`
- `docs/TECHNICAL_DOCUMENTATION.md`
- `docs/USER_MANUAL.md`
- `fix-rls-policy.sql`
- `supabase-documents-table.sql`

Quick commands
- `npm run dev`
- `npm run build`
- `npm run lint`

## Appendix: PDF/DOCX summaries

- `HONSOAR FRAMELESS CABINET LIST -2024.pdf`: Product catalog for HONSOAR frameless kitchen cabinets and materials; includes company overview, finishes, colors, construction details, and dimensional listings. Not directly related to the CRM/RAG architecture.
- `docs/TECHNICAL_DOCUMENTATION.docx`: Mirrors `docs/TECHNICAL_DOCUMENTATION.md` (system architecture, stack, project structure, security, deployment, testing); includes references to test commands that are not present in root scripts.
- `chat-bot_framework/RAG_Customer_Service_Chatbot_Business_Overview.docx`: Business overview of a RAG-powered support chatbot with ticket lifecycle automation (Airtable), Slack notifications, SLA/priority handling, and ROI metrics; includes roadmap and KPIs.
- `chat-bot_framework/RAG_Customer_Service_Chatbot_Technical_Documentation.docx`: Detailed technical spec for an n8n-based RAG chatbot with Airtable ticketing and Slack integrations; includes test scripts, webhook env vars, troubleshooting, and deployment steps.
- `chat-bot_framework/RAG_Customer_Service_Chatbot_Business_Overview.pdf`: Same content as the business overview DOCX, formatted as a PDF.
- `chat-bot_framework/RAG_Customer_Service_Chatbot_Technical_Documentation.pdf`: Same content as the technical documentation DOCX, formatted as a PDF.
