# Module Map — Implementation Decomposition

**Source**: File_Review_Complete.md
**Generated**: 2026-01-09
**Repository Type**: Next.js 16 (App Router) + Supabase + React Query + shadcn/ui

---

## Repository Structure Analysis (Read-Only Scan)

### Existing Patterns Identified
- **Routing**: Next.js App Router (`app/` directory)
- **Authentication**: Supabase Auth with custom `AuthProvider` context
- **Data Fetching**: React Query with Supabase client
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Layout**: Fixed sidebar (w-64), responsive mobile menu, Gold.Arch branding
- **Navigation**: 8 main routes (Dashboard, Suppliers, Projects, Deals, Quotes, Documents, Tasks, Activities)
- **Forms**: Dialog-based with validation, toast notifications
- **Styling**: Tailwind CSS with custom color tokens (gold, gold-light)

### Critical Constraints Observed
- 🔒 **Navigation structure is FIXED** (8 menu items, cannot modify)
- 🔒 **Layout pattern is FIXED** (sidebar + main content, mobile responsive)
- 🔒 **Component library is FIXED** (shadcn/ui components only)
- 🔒 **Data layer is FIXED** (Supabase client, React Query)
- 🔒 **Auth flow is FIXED** (AuthProvider pattern, useAuth hook)

---

## Module Decomposition Strategy

Implementation is broken into **8 independent modules** across 4 phases.

Each module:
- Can be built independently
- Has clear inputs/outputs
- Can be paused/resumed by different AI models
- Does NOT modify existing files (only clones and extends)

---

## Phase 0: Foundation (3 weeks) — 3 Modules

### MODULE-0A: Auth Enforcement Layer
**Purpose**: Systematically enforce authentication on all routes and APIs
**Type**: Security Infrastructure
**Priority**: CRITICAL (blocks all other modules)

**What it does**:
- Creates middleware for API route protection
- Implements page-level auth guards
- Adds session validation utilities
- Does NOT break existing auth flow

**Dependencies**:
- Existing: `lib/auth-provider.tsx`, `lib/supabase-client.ts`
- Existing: All API routes in `app/api/*`
- Existing: All pages in `app/app-dashboard/*`

**Outputs**:
- `_implementation_sandbox/MODULES/MODULE-0A/`
  - `middleware/api-auth.ts` (API protection wrapper)
  - `middleware/page-auth.ts` (Page guard wrapper)
  - `utils/session-validator.ts` (Session utilities)
  - `README.md` (integration instructions)

**Implementation Order**: 1st (must complete before 0B)

**Resumable**: Yes — each middleware file can be built independently

**Status**: ⚠️ SKELETON ONLY — will not contain full logic, only structure

---

### MODULE-0B: RBAC Schema & Database
**Purpose**: Design and implement role-based access control database schema
**Type**: Data Model
**Priority**: CRITICAL (blocks Phase 1)

**What it does**:
- Defines user roles (Admin, Manager, Viewer, etc.)
- Creates permission rules schema
- Implements Supabase RLS policies
- Provides migration scripts

**Dependencies**:
- Existing: Supabase database schema
- Existing: `lib/supabase-types.ts`
- MODULE-0A: Auth enforcement (conceptual dependency)

**Outputs**:
- `_implementation_sandbox/MODULES/MODULE-0B/`
  - `schema/user_roles.sql` (roles table)
  - `schema/permissions.sql` (permissions table)
  - `schema/supplier_access_rules.sql` (supplier filtering)
  - `policies/rls_policies.sql` (Row-Level Security)
  - `types/rbac.types.ts` (TypeScript interfaces)
  - `README.md` (migration guide)

**Implementation Order**: 2nd (after 0A, before 0C)

**Resumable**: Yes — each schema file can be built independently

**Status**: ⚠️ SKELETON ONLY — SQL scripts will be template/example only

---

### MODULE-0C: Team Management UI
**Purpose**: Admin interface for inviting users and assigning roles
**Type**: UI Module
**Priority**: HIGH

**What it does**:
- Creates `/app-dashboard/team` page
- Implements invite user dialog
- Shows user list with role assignments
- Follows existing UI patterns EXACTLY

**Dependencies**:
- Existing: `app/app-dashboard/layout.tsx` (navigation)
- Existing: `components/ui/*` (Dialog, Button, Table, etc.)
- MODULE-0B: RBAC schema (for role types)

**Outputs**:
- `_implementation_sandbox/MODULES/MODULE-0C/`
  - `pages/team-page.tsx` (main page component)
  - `components/invite-user-dialog.tsx` (invite form)
  - `components/user-list-table.tsx` (user table)
  - `api/team-routes.ts` (API route stubs)
  - `README.md` (integration instructions)

**Implementation Order**: 3rd (after 0B)

**Resumable**: Yes — each component file can be built separately

**Status**: ⚠️ SKELETON ONLY — UI only, no backend integration

**UI/UX Match**: Must match existing Suppliers page layout pattern

---

## Phase 1: Supplier Management (2 weeks) — 3 Modules

### MODULE-1A: Supplier Access Filtering
**Purpose**: Implement per-user supplier visibility based on category/region
**Type**: Data Access Control
**Priority**: HIGH

**What it does**:
- Filters supplier queries by user permissions
- Implements access rule assignment
- Updates API to respect filtering
- Does NOT modify existing supplier schema

**Dependencies**:
- Existing: `app/app-dashboard/suppliers/page.tsx`
- Existing: `app/api/suppliers/*` (if exists)
- MODULE-0B: RBAC schema (supplier_access_rules table)

**Outputs**:
- `_implementation_sandbox/MODULES/MODULE-1A/`
  - `utils/supplier-filter.ts` (filtering logic)
  - `components/supplier-access-dialog.tsx` (admin assigns access)
  - `api/supplier-access-routes.ts` (CRUD for access rules)
  - `README.md` (integration instructions)

**Implementation Order**: 4th (Phase 1 start)

**Resumable**: Yes — utils, components, API can be built separately

**Status**: ⚠️ SKELETON ONLY — filtering logic will be stub

---

### MODULE-1B: Enhanced Search & Filters
**Purpose**: Add keyword search and advanced filtering to supplier list
**Type**: UI Enhancement
**Priority**: HIGH

**What it does**:
- Adds search bar (already exists in base, enhances it)
- Adds filter dropdowns (category, region, rating)
- Implements client-side filtering
- Matches existing UI patterns

**Dependencies**:
- Existing: `app/app-dashboard/suppliers/page.tsx` (has basic search)
- Existing: `components/ui/*` (Input, Select, etc.)
- MODULE-1A: Supplier filtering (respects access rules)

**Outputs**:
- `_implementation_sandbox/MODULES/MODULE-1B/`
  - `components/supplier-search-bar.tsx` (enhanced search)
  - `components/supplier-filters.tsx` (filter UI)
  - `utils/search-filter-logic.ts` (filtering utilities)
  - `README.md` (integration instructions)

**Implementation Order**: 5th (after 1A or in parallel)

**Resumable**: Yes — each component independently

**Status**: ⚠️ SKELETON ONLY — UI components only, no logic

**UI/UX Match**: Must match existing search pattern (Search icon left, Input styling)

---

### MODULE-1C: Quote Approval Workflow
**Purpose**: Add Accept/Reject actions to quote management
**Type**: Workflow Enhancement
**Priority**: MEDIUM

**What it does**:
- Adds status field to quotes (if missing)
- Implements approval buttons (Accept/Reject)
- Updates quote list to show status
- Follows existing dialog patterns

**Dependencies**:
- Existing: `app/app-dashboard/quotes/page.tsx`
- Existing: Quote database schema
- MODULE-0B: RBAC (permission to approve)

**Outputs**:
- `_implementation_sandbox/MODULES/MODULE-1C/`
  - `components/quote-approval-dialog.tsx` (approval UI)
  - `components/quote-status-badge.tsx` (status indicator)
  - `api/quote-approval-routes.ts` (status update API)
  - `README.md` (integration instructions)

**Implementation Order**: 6th (after 1A, 1B or in parallel)

**Resumable**: Yes — each component independently

**Status**: ⚠️ SKELETON ONLY — UI only, no backend

**UI/UX Match**: Must match existing Quotes page pattern

---

## Phase 2: Document Templates (1.5 weeks) — 1 Module

### MODULE-2A: Template System
**Purpose**: Create template management and document generation
**Type**: Feature Module
**Priority**: HIGH

**What it does**:
- Admin can upload/create templates
- Users can generate documents from templates
- Templates integrate with projects/deals data
- Uses existing docxtemplater library

**Dependencies**:
- Existing: Document upload system
- Existing: Supabase storage
- Existing: `docxtemplater` library (in package.json)
- MODULE-0B: RBAC (template management permission)

**Outputs**:
- `_implementation_sandbox/MODULES/MODULE-2A/`
  - `pages/templates-page.tsx` (template library)
  - `components/template-upload-dialog.tsx` (create template)
  - `components/generate-document-dialog.tsx` (use template)
  - `utils/template-engine.ts` (merge logic)
  - `api/template-routes.ts` (CRUD + generation)
  - `README.md` (integration instructions)

**Implementation Order**: 7th (Phase 2)

**Resumable**: Yes — each component and API separately

**Status**: ⚠️ SKELETON ONLY — UI + stub generation logic

**UI/UX Match**: Must follow existing Documents page pattern

---

## Phase 3: Payment Milestones (1 week) — 1 Module

### MODULE-3A: Payment Tracking
**Purpose**: Track payment milestones and schedules
**Type**: Feature Module
**Priority**: MEDIUM

**What it does**:
- Defines payment schedule for projects
- Tracks payment status (Paid/Pending)
- Shows payment progress in project view
- Does NOT handle actual payment processing

**Dependencies**:
- Existing: `app/app-dashboard/projects/page.tsx`
- Existing: Project database schema
- MODULE-0B: RBAC (payment update permission)

**Outputs**:
- `_implementation_sandbox/MODULES/MODULE-3A/`
  - `components/payment-schedule-form.tsx` (define milestones)
  - `components/payment-status-tracker.tsx` (show progress)
  - `components/payment-milestone-card.tsx` (milestone UI)
  - `api/payment-routes.ts` (CRUD for milestones)
  - `schema/payments.sql` (milestone table)
  - `README.md` (integration instructions)

**Implementation Order**: 8th (Phase 3)

**Resumable**: Yes — each component independently

**Status**: ⚠️ SKELETON ONLY — UI + schema only, no logic

**UI/UX Match**: Must integrate into existing Project detail page pattern

---

## Module Dependency Graph

```
MODULE-0A (Auth Enforcement)
    ↓
MODULE-0B (RBAC Schema) ← CRITICAL BLOCKER
    ↓
    ├─→ MODULE-0C (Team Management UI)
    ├─→ MODULE-1A (Supplier Filtering) → MODULE-1B (Enhanced Search)
    ├─→ MODULE-1C (Quote Approval)
    ├─→ MODULE-2A (Template System)
    └─→ MODULE-3A (Payment Tracking)
```

**Critical Path**: 0A → 0B → [all others]

**Parallelizable After 0B**: Modules 0C, 1A, 1B, 1C, 2A, 3A can be built in parallel

---

## Safe Implementation Sequence

### Week 1-2: Phase 0 Foundation
1. MODULE-0A (Auth Enforcement) — 3 days
2. MODULE-0B (RBAC Schema) — 5 days
3. MODULE-0C (Team Management UI) — 4 days

### Week 3-4: Phase 1 Supplier Management
4. MODULE-1A (Supplier Filtering) — 5 days (can start after 0B)
5. MODULE-1B (Enhanced Search) — 2 days (can parallel with 1A)
6. MODULE-1C (Quote Approval) — 3 days (can parallel)

### Week 5-6: Phase 2 Templates
7. MODULE-2A (Template System) — 7 days

### Week 7: Phase 3 Payments
8. MODULE-3A (Payment Tracking) — 5 days

**Total**: ~7 weeks (matches File_Review_Complete.md estimate)

---

## Handoff Points

Each module can be **paused and resumed** at these points:

- **After MODULE-0A**: Auth enforcement structure ready, can continue with RBAC
- **After MODULE-0B**: Database schema ready, can build any UI module
- **After MODULE-0C**: Team management ready, can integrate other modules
- **After MODULE-1A**: Supplier filtering ready, can add search/approval
- **After MODULE-2A**: Templates ready, can integrate into workflows
- **After MODULE-3A**: Full system skeleton complete

---

## Module Status Legend

- ⚠️ **SKELETON ONLY**: Structure/interfaces only, no full business logic
- ✅ **COMPLETE**: Fully implemented and tested
- 🚧 **IN PROGRESS**: Partially built
- ⏸️ **PAUSED**: Ready to resume
- 📦 **CLONED**: Files cloned from existing repo, not yet modified

---

## Next Steps

1. **PHASE 2**: Create clone manifests for each module
2. **PHASE 3**: Clone necessary files into `CLONED/`
3. **PHASE 4**: Implement module skeletons in `MODULES/`
4. **PHASE 5**: Create verification and handoff docs

---

**End of Module Map**
