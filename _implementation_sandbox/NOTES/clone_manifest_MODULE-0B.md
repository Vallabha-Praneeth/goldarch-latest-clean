# Clone Manifest: MODULE-0B (RBAC Schema & Database)

**Module Purpose**: Design and implement role-based access control database schema
**Implementation Order**: 2nd
**Phase**: 0 (Foundation)

---

## Files to Clone

### 1. Supabase Types
**Source**: `lib/supabase-types.ts`
**Destination**: `_implementation_sandbox/CLONED/lib/supabase-types.ts`
**Reason**: Need to understand existing database schema types to extend with RBAC types
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

### 2. Existing SQL Schema (if available)
**Source**: `supabase/migrations/*` (if exists)
**Destination**: `_implementation_sandbox/CLONED/supabase/migrations/`
**Reason**: Understand existing table structures to avoid conflicts
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)
**Note**: If no migrations folder exists, skip this

---

## Files NOT to Clone

- Application code (not needed for schema design)
- UI components (not needed)
- API routes (not needed for database schema)

---

## What Will Be Created (NEW files)

All new files will be in `_implementation_sandbox/MODULES/MODULE-0B/`:

1. **`schema/user_roles.sql`**
   - CREATE TABLE user_roles (user_id, role, created_at, etc.)
   - Roles: Admin, Manager, Viewer, Procurement
   - Links to auth.users

2. **`schema/permissions.sql`**
   - CREATE TABLE permissions (id, resource, action, role, etc.)
   - Resource-level permissions (e.g., suppliers:read, quotes:approve)

3. **`schema/supplier_access_rules.sql`**
   - CREATE TABLE supplier_access_rules (user_id, category_id, region, etc.)
   - Per-user supplier visibility filters

4. **`policies/rls_policies.sql`**
   - Row-Level Security policies for Supabase
   - Policies for suppliers table (filter by user access rules)
   - Policies for documents table (filter by project ownership)
   - Policies for quotes table (filter by role)

5. **`types/rbac.types.ts`**
   - TypeScript interfaces for new tables
   - Role enum, Permission type, AccessRule type
   - Extends existing Supabase types (compatible)

6. **`migrations/001_rbac_foundation.sql`**
   - Combined migration script
   - Creates all tables + policies
   - Idempotent (can run multiple times safely)

7. **`README.md`**
   - Schema explanation
   - Migration instructions
   - RLS policy details
   - How to extend with new roles/permissions

---

## Integration Strategy

**Cloned files are READ-ONLY references**. New schema will:
- Extend existing database structure (not modify)
- Use foreign keys to existing tables (suppliers, projects, etc.)
- Follow existing naming conventions from supabase-types.ts
- Be compatible with existing queries (backward compatible)

---

## Database Tables to Create

### New Tables:
1. **user_roles**
   - Links users to roles
   - One role per user (initially)

2. **permissions** (optional for now)
   - Can be hardcoded in application initially
   - Table for future flexibility

3. **supplier_access_rules**
   - Per-user supplier visibility
   - Multiple rules per user (category AND region)

4. **project_access_rules** (future)
   - Per-user project visibility
   - Not in Phase 0, but schema should allow extension

### Existing Tables to Reference (NOT modify):
- auth.users (Supabase auth)
- suppliers (existing)
- categories (existing)
- projects (existing)
- deals (existing)
- quotes (existing)
- documents (existing)

---

## Verification After Clone

- [ ] supabase-types.ts cloned successfully
- [ ] Existing schema understood (from types)
- [ ] No conflicts with existing tables
- [ ] Can reference existing type patterns

---

**Status**: Ready for PHASE 3 (cloning)
**Estimated Clone Size**: ~1000 lines (supabase-types.ts is large)
