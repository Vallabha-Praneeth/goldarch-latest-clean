# Module: Client Drive Portal (Sandbox Only)

This module is an isolated implementation sandbox for the client Drive portal and section-level access control.
Nothing here is wired into production routes or shared libraries yet.

## Cloned files (copied from production for UI/UX consistency)
- `components/ui/button.tsx` -> `components/ui/button.tsx` (button styling and variants)
- `components/ui/card.tsx` -> `components/ui/card.tsx` (card layout patterns)
- `components/ui/input.tsx` -> `components/ui/input.tsx` (form inputs)
- `components/ui/badge.tsx` -> `components/ui/badge.tsx` (status tags)
- `components/ui/tabs.tsx` -> `components/ui/tabs.tsx` (tab styles)
- `components/ui/scroll-area.tsx` -> `components/ui/scroll-area.tsx` (scrollable panels)
- `lib/utils.ts` -> `lib/utils.ts` (Tailwind class merge helper)
- `lib/auth-provider.tsx` -> `lib/auth-provider.tsx` (Supabase auth wiring)
- `lib/supabase-client.ts` -> `lib/supabase-client.ts` (browser client)

Each cloned file is kept local to preserve the existing look-and-feel without touching production files.

## Contents
- `migrations/`: Supabase SQL (tables, enums, RLS, policies)
- `lib/drive/`: Google Drive API integration (service account + proxy helpers)
- `lib/permissions/`: Section access control helpers
- `app/`: module-local pages and API routes
- `tools/`: deterministic Python harness for Drive verification
- `docs/`: env checklist + integration notes
