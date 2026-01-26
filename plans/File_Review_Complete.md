# Project Review: Feature Gap Analysis & Implementation Roadmap

## Part 1: Feature Gap Table

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

---

## Part 2: Dependency Analysis

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
- **No results confusion**: If a restricted user searches for a supplier outside their scope, they simply get no results – should communicate if no match versus no permission (though to the user it looks the same).
- **Performance**: If the supplier dataset grows large, searching without proper indexing could be slow – monitor and optimize as needed.

#### Complexity Assessment

**Complexity**: LOW

**Justification**: Implementing a text search is straightforward. It involves minor frontend work and a simple filter on the backend query. Uses existing data and UI patterns (no structural changes).

**Estimated Effort**: Small (1–2 days)
- Day 1: Add search input in UI and extend API to filter results
- Day 2: Fine-tune UX (debounce, loading states) and test search in combination with category and role-based filters

---

### Feature: Document Templates & Automated Documents

#### What Needs to Be Built

- **Template storage** – A way to save document templates (e.g. quotation format, letterhead, common email drafts) in the system. This could be uploading a template file (DOCX with placeholders) or a template builder UI for text.
- **Template insertion/merge** – Logic to generate a new document from a template by injecting project-specific or deal-specific data (e.g. project name, client name, payment terms) into the template fields.
- **Template management UI** – Interface to list available templates (e.g. "Quotation", "Follow-up Email", "Thank You Note"), create or upload new templates, and edit or delete them.
- **Document generation workflow** – Flow for the user to select a template and create a filled document. For example, "Generate Quotation" button on a project or deal that uses the chosen template to produce a ready-to-send document.

#### Dependencies

**Requires (existing components):**
- Document entity and storage (Supabase storage & documents table – currently used for uploaded files)
- Document processing libraries (docx templating, PDF generation – e.g. docxtemplater is available)
- Project/Deal data (to pull dynamic fields for the templates, like project name or quote amounts)

**Blocks (future features):**
- **Efficiency in proposals** – Having templates in place is prerequisite to quickly send standardized proposals or letters (saves time each deal)
- **Potential client self-service** – If later allowing clients or partners to generate docs themselves (less likely, but template system would enable it)

**Auth/Permission Requirements:**
- Yes – Likely only certain roles (Admin) can create or modify templates (to maintain quality and consistency)
- All team members might use templates to generate docs, but only approved templates should be available (controlled by the system, not user-specific)

#### Potential Impacts

**Database Changes:**
- New table: `templates` (template_id, name, type, file_path, fields_meta, created_by, etc.), or reuse `documents` table with a flag to distinguish templates from regular docs
- Possibly a new table `generated_documents` if we want to track documents generated from templates (could reuse existing documents table by inserting the new file there)

**API Changes:**
- New endpoints:
  - `/api/templates` (CRUD for templates – list available templates, add new, update, delete)
  - `/api/generate-doc` (takes template_id and context (e.g. project or deal id) and returns a filled document file or saves it)
- Integrate with existing document upload pipeline for storing generated docs (the generation function would output a file which we then upload to storage and record in DB)

**Frontend Changes:**
- **Templates Library UI**: A page or modal accessible to Admin to manage templates. Upload .docx or create text templates, define placeholders (or at least document what fields will be auto-filled).
- **Generate Document UI**: On relevant pages (Project detail, Deal detail, Quote detail), provide an option "Generate Document" -> choose a template -> confirm -> resulting document is either downloaded or added to Documents list.
- Prepopulate some templates (as mentioned, they already have "follow-up meeting request", "thank you", etc. content ready) so the client sees them available.

**Risks:**
- **Template complexity**: Parsing and replacing placeholders in DOCX/PDF could fail if template formatting is complex. We must constrain template structure (provide guidelines to client on how to prepare templates).
- **Data accuracy**: If templates pull dynamic data (e.g. payment amounts), the system must have that data available and up-to-date. E.g., if payment terms are not stored yet, we might need to collect that during generation.
- **User error**: Allowing custom templates means user could upload something without proper placeholder tags, resulting in incomplete merges. Mitigate by testing templates or providing a template format guide.
- **Large documents**: Generated files should be tested against the 50MB upload limit – unlikely an issue for text docs, but keep an eye if including images (like letterhead logos).

#### Complexity Assessment

**Complexity**: MEDIUM

**Justification**: This feature introduces new UI and uses existing libraries in a new way. The merging of data into templates has some complexity but leverages `docxtemplater` and similar tools already in the stack. Managing templates (CRUD) and ensuring the output is correct requires moderate effort, but it's confined to the documents domain.

**Estimated Effort**: Medium (1–2 weeks)
- Week 1: Implement template model and storage; create API for template CRUD; basic generation function working with placeholders
- Week 2: Build front-end for template management and integrate generation button into workflow (e.g. project -> generate quote); test with real examples (the provided letterhead and sample templates)

---

### Feature: Payment Milestones & Tracking

#### What Needs to Be Built

- **Milestone data model** – A structure to record multiple payment stages for a project or deal. For example, define an "Invoice" or "PaymentSchedule" entity with fields: project_id, milestone_name, amount, due_date, status (pending/paid).
- **Payment schedule UI** – In the project or deal view, allow the user to input the agreed payment breakdown (e.g. Advance 20%, Milestone 1 25%, Milestone 2 50%, Retainage 5%). This could be a simple list of milestones with percentages/amounts.
- **Payment status tracking** – Ability to mark each milestone as paid or unpaid, and possibly date of payment, so the system can indicate overall payment progress (e.g. 2 of 4 milestones paid).
- **Summary and alerts** – (Optional) Aggregate display of amount paid vs total, and maybe highlight overdue payments (if due dates are used).

#### Dependencies

**Requires (existing components):**
- Projects/Deals data (milestones will attach to a specific project or deal)
- Possibly Quotes or Contracts (the total amount often comes from an accepted quotation or contract – the milestones sum to that total)
- Document/Invoice generation (if issuing invoices for each milestone, could tie in with templates feature to generate those)

**Blocks (future features):**
- **Financial reporting** – Accurate cash flow or revenue recognition requires tracking payments per schedule
- **Automated reminders** – In the future, could send reminders for unpaid milestones (e.g. as mentioned, HoneyBook auto-reminds weekly) once payment data is structured
- **Investor reporting** – If investors use the system, they might view payment progress on their projects

**Auth/Permission Requirements:**
- Possibly – Only certain roles can update payment status (e.g. a Finance role or Admin marks payments as received)
- Viewing payment info should be allowed to project owners and relevant team, but maybe hidden from others who aren't involved (tie in with RBAC rules for project access)

#### Potential Impacts

**Database Changes:**
- New table: `payments` or `project_milestones` (id, project_id, name, due_date, amount, status, paid_date, etc.)
- Alternatively, integrate into existing `Deals` or `Projects` schema if one project has one set of milestones (but a separate table is clearer and more flexible)
- Ensure relationship: one project -> many payment milestones

**API Changes:**
- New endpoints:
  - `/api/projects/[id]/milestones` – to add/edit milestones for a project
  - `/api/projects/[id]/payments` – to update payment status (or combined with milestones endpoint)
- Possibly extend project fetching to include associated milestones
- If notifications on due dates are desired later, might integrate with n8n workflows (not immediate)

**Frontend Changes:**
- In project detail page, add a section "Payment Schedule":
  - Form to define milestones (name & amount; could auto-calc percentages or allow entering percentage vs amount)
  - Display list of milestones with status checkboxes or toggles for "Paid" vs "Pending"
  - Inline edit or a simple edit modal for adjustments
- Show overall progress (e.g. "₹7,500 of ₹10,000 paid" if amounts are in INR, or just as example)
- If due dates are used, highlight if overdue (future enhancement maybe)
- Ensure any generated invoice documents align with these milestones (could generate one invoice per milestone if needed via templates)

**Risks:**
- **Calculation errors**: Must ensure the sum of milestone amounts equals the project total (to catch data entry mistakes). Could implement a check or auto-calculate the last retainage portion.
- **Changing terms**: If milestones are edited after some payments are marked, could lead to confusion. Possibly lock structure after first payment made, or require admin to adjust with care.
- **User understanding**: Need to keep UI simple – not all users are familiar with defining payment schedules. Perhaps provide a default 2-stage example (advance/final) and let them add more.
- **Currency considerations**: Ensure amounts are consistent (if multicurrency projects were ever a thing – probably not now).

#### Complexity Assessment

**Complexity**: MEDIUM

**Justification**: This introduces a new data component and UI, but conceptually it's straightforward bookkeeping. No complex algorithms; mainly form inputs and status toggles. The complexity lies in integrating with existing project data and ensuring user-friendliness.

**Estimated Effort**: Medium (1–2 weeks)
- Week 1: Design schema and APIs for milestones; implement backend logic to add/update payments; basic frontend form to capture milestones
- Week 2: Enhance UI display and interactions (mark as paid, progress summary); thorough testing with various payment breakdown scenarios; validate totals and status updates

---

## Part 3: Incremental Implementation Roadmap

### Phase 0: Foundation – Authentication & RBAC

**Goal**: Establish a secure authentication and role-based access control foundation so only authorized users access data, and roles can be used in later features.

**Duration**: ~3 weeks

**Deliverables**:
- [ ] **Enforce Auth on All Endpoints** – Complexity: LOW
- [ ] **Design & Implement Role Schema (RBAC)** – Complexity: HIGH
- [ ] **Apply Supabase RLS Policies** to key tables – Complexity: HIGH
- [ ] **Team Management UI (Invite & Assign Roles)** – Complexity: MEDIUM

**Why This Must Be First**: It underpins ~50% of the requested features. Without RBAC, features like supplier filtering (Feature 7) and document visibility cannot be done safely. The client explicitly doesn't want everyone seeing all data. A strong auth/permissions layer is prerequisite to inviting the team and outsourcing work confidently.

**Risk if Skipped**: Proceeding without this would mean adding users now could expose sensitive data (suppliers, finances) to the wrong people. It would require rework of all features to retrofit security later, and might lead to serious data leaks.

**Validation Criteria**:
- Admin can invite a new user and assign a role (e.g. "Procurement Staff").
- A non-admin test user **cannot** see data not intended for them (e.g. cannot query all suppliers via API, cannot access admin pages).
- All protected pages redirect to login if not authenticated.
- Supabase RLS: verify that direct DB access (if attempted) is restricted by the policies (e.g. a restricted user querying `suppliers` only gets their subset).
- Existing functionality still works for an Admin user (no regressions in basic flows when logged in as Admin).

---

### Phase 1: Supplier Management & Procurement Enhancements

**Goal**: Enable the client's team to safely collaborate on procurement – team members like Joy get a limited view of suppliers, and the system supports basic procurement workflows (finding suppliers and handling quotes).

**Duration**: ~2 weeks

**Dependencies**: Phase 0 completed (auth + RBAC must be in place to assign supplier visibility and protect data).

**Deliverables**:
- [ ] **User-Specific Supplier Filtering** – Complexity: MEDIUM – Priority: HIGH
  - *Implement backend filters (category/region) so e.g. "Joy" only sees Kitchen suppliers in US. Admin UI to set these permissions.*
- [ ] **Supplier Search Functionality** – Complexity: LOW – Priority: HIGH
  - *Add a search bar and filter UI on the Suppliers page for easier navigation of supplier list (respects the user's visibility scope).*
- [ ] **Quotation Approval Workflow** – Complexity: LOW – Priority: MEDIUM
  - *Enhance the Quotes module: allow marking quotes as "Accepted" or "Rejected" formally, with proper status stored and visible. Only authorized roles can perform this action.*
- [ ] **Document Sharing Capability** – Complexity: MEDIUM – Priority: MEDIUM
  - *Allow users to share uploaded documents (plans, receipts) with external parties. Generate secure share links and an option to send via email.*

**User Value**: After this phase, the client can confidently delegate procurement tasks. For example, Joy can log in with her account, see only the suppliers relevant to her category/region (e.g. only US kitchen suppliers), search within that list, and reach out to them. The client can review incoming quotations in the system and mark which one is accepted. They can also easily share necessary documents (like project plans or drawings) with suppliers through the app instead of external email, streamlining communication.

**Validation Criteria**:
- Log in as a restricted user (e.g. role "Procurement-Joy"): verify that supplier list only shows the permitted subset (e.g. Joy does not see suppliers outside "Kitchen" or outside US as configured).
- Perform a search on the supplier list and get relevant matches (the query should not return suppliers outside the allowed scope).
- As a restricted user, attempt to navigate to an unauthorized supplier (by ID in URL or API) – confirm access is denied.
- As Admin, assign a new category filter to a user and see it take effect immediately in that user's view.
- Submit multiple test quotes for a deal; mark one as "Accepted": ensure its status is updated and others remain "Pending" or become "Rejected" based on business rule. A non-admin user should be unable to change this status.
- Generate a document share link for an uploaded file: verify the link allows viewing/downloading the file without login, but is obscure (unguessable). Verify the link expires or can be revoked (if implemented). If emailed via the app, confirm the email is received.

---

### Phase 2: Document Template System

**Goal**: Provide the ability to create and use document templates for quotations, letters, and other repetitive documents, reducing manual effort and ensuring consistency.

**Duration**: ~1.5 weeks

**Dependencies**: Phase 0 (RBAC) for permission controls (only certain users manage templates). Phase 1 features can function independently, but this phase will integrate with quote/project data from Phase 1.

**Deliverables**:
- [ ] **Template Management UI** – Complexity: MEDIUM – Priority: HIGH
  - *Allow Admin to upload or define document templates (e.g. a quotation format on company letterhead, standard email text for follow-ups).*
- [ ] **Document Generation from Template** – Complexity: MEDIUM – Priority: HIGH
  - *Enable users to select a template and generate a populated document (e.g. create a new Quotation PDF with project details filled in). The generated document should be saved or downloadable.*
- [ ] **Template Data Integration** – Complexity: MEDIUM – Priority: HIGH
  - *Connect project/deal data to templates: e.g. auto-fill project name, client name, payment terms in the output. Ensure placeholders in templates are correctly replaced.*

**User Value**: The client can prepare professional documents in seconds. Instead of manually editing a quotation in Word, they will select "Generate Quotation" and get a PDF on their letterhead with all details pre-filled. Similarly, follow-up emails or thank-you notes can be standardized. This ensures consistency (same format every time) and saves effort. The client's comment about having a letterhead format ready is directly addressed by this feature.

**Validation Criteria**:
- Admin adds a new template (e.g. uploads a "Quotation.docx" with placeholder fields for project name, date, amounts). The template appears in the template library.
- User (or Admin) initiates "Generate Document" on a project using the quotation template: the system produces a document (DOCX or PDF) that matches the template design and includes the project's specific information (verify fields like project name, quote amount, etc. are correctly inserted).
- Generate documents for multiple scenarios (different templates like a "Thank You Letter" or "Meeting Follow-up") and verify the content matches the template text except for the inserted dynamic fields.
- Permissions: a non-admin user can use templates to generate documents but cannot create or edit templates. Attempt to access the template management UI as a non-admin and confirm it's hidden or access is denied.
- All generated documents are stored in the Documents section or delivered to the user as download, and they are under proper access control like other documents.

---

### Phase 3: Payment Milestones & Financial Tracking

**Goal**: Introduce functionality to schedule and monitor payment milestones for projects, so the client can track payments (advances, progress payments, retainage) within the system.

**Duration**: ~1 week

**Dependencies**: Phase 0 (for any role-based restrictions on who can update payments). No strict dependency on Phase 1 or 2, though having quotes accepted (Phase 1) and templates (Phase 2) complements this (e.g. accepted quote defines total amount, template can generate invoices for milestones).

**Deliverables**:
- [ ] **Payment Schedule Input** – Complexity: MEDIUM – Priority: MEDIUM
  - *UI to define multiple payment milestones for a project (names, amounts or percentages, due dates). For example, "20% Advance, 50% First Installment, 25% Second Installment, 5% Retainage".*
- [ ] **Payment Status Tracking** – Complexity: LOW – Priority: MEDIUM
  - *Ability to mark each milestone as "Paid" or "Pending" (and record payment date). Display summary of total paid vs total due.*
- [ ] **Integration with Project Dashboard** – Complexity: LOW – Priority: MEDIUM
  - *Update project overview to show payment progress (e.g. a progress bar or list of milestones with statuses). Optionally, highlight if any payment is overdue.*

**User Value**: The client can manage project finances in-app instead of on spreadsheets. In the scenario described, the system will reflect that for a ₹10,000 quote, a ₹2,000 advance is expected, then ₹2,500 at first milestone, etc., and finally 5% retained. The client can mark when each payment comes in and immediately see what's outstanding. This helps in keeping track of who has paid how much without manually maintaining Excel. It brings crucial financial info into the project dashboard.

**Validation Criteria**:
- For a given project with an accepted quote total, define a milestone plan that sums up to that total (the UI should guide the user to ensure amounts add correctly or show a warning if not).
- View the project's payment schedule on its page: verify all milestones display with correct labels and amounts.
- Mark one or more milestones as paid, simulate leaving some as pending: the system should clearly show which are paid (e.g. checkmark or green) and which are not (e.g. red or unchecked), and a summary like "₹X of ₹Y paid" updates accordingly.
- Try edge cases: projects with a single payment vs. many; editing a milestone; deleting a milestone; ensure the totals recalc properly.
- Permissions: only allowed roles (e.g. Admin or maybe a "Finance" role if defined) can mark payments as paid. Attempt the action as a restricted user to confirm the button is disabled or the API rejects it.
- Cross-check with documents: if an invoice template from Phase 2 is available, generate an invoice for a specific milestone to see that the amount matches the schedule (if that integration is within scope).

---

### Phase N: Future Enhancements

**Goal**: Collect low-priority or longer-term ideas that came up but are not required for the initial rollout. These will further improve the system once core features are in place.

**Contains**:
- All **LOW** priority items (explicit "eventually" requests).
- Features shown in visuals or discussed conceptually but not immediately needed by client.
- Items needing further client input or real-world trial before implementation.

**Planned Future Items**:

- **Investor Portal & Reporting** – In the future, provide a separate login for investors to view project progress updates (e.g. monthly progress photos, reports). This will likely involve a read-only dashboard showing key metrics of projects they invested in.

- **Multi-Business Domain Segmentation** – As discussed, the system may evolve to handle multiple business lines (Real Estate, Construction, Investment) as top-level categories. In the current phase, projects might simply have a type label, but later this could mean separate modules or workspaces for each domain.

- **Internal Supplier Ratings & Notes** – The client mentioned eventually rating suppliers. A feature to record internal ratings/reviews and notes for each supplier can be added once the supplier database and usage matures. This would help in qualitatively tracking vendor performance.

- **Automated Payment Reminders** – Leverage the workflow automation (n8n) in the tech stack to send automatic email reminders to suppliers or clients for upcoming or overdue payments (similar to HoneyBook's feature). This can be safely introduced after the payment tracking is in use and if the client desires automation.

- **Lead Management Module** – If the client's business expands, a dedicated lead intake and management feature could be added (beyond using Deals/Projects as a proxy). This might include a form for new leads (like project requests) and a pipeline to convert them into projects (some references to "Lead Management" were made in discussions, but currently not critical).

**Note**: These enhancements should be revisited once Phases 0–3 are complete and the client has used the system. They are not to be tackled until the core features are validated in production, as they can significantly broaden the system's scope. Each will require detailed scoping and client feedback before implementation.

---

## Part 4: Clarification Questions for Client

### Items Requiring Client Clarification

#### 1. Supplier Access Criteria

- **What we found**: The client wants to restrict what suppliers a given team member (like Joy) can see. The conversation mentioned both *category* ("kitchen suppliers") and *region* ("only US, not China") as filters.
- **Question for client**: When setting up limited supplier access for a team member, do you need it based on *supplier category*, *supplier region*, or both? For example, should Joy be limited by product category (e.g. Kitchen) **and** geographic region (e.g. US suppliers only)? Please confirm the exact filtering rules needed.
- **Impact if not clarified**: The development of the permission system needs to accommodate the right parameters. If we assume incorrectly (e.g. only category), it may not meet your needs or might require rework to add region later.

#### 2. Team Onboarding Process

- **What we found**: There's a login system in place and mention of adding team members with permissions. Currently, anyone can sign up (no restrictions), but you indicated only your team should access the app.
- **Question for client**: Do you want to restrict user sign-ups to invite only? In practice, should an Admin explicitly invite team members (and only those invited can create accounts), or will you share a signup link and manually assign roles after they register?
- **Impact if not clarified**: Security and ease-of-use could be affected. An open signup might let unintended people in unless we add additional verification. An invite-only system needs an email flow to on-board users. We want to implement the approach that fits your expectations.

#### 3. Document Sharing Method

- **What we found**: The system will allow uploading documents (plans, receipts) and the client wants to share these with suppliers. It's unclear how this sharing should occur (currently likely done by downloading and emailing manually).
- **Question for client**: When you "share a document" with a supplier, would you prefer the app to send it to them via email automatically (using the supplier's email on file), or is generating a shareable link for you to send via WhatsApp/Email yourself sufficient?
- **Impact if not clarified**: Implementing an email send feature vs. just a link share involves different effort and user experience. Knowing your preference will ensure the solution is convenient for you and your suppliers.

#### 4. Project Categorization (Real Estate vs. Construction)

- **What we found**: You described high-level categories of work (Real Estate, Construction, eventually Investment) and showed an example of a system (Sage) organized by these groups. It sounded like for now you only need "project management basics" and are focusing on Construction and Real Estate.
- **Question for client**: Do you want the app to explicitly categorize or separate projects by **Real Estate** vs. **Construction** at this stage? For instance, should there be a field or filter for project type, or even separate sections in the UI for the two domains? Or is it sufficient for now to manage all projects together and perhaps just label them in the name/description?
- **Impact if not clarified**: If separate handling is needed (different workflows or data for each domain), we'd need to account for that in the project model and UI upfront. If it's just contextual (for future expansion), we will keep the project structure simple for now. Clarifying this ensures we either implement needed classification early or avoid over-complicating things not needed yet.
