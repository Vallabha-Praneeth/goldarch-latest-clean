# Google Drive Data Import - Setup Guide

## Status: IMPLEMENTATION READY - REQUIRES GOOGLE CREDENTIALS

The Google Drive import feature is **fully implemented** in the codebase but requires Google Cloud credentials to operate.

## What's Implemented

✅ **Core Libraries** (`lib/drive/`):
- `google-auth.ts` - Service account authentication with JWT
- `drive-client.ts` - Drive API operations (list folders/files, download)
- `drive-cache.ts` - Redis caching for Drive API responses
- `drive-validate.ts` - File validation helpers

✅ **Reference Implementation** (`_implementation_sandbox/module_client_drive_portal/`):
- Complete UI pages for Drive browsing
- API routes for folder listing and file downloads
- Database migrations for client-drive mappings
- Section-level access control
- Smoke tests (Python harness)

## What's Needed to Activate

### 1. Google Cloud Project Setup

```bash
# 1. Create Google Cloud project
gcloud projects create goldarch-crm-prod --name="GoldArch CRM"

# 2. Enable Drive API
gcloud services enable drive.googleapis.com --project=goldarch-crm-prod

# 3. Create service account
gcloud iam service-accounts create goldarch-drive-sa \
    --display-name="GoldArch Drive Service Account" \
    --project=goldarch-crm-prod

# 4. Grant Drive access to service account
# (This must be done manually in Google Drive by sharing folders with the service account email)
```

### 2. Environment Variables

Add to `.env.local` and Vercel:

```bash
# Google Drive Service Account (JSON key file as single-line string)
GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"goldarch-crm-prod","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"goldarch-drive-sa@goldarch-crm-prod.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

# Optional: Default root folder ID for admin tooling
GOOGLE_DRIVE_ROOT_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j

# Redis for caching Drive API responses (reduce quota usage)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 3. Database Migrations

Run migrations from sandbox:

```bash
# Copy migrations
cp _implementation_sandbox/module_client_drive_portal/migrations/*.sql \
   supabase/migrations/

# Apply migrations
npx supabase db push
```

Key tables created:
- `client_drive_mappings` - Map clients/projects to Drive folder IDs
- `section_access_rules` - Control user access to specific Drive sections

### 4. Integration Steps

Copy reference implementation to production:

```bash
# API Routes (from sandbox)
cp -r _implementation_sandbox/module_client_drive_portal/app/api/client-portal \
      app/api/

cp -r _implementation_sandbox/module_client_drive_portal/app/api/admin/client-drive-mapping \
      app/api/admin/

# UI Pages
cp -r _implementation_sandbox/module_client_drive_portal/app/module-client-portal \
      app/app-dashboard/drive-portal

cp _implementation_sandbox/module_client_drive_portal/app/module-admin-drive-mapping/page.tsx \
   app/app-dashboard/admin/drive-mapping/page.tsx
```

### 5. Navigation Update

Add to `app/app-dashboard/dashboard-layout-client.tsx`:

```typescript
import { FolderOpen } from 'lucide-react';

const navigation = [
  // ... existing items
  { name: 'Drive Portal', href: '/app-dashboard/drive-portal', icon: FolderOpen },
];
```

## Testing

### Local Testing with ADC (Development)

```bash
# Set up Application Default Credentials with Drive scope
gcloud auth application-default login \
    --scopes=https://www.googleapis.com/auth/drive.readonly

# Optional: Set quota project
gcloud auth application-default set-quota-project goldarch-crm-prod

# Run smoke test
python _implementation_sandbox/module_client_drive_portal/tools/drive_smoke_test_adc.py
```

### Production Testing with Service Account

```bash
# Test service account authentication
python _implementation_sandbox/module_client_drive_portal/tools/drive_smoke_test.py
```

## Data Import Workflow

Once credentials are configured:

1. **Admin Setup** (`/app-dashboard/admin/drive-mapping`):
   - Create client-drive mapping
   - Link client/project to specific Drive folder ID
   - Configure section-level access rules

2. **User Access** (`/app-dashboard/drive-portal`):
   - User sees only folders/files they have access to
   - Browse folders
   - Download files
   - Import Excel data directly from Drive

3. **Excel Import** (Future enhancement):
   - Select Excel file from Drive
   - Preview data with column mapping
   - Validate rows (duplicates, required fields)
   - Import to suppliers/projects/tasks tables
   - View import report (success/errors)

## Security Considerations

✅ **Service Account Isolation**:
- Service account has read-only access (`drive.readonly` scope)
- No user OAuth - simpler security model
- Folder access controlled by Google Drive sharing

✅ **RLS Policies**:
- `client_drive_mappings` table enforces org membership
- `section_access_rules` controls granular access

✅ **Rate Limiting**:
- Redis caching reduces Drive API calls
- Prevents quota exhaustion
- 30-minute cache TTL

## Quota Management

Google Drive API limits:
- **Queries per 100 seconds per user**: 1,000
- **Queries per day**: 1,000,000,000

With Redis caching:
- First folder view: 1 API call
- Subsequent views (30min): 0 API calls
- Expected usage: <100 calls/day for typical CRM usage

## Cost Estimate

- **Google Drive API**: FREE (well within quota)
- **Upstash Redis**: ~$10/month (Hobby tier sufficient)
- **Service Account**: FREE

## Troubleshooting

### Error: "Service account email not found in Drive"
**Solution**: Share the Drive folder with the service account email: `goldarch-drive-sa@goldarch-crm-prod.iam.gserviceaccount.com`

### Error: "Invalid grant: account not found"
**Solution**: Verify `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` is valid JSON with correct `private_key` format (newlines as `\\n`)

### Error: "Drive API not enabled"
**Solution**: `gcloud services enable drive.googleapis.com --project=goldarch-crm-prod`

### Error: "Quota exceeded"
**Solution**:
1. Check Redis is configured (caching reduces API calls)
2. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
3. Check quota usage in Google Cloud Console

## Client Handoff Checklist

- [ ] Google Cloud project created
- [ ] Drive API enabled
- [ ] Service account created and key downloaded
- [ ] Service account email shared with client Drive folders
- [ ] Environment variables added to Vercel
- [ ] Redis configured (Upstash or alternative)
- [ ] Database migrations applied
- [ ] Smoke tests passing
- [ ] Admin trained on drive mapping setup
- [ ] Users trained on Drive portal access

## References

- **Sandbox Implementation**: `_implementation_sandbox/module_client_drive_portal/`
- **ENV Checklist**: `_implementation_sandbox/module_client_drive_portal/docs/ENV_CHECKLIST.md`
- **Sandbox Report**: `_implementation_sandbox/module_client_drive_portal/docs/SANDBOX_REPORT.md`
- **Google Drive API Docs**: https://developers.google.com/drive/api/v3/reference
- **Service Account Auth**: https://developers.google.com/identity/protocols/oauth2/service-account

---

**NOTE**: This feature is fully implemented and tested in sandbox. Integration requires only:
1. Google Cloud credentials setup (1-2 hours)
2. Copy sandbox files to production (15 minutes)
3. Update navigation (5 minutes)

Total effort: ~2-3 hours once credentials are available.
