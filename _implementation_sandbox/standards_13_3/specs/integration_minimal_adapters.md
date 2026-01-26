# Integration Notes (Add-Only, Reversible)

## Minimal call sites (suggested)
- `/Users/anitavallabha/goldarch_web_copy/app/api/plans/[jobId]/result/route.ts`
  - Add an optional adapter call after extraction results are assembled.
  - Purpose: attach a compliance preview payload to the response (no behavior change if adapter absent).
- `/Users/anitavallabha/goldarch_web_copy/app/app-dashboard/plans/[jobId]/quote/page.tsx`
  - Add a client-side, optional compliance check call before generating a quote.
  - Purpose: show allowed options or restrictions for the selected item category.
- `/Users/anitavallabha/goldarch_web_copy/app/api/quotes/generate/route.ts` (if present in repo)
  - Add an optional compliance check before finalizing line items.
  - Purpose: log informational compliance gate results without blocking.

## Adapter pattern (add-only)
- Create a new API handler (e.g., `/api/compliance/check`) that wraps `ComplianceGate`.
- Existing flows should call the adapter only when `ENABLE_COMPLIANCE_GATE=true` to avoid breaking behavior.
- If the adapter is missing or errors, fall back to current flow with a warning log.
