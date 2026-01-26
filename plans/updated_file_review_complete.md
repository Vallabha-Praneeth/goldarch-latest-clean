# Updated Project Review: Feature Gap Analysis & Implementation Roadmap

## Part 0: Inputs Used

- **Primary Plan**: `File_Review_Complete.md`
- **New Input**: `Andy_meeting_3.sh` (audio-to-transcript pipeline using ffmpeg + Whisper + SRT-to-Markdown)

---

## Part 1: Feature Gap Table (Original Plan + Updates)

### 1. Task Management (Priorities & Deals)

- **Client Request**: "...you can add those tasks here… have the priority set… medium, low, high due date, you can link your deals to it" (Meeting 1, 00:00)
- **Visual Evidence**: Screenshot 29 (ClickUp task list view)
- **Current Status**: ✅ Implemented - Tasks feature added with priority and deal-linking as requested
- **Gap Category**: –
- **Priority**: MEDIUM
- **Dependencies**: Uses existing Task & Deal models

### 2. Project Section & Status Tracking

- **Client Request**: "...we created a project… planning, active, hold, completed, cancelled projects… you can create a project here so you can set the status and everything" (Meeting 1, 02:45)
- **Visual Evidence**: Screenshot 23 (Project overview page)
- **Current Status**: ✅ Implemented - Project module exists with status categories (planning → cancelled)
- **Gap Category**: –
- **Priority**: MEDIUM
- **Dependencies**: Uses Project & Deals models

### 3. Quotation Management (Accept/Reject)

- **Client Request**: "...quotations… if someone sends you a quotation it will be present here… you can directly check the status – accept, reject or pending from here" (Meeting 1, 00:33)
- **Visual Evidence**: Verbal only (in-app demo UI)
- **Current Status**: ⚠️ Partial - Quotes stored but approval workflow is manual (no enforcement)
- **Gap Category**: MEDIUM
- **Priority**: MEDIUM
- **Dependencies**: Quotes database exists; needs linkage

### 4. Document Upload & Sharing

- **Client Request**: "...you can also upload some documents… plan… share it with your suppliers… upload… receipts, bills… you can share it right now" (Meeting 1, 00:48)
- **Visual Evidence**: Verbal only (internal app feature)
- **Current Status**: ⚠️ Partial - File upload pipeline exists, but sharing lacks access control
- **Gap Category**: MEDIUM
- **Priority**: MEDIUM
- **Dependencies**: Supabase storage service (Resend)

### 5. Team Management & Role Permissions

- **Client Request**: "...you also requested for this team… you can add teams and give certain access limits… you don't want everyone to see all the data… set the permissions like what they can access and what they can see" (Meeting 1, 01:18)
- **Visual Evidence**: Screenshot 44 (ClickUp permission controls)
- **Current Status**: ❌ Missing - Multi-user/RBAC not implemented (concept only)
- **Gap Category**: HIGH
- **Priority**: HIGH
- **Dependencies**: Supabase Auth; needs Roles & Permission schema

### 6. Login & Auth Enforcement

- **Client Request**: "...to log in this app we set this login feature so only who sign up with you can check [data]" (Meeting 1, 01:56)
- **Visual Evidence**: Verbal only
- **Current Status**: ⚠️ Partial - User login exists (Supabase) but not uniformly enforced
- **Gap Category**: HIGH
- **Priority**: HIGH
- **Dependencies**: Supabase Auth; Needs route guards

### 7. Restricted Supplier Access (Joy's View)

- **Client Request**: "...only kitchen suppliers to Joy… For Joy login, I have to give only kitchen suppliers… not China, only US" (Meeting 2, 03:22)
- **Visual Evidence**: Screenshots 38–40 (Supplier directory & filters)
- **Current Status**: ❌ Missing - No per-user supplier visibility (all users see all suppliers)
- **Gap Category**: HIGH
- **Priority**: HIGH
- **Dependencies**: Supplier database; RBAC system (Feature 5)

### 8. Supplier Search & Filter UI

- **Client Request**: "No, I have to filter now… At least, I have to search. How do I search here in suppliers?" (Meeting 2, ~03:30)
- **Visual Evidence**: Screenshot 39 (Supplier list interface)
- **Current Status**: ❌ Missing - Only simple category list exists; no keyword search or quick filter
- **Gap Category**: HIGH
- **Priority**: HIGH
- **Dependencies**: Supplier DB (exists)

### 9. Document Templates (Letterheads/Formats)

- **Client Request**: "...it's so easy... I had a letterhead done with a quotation..." (Meeting 2, 06:06)
- **Visual Evidence**: Screenshots 5–7 (HoneyBook invoice template)
- **Current Status**: ❌ Missing - No template system for quotes/docs (manual copy-paste)
- **Gap Category**: HIGH
- **Priority**: HIGH
- **Dependencies**: Docxtemplater library; Supabase storage

### 10. Payment Milestones & Tracking

- **Client Request**: "...if a quotation is 10,000, you will get advance for 2,000… first milestone 2,500… 5% retainage at the end… whether he paid or not." (Meeting 2, 18:39)
- **Visual Evidence**: Screenshots 6–7 (HoneyBook payment plan UI)
- **Current Status**: ❌ Missing - No support for phased payments or payment status tracking in app
- **Gap Category**: MEDIUM
- **Priority**: MEDIUM
- **Dependencies**: Project data; needs Payment schema

### 11. Investor/External Portal

- **Client Request**: "Eventually, I want to build an Investment Management group" (Meeting 2, 12:46)
- **Visual Evidence**: Verbal only
- **Current Status**: ❌ Missing - No separate investor-facing module (single-user system now)
- **Gap Category**: LOW
- **Priority**: LOW
- **Dependencies**: Auth system; Project progress tracking

### 12. Multilingual Meeting Transcription & Translation (New Input)

- **Client Request**: Inferred from `Andy_meeting_3.sh` - automated Telugu→English meeting translation workflow for project documentation
- **Visual Evidence**:
  - `Andy_meeting_3.sh` (bash script: audio → 16kHz WAV → Whisper translate → SRT → timestamped Markdown)
  - Implies client conducts meetings in Telugu with team/suppliers; needs English documentation for records
- **Current Status**: ⚠️ Partial - Standalone script exists locally; requires:
  - Server-side execution infrastructure (ffmpeg + Whisper model)
  - Audio upload mechanism in app
  - Integration with Documents/Projects for storage
  - No UI workflow for triggering or viewing results
- **Gap Category**: MEDIUM (upgraded from LOW - multilingual support is critical for regional operations)
- **Priority**: MEDIUM (upgraded - weekly usage for non-English meetings)
- **Dependencies**:
  - Supabase Storage (for audio file uploads, ~50MB limit per file)
  - Server infrastructure for Whisper model (CPU/GPU requirements)
  - Document storage model (for transcript outputs)
  - RBAC (transcripts contain sensitive project/client discussions)

---

## Part 2: Dependency Analysis (Original Plan + New Recommendation)

### Feature: Quotation Management (Accept/Reject Workflow)

#### What Needs to Be Built

- **Quote status logic** – Ensure accepting a quote triggers appropriate status updates (and possibly locks other quotes for that deal)
- **Notification/confirmation** – (Optional) Notify relevant parties when a quote is accepted or rejected
- **Role enforcement** – If team roles exist, restrict quote approval actions to authorized users (e.g. admin or project owner)

#### Dependencies

**Requires (existing components):**
- Quotes data model (exists in current DB)
- Deals/Projects linking (quote is associated with a deal/project)
- Supabase Auth (to identify user role, once roles are added)

**Blocks (future features):**
- Downstream **Procurement workflow** (e.g. converting accepted quote to an order/project)
- **Payment scheduling** (accepted quote defines payment terms sequence)

**Auth/Permission Requirements:**
- Yes – Only certain roles should accept/reject quotes (e.g. manager vs. viewer)

#### Potential Impacts

**Database Changes:**
- Possibly add a `status` field to quotes (if not already) to track "accepted/rejected/pending" (likely exists but ensure consistency)
- Add `accepted_by` and timestamp for audit (who and when)

**API Changes:**
- Modify quotes API endpoint to handle status update (accept/reject action)
- Add server-side checks to prevent unauthorized status changes

**Frontend Changes:**
- Update UI to allow clicking "Accept/Reject" (with confirmation)
- Visual indicator in quotes list for accepted quote (e.g. highlight or badge)
- Possibly remove or disable competitor quotes once one is accepted

**Risks:**
- **Data inconsistency**: If multiple quotes exist, accepting one might require others to be marked lost – ensure business rule is clear
- **Unauthorized actions**: Without proper auth, a team member could accept when they shouldn't – resolved by RBAC in Phase 0
- **Notification gap**: Suppliers won't know they were accepted/rejected unless manually informed (out of scope unless an email integration is added)

#### Complexity Assessment

**Complexity**: LOW

**Justification**: Updating quote status is straightforward CRUD with minor business rules. Uses existing data structures with small tweaks (status field, UI buttons).

**Estimated Effort**: Small (1–3 days)
- Day 1: Implement backend logic for status updates and UI buttons
- Day 2: Add role checks (after RBAC foundation) and test multiple scenarios
- (Optional Day 3: Integrate simple email or confirmation modal if needed)

---

### Feature: Document Upload & Sharing

#### What Needs to Be Built

- **Share link generation** – Ability to create a secure link or PDF export for a document to send externally (e.g. project plan, receipt)
- **Email integration for sharing** – (Optional) In-app function to email the document link or attachment to suppliers
- **Access controls** – Ensure shared documents are only accessible to intended recipients (e.g. via expiring link or requiring basic auth)

#### Dependencies

**Requires (existing components):**
- Supabase Storage (already stores documents)
- Resend email service (for sending share emails, integrated in current system)
- Document metadata (exists – documents are already uploaded and processed)

**Blocks (future features):**
- **External collaboration** – Smooth supplier collaboration on documents (RFPs, plans) depends on easy sharing
- **Audit trail** – If expanding, knowing who accessed shared docs

**Auth/Permission Requirements:**
- *No change for external recipients* (they won't have accounts). Internally, only authorized team members should initiate sharing (requires Phase 0 RBAC to restrict who can share).

#### Potential Impacts

**Database Changes:**
- None for basic implementation (reuse existing documents table)
- (Optional) Add a `shared_link` or `access_token` field to documents for tracking shareable URLs and expiration

**API Changes:**
- New endpoint to generate secure share link (returns a token or URL)
- (Optional) New endpoint to send document via email (trigger Resend email with link)

**Frontend Changes:**
- "Share" button on document entries with modal to copy link or enter an email to send
- Indicator in UI if a document is shared/public vs. private
- Validation messages for successful email sending

**Risks:**
- **Data leak**: A public link could be forwarded. Mitigate by expiring links or requiring a one-time passcode.
- **Unauthorized sharing**: Without RBAC, any logged-in user could share sensitive docs. Addressed by permission system (Phase 0).
- **Email deliverability**: Ensure emails don't go to spam (use Resend's templates and proper sender info)

#### Complexity Assessment

**Complexity**: MEDIUM

**Justification**: While uploading exists, implementing secure sharing introduces security considerations. Generating links and emails is moderate effort but requires careful handling of access permissions.

**Estimated Effort**: Medium (1–2 weeks)
- Week 1: Implement link generation and permission checks; UI for copy-link
- Week 2: Integrate email sending and test external access (link opens correct document, respects expiration)

---

### Feature: Team Management & Role Permissions (RBAC System)

#### What Needs to Be Built

- **Role schema & storage** – Define roles (e.g. Admin, Manager, Viewer) and store role assignments for each user (e.g. in a new `user_roles` table or added field)
- **Permissions logic** – Rules for data access per role (e.g. Admin can see all, others see subset) across all relevant modules (projects, suppliers, documents, etc.)
- **Team member invite UI** – Interface to add users to the system (invite by email or create account) and assign roles
- **Role enforcement** – Backend checks (or Supabase RLS policies) to restrict database queries and API responses based on role

#### Dependencies

**Requires (existing components):**
- Supabase Auth & user accounts (currently in use, but all users treated equally)
- Next.js API routes (to inject auth checks)
- Current data models (Projects, Suppliers, etc.) to be scoped by owner/role

**Blocks (future features):**
- **Supplier filtering by user** (Feature 7) – needs roles to determine who sees what
- **Document visibility** – sharing and internal docs require knowing user roles
- **Template access control** – e.g. only Admin can edit templates
- **Safe scaling** – Any multi-user feature assumes RBAC is in place

**Auth/Permission Requirements:**
- Yes – This feature *is* the permissions layer. It will implement:
  - Admin: full access to all data and settings
  - Standard User (or Team Member): restricted as defined (e.g. only own project or assigned category)
  - (Future could extend more granular roles like "Regional Manager" as needed)

#### Potential Impacts

**Database Changes:**
- New table: `user_roles` (user_id, role) to assign roles
- Possibly new join tables for specific access rules (e.g. `supplier_access` per user)
- Add role references in Supabase RLS policies (update security rules in DB)

**API Changes:**
- All existing data endpoints must enforce role checks:
  - e.g. `/api/suppliers` filters results based on user role (use RLS or explicit filters in code)
  - Protected admin-only endpoints for managing team (invite, list users, assign roles)
- New endpoints: e.g. `/api/team/invite` to invite a user, `/api/team/roles` to change roles

**Frontend Changes:**
- **Team management UI**: New pages or modal for Admin to invite users and set their roles
- Role-based UI: Hide or disable controls that user's role should not access (e.g. non-Admin shouldn't see "Invite team" or global data)
- Visual cues when data is restricted (so users know they see partial data)

**Risks:**
- **Regressions**: Introducing auth checks could break existing functionality if not carefully applied (need thorough testing of all flows with roles)
- **Security holes**: If any route or database query is missed, unauthorized access could occur. Must systematically cover every data access path.
- **Onboarding friction**: If invite flow is misconfigured, legitimate team members might be unable to join. Plan for an admin override or manual invite.

#### Complexity Assessment

**Complexity**: HIGH

**Justification**: This is a foundational overhaul. It spans database (new tables, RLS policies), backend (auth checks on many endpoints), and frontend (UI for roles, hiding/showing content). It must be implemented carefully to avoid breaking existing open-access assumptions. Security testing is critical.

**Estimated Effort**: Large (2+ weeks)
- Week 1: Design role models and implement database changes (tables, RLS for key tables)
- Week 2: Implement API-level permission checks and create basic team management UI
- Week 3: Integrate front-end role awareness (hide unauthorized actions) and test end-to-end with multiple user roles

---

### Feature: Login & Authentication Enforcement

#### What Needs to Be Built

- **Session validation on APIs** – Apply authentication middleware or checks on all Next.js API routes to ensure requests come from logged-in users (no public data access)
- **Page access guards** – Redirect users to login if not authenticated when accessing protected pages (projects, suppliers, etc.)
- **Restricted signup (optional)** – Decide if self-signup should be limited (e.g. only invited users can join). If so, implement invite-only flow or approval step.

#### Dependencies

**Requires (existing components):**
- Supabase Auth service (already integrated for basic login)
- Next.js App Router structure (to add middleware or use `middleware.ts` for auth gating)
- Frontend state management (to track user session and loading states)

**Blocks (future features):**
- **Secure multi-user operations** – All team features assume unauthorized users cannot just access data via unsecured endpoints
- **Client trust** – The client's willingness to onboard others depends on confidence that outsiders can't see everything

**Auth/Permission Requirements:**
- Yes – All sensitive routes should require a valid user session. Ties into RBAC: first enforce login, then enforce roles.

#### Potential Impacts

**Database Changes:**
- None (user accounts are handled by Supabase; no schema change needed for enforcement)

**API Changes:**
- Apply a universal auth check for API endpoints (e.g. a wrapper that verifies `req.headers.supabase-token` or session)
- Adjust any open endpoints (if any exist for public use) to ensure they are intended to be public

**Frontend Changes:**
- Implement global route guarding (Next.js middleware) to redirect unauthenticated users away from internal pages
- Ensure login page and flow are working smoothly (since everyone must pass through it)
- Provide feedback (loading spinners, "session expired" messages) when redirecting to login

**Risks:**
- **Lockout**: Misconfiguring could lock out even valid users or Admin if the auth logic has bugs. Must have a backdoor or careful testing.
- **User experience**: If session expires quietly, users might lose work. Mitigate by warning or auto-refreshing tokens if possible.
- **Open pages**: Be careful to still allow any intentionally public pages (if any exist) to remain accessible.

#### Complexity Assessment

**Complexity**: LOW

**Justification**: The app already has authentication; this task is to systematically enforce it. Next.js and Supabase provide straightforward patterns (middleware, session checks). It's mostly configuration and testing.

**Estimated Effort**: Small (1–3 days)
- Day 1: Implement middleware for API and page protection, test with valid/invalid sessions
- Day 2: Adjust login/signup flow if needed (e.g. redirect after login, handle token expiry)
- Day 3: Edge case testing (expired token, no token, role changes effect on access)

---

### Feature: Supplier Access Filtering (User-Specific Visibility)

#### What Needs to Be Built

- **Access rules model** – Define how to assign supplier subsets to users. For example, create a `supplier_access_rules` table mapping a user to allowed supplier categories or regions.
- **Filtered queries** – Implement logic so that when a non-admin user fetches suppliers, they only retrieve those matching their allowed category/region.
- **Admin control UI** – Interface for Admin to set a user's supplier visibility (e.g. assign Joy to "Kitchen" category and "US" region suppliers)
- **Integration with RBAC** – Use the role/permission system from Feature 5: e.g. Admin can see all suppliers; other roles get filter applied.

#### Dependencies

**Requires (existing components):**
- **Team/Roles system** (Feature 5) – foundational; needed to know if a user should be filtered and to store their filter criteria
- Suppliers database (exists, with category field; may need a region field added)
- Next.js API for suppliers – will be modified to enforce filters

**Blocks (future features):**
- **Outsourcing workflow** – Enabling a limited user like Joy to handle only a subset of procurement safely
- **Supplier performance tracking** – If adding supplier KPIs, those should also respect visibility rules

**Auth/Permission Requirements:**
- Yes – Relies on roles (only certain users have restricted views; Admin overrides filters)
- Supabase Row-Level Security (RLS) can be used: e.g. policy "user can select * from suppliers where supplier.category in user's allowed_categories"

#### Potential Impacts

**Database Changes:**
- Add **region/location** attribute to suppliers if needed (e.g. country code)
- New table: `supplier_access` (user_id, category, region) to list each permission rule (if simple, a user could have one category; if complex, multiple entries)
- Update RLS policies on `suppliers` table to filter by these rules (or enforce via API logic)

**API Changes:**
- Modify `/api/suppliers` to apply filters:
  - If user is Admin: return all suppliers
  - If user has limited access: query by their allowed category/region (join with `supplier_access_rules`)
- Possibly new admin endpoints to manage supplier access assignments (e.g. `/api/admin/supplier-access` for CRUD on rules)

**Frontend Changes:**
- For Admin: extend team management UI to set a user's allowed supplier category/region (e.g. dropdowns or multi-select for categories/regions)
- For Users: supplier list page should only display filtered results (the API will handle it, but also consider disabling category tabs that user shouldn't see)
- Feedback if a user has no suppliers in their scope (empty state message)

**Risks:**
- **Data leakage**: If filter logic is incorrect, a restricted user might still fetch suppliers they shouldn't (must thoroughly test queries and RLS policies).
- **Complex assignments**: One user might need multiple categories or regions – ensure the model supports multiple entries or a logical grouping.
- **Performance**: Filtering by user adds query complexity (joins or policy checks); with large data sets, need proper indexing on category/region for efficiency.

#### Complexity Assessment

**Complexity**: MEDIUM

**Justification**: With the RBAC foundation in place, implementing the filter is a moderate task. Defining the data model and queries requires care but leverages existing structures. Complexity comes from edge cases (multiple filters per user, changes over time) and ensuring no gaps in enforcement.

**Estimated Effort**: Medium (~1 week)
- Day 1–2: Add database fields/tables for access rules; implement backend filtering logic (SQL policies or query filters)
- Day 3: Update frontend supplier list and build admin UI controls for assigning filters
- Day 4–5: Testing with different user roles (Admin vs restricted user) and multiple scenarios (no access, single category, multiple categories)

---

### Feature: Supplier Search & Filter UI

#### What Needs to Be Built

- **Search bar** – A text input on the supplier list page to search suppliers by name (and possibly other attributes like location)
- **Filter controls** – Additional UI controls for filtering, e.g. dropdown to filter by category beyond the existing category tabs (if needed)
- **Backend support (if needed)** – Implement query parameters for search in the suppliers API (e.g. `?q=keyword` to filter by supplier name)

#### Dependencies

**Requires (existing components):**
- Supplier list UI (exists with category tabs)
- Suppliers API endpoint (exists; may need extension for query)
- Frontend state management (React state or React Query to handle search input and results)

**Blocks (future features):**
- None critically, but complements **user-specific filtering** – after implementing Feature 7, search should still respect those visibility rules (and it will, because it reuses the same API)

**Auth/Permission Requirements:**
- No change (uses existing supplier data the user is allowed to see; will work in tandem with Feature 7 so a restricted user only searches within their subset)

#### Potential Impacts

**Database Changes:**
- None (search will query existing fields like supplier name, category, etc.)
- Ensure database has appropriate indexes on searchable fields (e.g. an index on supplier `name` for performance)

**API Changes:**
- Update `/api/suppliers` to accept search query param (if not already). Use SQL `ILIKE` or full-text search to filter by name/keyword.
- Pagination considerations: if large result sets, maybe implement limit/offset (not urgent unless data is big)

**Frontend Changes:**
- Add search input field and possibly a "Search" button or live search on keypress
- Display filtered results dynamically as user types or upon submission
- If combining with category filters: ensure search works together with category selection (e.g. searching within "Kitchen" category if that tab is active)
- UI/UX: show a message if no suppliers match the search

**Risks:**
- **Usability**: Need to handle user input debouncing to avoid too many API calls on each keystroke (or use a search-on-submit approach).
- **No results confusion**: If a restricted user searches for a supplier outside their scope, they simply get no results – should communicate if no match versus no permission (but avoid revealing restricted supplier names)

#### Complexity Assessment

**Complexity**: LOW

**Justification**: This is a straightforward UI + API filter with minimal data changes.

**Estimated Effort**: Small (2–4 days)
- Day 1: Add API query support + index if needed
- Day 2: Add frontend search UI + integrate with existing supplier list
- Day 3–4: Testing with RBAC filters and edge cases (empty results, partial matches)

---

### Feature: Document Templates (Letterheads/Formats)

#### What Needs to Be Built

- **Template model** – Store template metadata (name, type, file link)
- **Template storage** – Upload and store template files (DOCX) in Supabase Storage
- **Template merge** – Use docxtemplater (or similar) to merge data into templates
- **Template UI** – Admin UI for uploading and managing templates
- **Generate Document** – Button to generate from a template and store output as a document

#### Dependencies

**Requires (existing components):**
- Document storage (Supabase Storage)
- Template library (docxtemplater)
- Project/Deal data available to fill placeholders

**Blocks (future features):**
- **Document automation** – Faster generation of quotes, letters, and reports

**Auth/Permission Requirements:**
- Yes – Admin-only template management, general users can generate

#### Potential Impacts

**Database Changes:**
- New table: `document_templates` (id, name, file_url, created_by, created_at)

**API Changes:**
- CRUD for templates
- Endpoint to generate a document (store output and return link)

**Frontend Changes:**
- Template management UI
- Generate document button on Projects/Deals

**Risks:**
- **Template errors** if placeholders are incorrect
- **Complex formatting** may cause generation issues

#### Complexity Assessment

**Complexity**: MEDIUM

**Justification**: New UI + templating integration; manageable scope.

**Estimated Effort**: Medium (1–2 weeks)

---

### Feature: Payment Milestones & Tracking

#### What Needs to Be Built

- **Milestone model** – Store payment stages for a project/deal
- **Schedule UI** – Input and edit milestone names, amounts, due dates
- **Status tracking** – Mark paid/unpaid, show totals

#### Dependencies

**Requires (existing components):**
- Projects/Deals
- Accepted Quotes (for totals)

**Blocks (future features):**
- **Financial reporting** and reminders

**Auth/Permission Requirements:**
- Yes – restrict who can edit payment status

#### Potential Impacts

**Database Changes:**
- New `payment_milestones` table

**API Changes:**
- CRUD for milestones

**Frontend Changes:**
- Milestone UI on project page

**Risks:**
- **Calculation errors** if totals do not match quote

#### Complexity Assessment

**Complexity**: MEDIUM

**Justification**: New data model and UI; limited logic.

**Estimated Effort**: Medium (1–2 weeks)

---

### Feature: Multilingual Meeting Transcription & Translation

#### What Needs to Be Built

- **Audio upload endpoint** — Allow users to upload meeting recordings (mp3/m4a/wav) via app interface
- **Server-side processing** — Execute the existing `Andy_meeting_3.sh` workflow on uploaded files:
  - Audio normalization (ffmpeg: mono, 16kHz)
  - Whisper translation (Telugu → English with timestamps)
  - SRT → Markdown conversion
- **Transcript storage** — Save generated Markdown transcripts in Documents or new Meetings section
- **Processing queue** — Handle asynchronous processing (Whisper can take 1-5 mins for 1-hour audio)
- **Status notifications** — Alert user when transcript is ready
- **Metadata capture** — Associate transcript with project, date, participants

#### Dependencies

**Requires (existing components):**
- Supabase Storage (for audio file uploads; verify 50MB limit accommodates typical meeting lengths)
- Documents table/storage (for storing output Markdown files)
- Server environment with:
  - `ffmpeg` installed
  - Whisper model (medium or large) — ~5GB disk space for large model
  - Python 3 runtime
  - Sufficient RAM/GPU for Whisper inference (CPU: ~2-4 mins per minute of audio; GPU: real-time)

**Blocks (future features):**
- **Automated meeting summaries** — Could extract action items from transcripts using AI
- **Searchable knowledge base** — Full-text search across all meeting transcripts
- **Multi-language support expansion** — Extend to other regional languages (Hindi, Tamil, etc.)

**Auth/Permission Requirements:**
- Yes — Transcripts contain sensitive client/project discussions:
  - Only project team members should view associated transcripts
  - Admin can view all transcripts
  - Requires RBAC (Phase 0) to enforce access control

#### Potential Impacts

**Database Changes:**
- Option A: Extend `documents` table with `type='transcript'` and `processing_status` field
- Option B: New table `meeting_transcripts`:
  ```
  id, project_id, audio_file_url, transcript_file_url,
  meeting_date, participants, processing_status,
  duration_seconds, language_detected, created_by, created_at
  ```
- Add index on `project_id` for fast retrieval

**API Changes:**
- New endpoint: `POST /api/transcripts/upload` (accepts audio file, returns job ID)
- New endpoint: `GET /api/transcripts/status/:jobId` (returns processing status)
- New endpoint: `GET /api/transcripts/:id` (returns transcript content + metadata)
- Modify existing `/api/projects/:id/documents` to include transcripts if using Option A

**Infrastructure Changes (Critical):**
- **Processing Service** — Options:
  1. **n8n workflow** (integrate with existing automation stack):
     - Trigger on file upload
     - Execute bash script via Execute Command node
     - Update status on completion
  2. **Dedicated API endpoint** (Next.js API route):
     - Queue system (e.g., Bull/Redis) for background jobs
     - Worker process runs script
  3. **External service** (e.g., Deepgram API for faster processing):
     - Reduces infrastructure load
     - Costs ~$0.0125/min of audio
     - No Telugu support (fallback to Whisper for non-English)

**Frontend Changes:**
- **Upload UI**:
  - File picker for audio files on Project detail page
  - Drag-and-drop zone
  - File size/format validation (mp3/m4a/wav, max 50MB)
  - Optional: record audio directly in browser (using MediaRecorder API)
- **Processing indicator**:
  - Progress bar or spinner while Whisper runs
  - Estimated time remaining (based on audio duration)
- **Transcript viewer**:
  - Timestamped Markdown display
  - Search within transcript
  - Download original audio + transcript
  - Link to associated project

**Risks:**
- **Processing time**: Whisper medium model on CPU: 2-4x audio duration (1hr meeting = 2-4hr processing). Mitigate with GPU or cloud API.
- **Translation accuracy**: Whisper may struggle with:
  - Heavy accents or background noise
  - Technical terminology (construction/real estate jargon)
  - Mixed languages (code-switching between Telugu/English)
  - Mitigation: Allow manual editing of transcripts post-generation
- **Storage costs**: Audio files (50MB) + transcripts → estimate 60MB per meeting. 100 meetings = 6GB. Monitor Supabase storage limits.
- **Language detection failures**: Script assumes Telugu input. If meeting is in Hindi/Tamil, Whisper may misdetect. Add language selection in upload UI.
- **Privacy/compliance**: Recordings may include client names, financial details. Ensure:
  - RBAC enforcement (only authorized users access transcripts)
  - Optional: retention policy (auto-delete audio after X days, keep transcript)
  - Consent from meeting participants (not enforced by app but client's responsibility)

#### Complexity Assessment

**Complexity**: MEDIUM-HIGH (upgraded from LOW)

**Justification**:
- Script exists (LOW complexity for logic)
- BUT integration requires:
  - Server infrastructure setup (ffmpeg + Whisper + Python)
  - Asynchronous job processing (MEDIUM complexity)
  - File upload handling (existing, but audio files are larger than typical docs)
  - UI for status tracking (MEDIUM complexity)
  - Potential GPU infrastructure or external API integration (HIGH complexity if self-hosted)

**Estimated Effort**: Medium (1-2 weeks)
- **Week 1**:
  - Set up server infrastructure (install dependencies, test script in production environment)
  - Implement audio upload endpoint + storage
  - Build asynchronous processing queue (n8n or custom)
- **Week 2**:
  - Build frontend upload UI + status tracking
  - Implement transcript viewer and project association
  - Testing with various audio qualities and languages
  - Performance optimization (parallel processing if multiple files)

**Alternative (Faster MVP)**:
- **Manual workflow (3-5 days)**:
  - Admin uploads audio to server manually
  - Runs script via SSH
  - Uploads resulting Markdown to app as regular document
  - Defer full automation to later phase

---

## Part 3: Incremental Implementation Roadmap (Original Plan + Upgrade)

### Phase 0: Foundation – Authentication & RBAC

**Goal**: Establish a secure authentication and role-based access control foundation so only authorized users access data, and roles can be used in later features.

**Duration**: ~3 weeks

**Deliverables**:
- [ ] **Enforce Auth on All Endpoints** – Complexity: LOW
- [ ] **Design & Implement Role Schema (RBAC)** – Complexity: HIGH
- [ ] **Apply Supabase RLS Policies** to key tables – Complexity: HIGH
- [ ] **Team Management UI (Invite & Assign Roles)** – Complexity: MEDIUM

**Upgrade Note**: Phase 0 remains the core prerequisite. The new transcript feature also requires RBAC because transcripts can be sensitive.

---

### Phase 1: Supplier Management & Procurement Enhancements

**Goal**: Enable the client's team to safely collaborate on procurement – team members like Joy get a limited view of suppliers, and the system supports basic procurement workflows (finding suppliers and handling quotes).

**Duration**: ~2 weeks

**Dependencies**: Phase 0 completed

**Deliverables**:
- [ ] **User-Specific Supplier Filtering** – Complexity: MEDIUM – Priority: HIGH
- [ ] **Supplier Search Functionality** – Complexity: LOW – Priority: HIGH
- [ ] **Quotation Approval Workflow** – Complexity: LOW – Priority: MEDIUM
- [ ] **Document Sharing Capability** – Complexity: MEDIUM – Priority: MEDIUM

---

### Phase 2: Document Template System

**Goal**: Provide the ability to create and use document templates for quotations, letters, and other repetitive documents.

**Duration**: ~1.5 weeks

**Dependencies**: Phase 0

**Deliverables**:
- [ ] **Template Management UI** – Complexity: MEDIUM – Priority: HIGH
- [ ] **Document Generation from Template** – Complexity: MEDIUM – Priority: HIGH
- [ ] **Template Data Integration** – Complexity: MEDIUM – Priority: HIGH

---

### Phase 3: Payment Milestones & Financial Tracking

**Goal**: Introduce functionality to schedule and monitor payment milestones for projects.

**Duration**: ~1 week

**Dependencies**: Phase 0

**Deliverables**:
- [ ] **Payment Schedule Input** – Complexity: MEDIUM – Priority: MEDIUM
- [ ] **Payment Status Tracking** – Complexity: LOW – Priority: MEDIUM
- [ ] **Integration with Project Dashboard** – Complexity: LOW – Priority: MEDIUM

---

### Phase 4: Multilingual Meeting Transcription System

**Goal**: Enable team to upload meeting audio (Telugu or English), auto-translate to English, and store timestamped transcripts for project documentation and knowledge retention.

**Duration**: ~1.5-2 weeks (or 3-5 days for manual MVP)

**Dependencies**:
- Phase 0 completed (RBAC for transcript access control)
- Document storage infrastructure (can run in parallel with other phases)

**Strategic Value**:
- **Regional operations**: Most meetings with local suppliers/contractors are in Telugu
- **Knowledge capture**: Converts verbal discussions into searchable, shareable documentation
- **Team alignment**: English transcripts accessible to all team members regardless of language fluency
- **Audit trail**: Timestamped records of client requirements, supplier commitments, design decisions

**Deliverables**:
- [ ] **Audio Upload Infrastructure** — Complexity: MEDIUM — Priority: MEDIUM
  - *File upload endpoint accepting mp3/m4a/wav (max 50MB)*
  - *Storage in Supabase with project association*
- [ ] **Server Processing Pipeline** — Complexity: MEDIUM-HIGH — Priority: HIGH
  - *Deploy `Andy_meeting_3.sh` dependencies (ffmpeg, Whisper, Python)*
  - *Async job queue for processing (n8n workflow or custom service)*
  - *Status tracking (pending → processing → completed → failed)*
- [ ] **Transcript Viewer UI** — Complexity: LOW — Priority: MEDIUM
  - *Timestamped Markdown display with search*
  - *Download transcript + original audio*
  - *Associate with project and tag participants*
- [ ] **Access Control Integration** — Complexity: LOW — Priority: HIGH
  - *Enforce RBAC: only project team + Admin can view transcripts*
  - *Option to mark transcripts as confidential (Admin-only)*

**User Value**:
After this phase, the client can record/upload meeting audio directly in the app. The system automatically translates Telugu discussions to English, produces timestamped transcripts, and stores them with the relevant project. This eliminates manual note-taking, ensures accurate records, and makes past discussions searchable. Critical for:
- Supplier negotiations (Telugu with local vendors)
- Client meetings (mixed Telugu/English)
- Team standups (documenting decisions)
- Compliance (proof of discussed terms/agreements)

**Validation Criteria**:
- Upload a 30-min Telugu audio file; verify transcript is generated within acceptable time (< 2 hours on CPU, < 30 min on GPU)
- Check translation accuracy: spot-check 10 random timestamps against original audio
- Restricted user (non-project team): confirm cannot access transcript via UI or direct API call
- Admin uploads transcript for Project A; Project B team member should not see it in their project list
- Test failure scenarios: corrupted audio, unsupported format, timeout → user gets clear error message
- Transcript search: verify full-text search works across multiple transcripts

---

**Alternative: Manual MVP (Optional Sub-Phase)**

If infrastructure setup is complex, start with manual workflow:

**Duration**: 3-5 days

**Deliverables**:
- [ ] Document type "Transcript" added to Documents table
- [ ] Admin runs `Andy_meeting_3.sh` locally, uploads output Markdown manually
- [ ] UI shows transcripts with timestamp metadata (meeting date, project)

**Defer to Later**:
- Automated processing pipeline
- Audio file storage
- In-app upload UI

---

### Phase N: Future Enhancements

**Goal**: Collect low-priority or longer-term ideas that came up but are not required for the initial rollout.

**Planned Future Items**:
- **Investor Portal & Reporting**
- **Multi-Business Domain Segmentation**
- **Internal Supplier Ratings & Notes**
- **Automated Payment Reminders**
- **Lead Management Module**

---

## Part 4: Clarification Questions for Client

### Items Requiring Client Clarification

#### 1. Supplier Access Criteria

- **Question**: Should limited access be filtered by category, region, or both?

#### 2. Team Onboarding Process

- **Question**: Invite-only vs open signup with role assignment?

#### 3. Document Sharing Method

- **Question**: Email from app vs shareable link only?

#### 4. Project Categorization (Real Estate vs. Construction)

- **Question**: Should projects be explicitly categorized now or only named/flagged?

#### 5. Meeting Transcript Workflow & Infrastructure (New - Critical)

**What we found**: The `Andy_meeting_3.sh` script shows you're already transcribing/translating Telugu meetings to English. It's unclear how this should integrate with the app.

**Questions for client**:

a) **Processing approach**:
   - Do you want to upload audio files directly in the app and have it auto-process, or continue running the script manually and just upload the resulting transcripts?
   - (Auto-processing requires server infrastructure with GPU or external API costs ~$0.01/min)

b) **Audio storage**:
   - Should the app keep the original audio files, or just the transcripts?
   - (Storage consideration: 50MB per 1-hour meeting × ~X meetings/month)

c) **Language detection**:
   - Are all meetings in Telugu, or should the system detect/support multiple languages (Hindi, Tamil, English)?
   - Does the script's current Telugu→English translation meet your needs?

d) **Meeting metadata**:
   - What information should be captured: project association, date, participants, meeting type (client/supplier/internal)?
   - Do you need to search across transcripts (e.g., "find all mentions of 'kitchen cabinets' in supplier meetings")?

e) **Access control**:
   - Should transcripts inherit the same permissions as project documents (team members see their project's transcripts)?
   - Or do some transcripts need extra confidentiality (e.g., financial discussions only Admin can view)?

f) **Urgency**:
   - How often do you need transcripts? (Daily? Weekly? Ad-hoc?)
   - **Answer**: Weekly
   - This affects whether we build full automation (Phase 4 priority) or start with manual workflow (faster MVP)

**Impact if not clarified**:
- Infrastructure investment (GPU server vs. manual workflow) could be over- or under-built
- Storage costs unclear
- Feature priority may be wrong (if transcripts are mission-critical daily, should be Phase 1 not Phase 4)

---

## Summary of Gaps and Upgrades

- **Gaps still open**: RBAC, auth enforcement, supplier filtering + search, quote approval workflow, document sharing, templates, payment milestones.
- **New recommendation**: Formalize meeting transcript storage and retrieval using the existing transcription script. Weekly usage justifies MEDIUM priority and proper infrastructure planning.
- **Plan upgrade**: Add Phase 4 focused on multilingual transcript capture once Phase 0 security is in place.
