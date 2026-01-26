# Integration Notes

This module is intentionally isolated. To integrate later:

1) Apply SQL from `migrations/20260201_client_drive_portal.sql`.
2) Move module API handlers into `app/api` and update imports to shared libs.
3) Merge module layout or section access checks into `app/app-dashboard/layout.tsx`.
4) Add a new nav entry for Client Portal pointing to the desired production route.
5) Replace module-local UI components with existing shared components (or keep cloned ones if desired).
6) Run through the test checklist in `tools/drive_smoke_test.py`.

No production files were modified in this sandbox.

Sandbox-only pages:
- `/module-admin-drive-mapping` for testing folder mappings (admin/manager only).
- `/module-admin-section-access` for editing section access (admin/manager only).

Admin section access page:
- Use the "Load Access" button to prefill permissions for a user via `?user_id=...`.
