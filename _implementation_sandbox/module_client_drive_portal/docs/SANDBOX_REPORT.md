# Sandbox Build Report: Client Drive Portal + Section Access

## Scope and constraints
- All work completed inside `_implementation_sandbox/module_client_drive_portal/`.
- No production files modified.
- UI/UX preserved by cloning existing UI components and auth helpers into the sandbox.

## What was built
### Data model + RLS (Supabase)
- Added schema and policies in `migrations/20260201_client_drive_portal.sql`:
  - `client_accounts` for client organizations.
  - `client_memberships` for user-to-client mapping.
  - `client_drive_folders` for Drive folder assignments.
  - `crm_section_access` for section-level access control.
  - `security_audit_logs` for sensitive action logging.
  - RLS policies with `is_admin_or_manager()` helper for admin enforcement.
  - Unique mapping guard on `(client_id, drive_folder_id)`.
  - Default `access_level` set to `none` for least-privilege.

### Drive integration (server-side)
- `lib/drive/google-auth.ts`: service account JWT exchange for access tokens.
- `lib/drive/drive-client.ts`: list folder contents, fetch metadata, download via proxy.
- `lib/drive/drive-validate.ts`: parent chain validation to prevent folder traversal/ID swapping.
- `lib/drive/drive-cache.ts`: Upstash Redis cache helpers.

### API layer
- Auth wrapper with section-level checks: `lib/api-auth.ts`.
- Client portal API:
  - `GET /api/client-portal/folders`
  - `GET /api/client-portal/folders/:folderId`
  - `GET /api/client-portal/files/:fileId`
- Admin APIs:
  - `POST/GET/DELETE /api/admin/client-drive-mapping`
  - `GET/POST /api/admin/section-access`
- Rate limiting via Upstash (`lib/rate-limit.ts`).
- Audit logging via service role (`lib/audit.ts`).

### UI (sandbox-only)
- Client portal:
  - `app/module-client-portal/layout.tsx`
  - `app/module-client-portal/page.tsx`
  - `app/module-client-portal/folder/[id]/page.tsx`
- Admin utilities:
  - `app/module-admin-drive-mapping/page.tsx`
  - `app/module-admin-section-access/page.tsx`
- UI components cloned locally from production:
  - `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `tabs.tsx`, `scroll-area.tsx`.

### Tooling
- Drive smoke test (service account / OpenSSL signing):
  - `tools/drive_smoke_test.py`
- Drive smoke test with ADC fallback:
  - `tools/drive_smoke_test_adc.py`

### Documentation
- Env checklist: `docs/ENV_CHECKLIST.md`
- Integration notes: `docs/INTEGRATION_NOTES.md`
- Seed snippet: `docs/SEED_SNIPPETS.sql`

## Issues encountered and resolutions
1) Drive smoke test failed due to missing env var
   - `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` was not set.
   - Resolution: Added ADC-based smoke test and documented ADC steps.

2) ADC test failed with insufficient scopes (403)
   - ADC credentials did not include Drive scopes.
   - Resolution: Re-auth with Drive scope:
     - `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/drive.readonly`

3) Data model guardrails
   - Identified missing unique constraint on `client_drive_folders`.
   - Identified default `crm_section_access` as too permissive.
   - Resolution: Added unique constraint and changed default access to `none`.

## What we achieved
- End-to-end sandbox implementation of a Google Drive folder viewer for clients.
- Strict tenant isolation with folder validation and RLS.
- Section-level access control enforced in UI and API.
- Audit logs for sensitive actions.
- Deterministic test harness and admin tooling for mapping and access management.

## Integration steps (to merge into main project later)
1) Apply migration SQL from:
   - `_implementation_sandbox/module_client_drive_portal/migrations/20260201_client_drive_portal.sql`
2) Move or merge API handlers into production `app/api`.
3) Merge auth and permission helpers into shared libraries.
4) Add a production route for Client Portal and connect to existing layout.
5) Add section access gating to production nav and routes.
6) Verify with the seed snippet and smoke tests:
   - `docs/SEED_SNIPPETS.sql`
   - `tools/drive_smoke_test_adc.py`

## Sandbox routes for testing
- `/module-client-portal`
- `/module-admin-drive-mapping`
- `/module-admin-section-access`

## Env vars required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` (or ADC for `drive_smoke_test_adc.py`)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
