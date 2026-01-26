# CLONED Directory

This directory contains exact copies of files from the original repository for reference purposes during module implementation.

**Created**: 2026-01-09 (PHASE 3)
**Source**: `/Users/anitavallabha/goldarch_web_copy/`

---

## ⚠️ IMPORTANT RULES

1. **NO MODIFICATIONS**: Files in this directory are READ-ONLY references
2. **REFERENCE ONLY**: Use these to understand existing patterns
3. **DO NOT IMPORT**: Module code should NOT import from CLONED/
4. **TEMPLATE EXCEPTIONS**: Some files marked as templates can be copied to MODULES/ and modified there

---

## Directory Structure

```
CLONED/
├── lib/                          # Core library files
│   ├── auth-provider.tsx         # Auth context (reference only)
│   ├── supabase-client.ts        # Supabase client (reference only)
│   ├── supabase-types.ts         # Database types (reference only)
│   └── utils.ts                  # Utility functions (reference only)
├── components/
│   └── ui/                       # shadcn/ui components (reference only)
│       ├── dialog.tsx
│       ├── button.tsx
│       ├── input.tsx
│       ├── table.tsx
│       ├── select.tsx
│       ├── badge.tsx
│       ├── alert-dialog.tsx
│       ├── tabs.tsx
│       ├── progress.tsx
│       ├── checkbox.tsx
│       ├── card.tsx
│       ├── label.tsx
│       ├── alert.tsx
│       ├── textarea.tsx
│       └── ... (17 total components)
├── app/
│   ├── auth/
│   │   └── page.tsx              # Auth page (reference only)
│   ├── app-dashboard/
│   │   ├── layout.tsx            # Dashboard layout (reference only)
│   │   ├── suppliers/
│   │   │   └── page.tsx          # Suppliers page (TEMPLATE - can copy to MODULES/)
│   │   ├── quotes/
│   │   │   └── page.tsx          # Quotes page (TEMPLATE - can copy to MODULES/)
│   │   ├── projects/
│   │   │   └── page.tsx          # Projects page (TEMPLATE - can copy to MODULES/)
│   │   └── documents/
│   │       └── page.tsx          # Documents page (TEMPLATE - can copy to MODULES/)
│   └── api/
│       └── framework-b/
│           └── health/
│               └── route.ts      # API route example (reference only)
└── README.md                     # This file
```

---

## Files by Purpose

### Core Infrastructure (lib/)
**Purpose**: Understand existing authentication, database, and utility patterns
**Status**: Read-only references
**Used By**: All modules

### UI Components (components/ui/)
**Purpose**: Understand shadcn/ui component API and styling patterns
**Status**: Read-only references
**Used By**: All modules
**Note**: DO NOT modify. Use as imported from actual components/ui/ in modules.

### Page Templates (app/app-dashboard/*)
**Purpose**: UI/UX patterns to replicate in new pages
**Status**: TEMPLATES (can be copied to MODULES/ and modified)
**Used By**: Various modules as documented in manifests

**Template Files** (OK to copy to MODULES/):
- `suppliers/page.tsx` → Used by MODULE-0C, 1A, 1B, 2A
- `quotes/page.tsx` → Used by MODULE-1C, 3A
- `projects/page.tsx` → Used by MODULE-3A
- `documents/page.tsx` → Used by MODULE-2A

**Reference-Only Files**:
- `layout.tsx` → Study navigation pattern only
- `auth/page.tsx` → Study auth flow only

### API Examples (app/api/)
**Purpose**: Understand existing API route patterns
**Status**: Read-only references
**Used By**: All API-related modules

---

## Usage Guidelines

### ✅ DO:
- Read files to understand patterns
- Copy template files to MODULES/ for modification
- Reference component APIs
- Study existing layouts and structures
- Use as documentation

### ❌ DO NOT:
- Modify any files in CLONED/
- Import from CLONED/ in module code
- Delete files from CLONED/
- Add new files to CLONED/ (use NEW/ instead)
- Treat as source of truth (original repo is source of truth)

---

## Module-Specific Usage

See individual clone manifests for detailed usage:
- `clone_manifest_MODULE-0A.md` - Auth enforcement
- `clone_manifest_MODULE-0B.md` - RBAC schema
- `clone_manifest_MODULE-0C.md` - Team management UI
- `clone_manifest_MODULE-1A.md` - Supplier filtering
- `clone_manifest_MODULE-1B.md` - Enhanced search
- `clone_manifest_MODULE-1C.md` - Quote approval
- `clone_manifest_MODULE-2A.md` - Template system
- `clone_manifest_MODULE-3A.md` - Payment tracking

---

## File Statistics

- **Total Files Cloned**: ~30 files
- **Total Lines**: ~3,600 lines
- **Total Size**: ~150KB
- **Library Files**: 4 files
- **UI Components**: 17 files
- **Page Templates**: 5 files
- **API Routes**: 1 file

---

## Verification

After cloning, verify:
- [ ] All directory structures preserved
- [ ] No syntax errors in cloned files
- [ ] File permissions appropriate
- [ ] README present and clear

---

**Last Updated**: PHASE 3 completion
**Next Step**: PHASE 4 - Module skeleton implementation
