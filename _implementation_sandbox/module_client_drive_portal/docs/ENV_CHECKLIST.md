# Env Checklist (Module)

Required for the sandbox module to operate:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional:
- `GOOGLE_DRIVE_ROOT_FOLDER_ID` (fallback root folder for admin tooling)

ADC note (for `tools/drive_smoke_test_adc.py`):
- Ensure ADC has Drive scopes: `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/drive.readonly`
- You may also set a quota project: `gcloud auth application-default set-quota-project <project-id>`
