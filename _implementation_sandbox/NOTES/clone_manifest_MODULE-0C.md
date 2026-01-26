# Clone Manifest: MODULE-0C (Team Management UI)

**Module Purpose**: Admin interface for inviting users and assigning roles
**Implementation Order**: 3rd
**Phase**: 0 (Foundation)

---

## Files to Clone

### 1. Dashboard Layout (for navigation pattern)
**Source**: `app/app-dashboard/layout.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/app-dashboard/layout.tsx`
**Reason**: Need to understand navigation structure to add "Team" menu item (or decide not to)
**Will Change**: NO - Reference only (will NOT add menu item, as nav is fixed)
**Will NOT Change**: Everything (read-only reference)

### 2. Suppliers Page (as UI template)
**Source**: `app/app-dashboard/suppliers/page.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/app-dashboard/suppliers/page.tsx`
**Reason**: Use as template for Team page layout (header, search, grid/list, dialog)
**Will Change**: YES - Clone will be basis for team-page.tsx
**Will NOT Change**: Original file (clone will be modified in MODULES/)

### 3. UI Components (Dialog, Button, Table, etc.)
**Source**: `components/ui/dialog.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/dialog.tsx`
**Reason**: Reference for dialog patterns (invite user dialog)
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

**Source**: `components/ui/button.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/button.tsx`
**Reason**: Reference for button styling
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

**Source**: `components/ui/table.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/table.tsx`
**Reason**: Use for user list display
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

**Source**: `components/ui/input.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/input.tsx`
**Reason**: Form inputs for invite dialog
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

**Source**: `components/ui/select.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/select.tsx`
**Reason**: Role selection dropdown
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

### 4. Auth Provider (for user context)
**Source**: `lib/auth-provider.tsx`
**Destination**: `_implementation_sandbox/CLONED/lib/auth-provider.tsx`
**Reason**: Use useAuth hook pattern for current user
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

---

## Files NOT to Clone

- Other page files (not needed as templates)
- API routes (will create new ones)
- Non-UI components

---

## What Will Be Created (NEW files)

All new files will be in `_implementation_sandbox/MODULES/MODULE-0C/`:

1. **`pages/team-page.tsx`**
   - Based on suppliers/page.tsx pattern
   - Header with "Team" title and "Invite User" button
   - Table showing users (email, role, status)
   - Search bar for filtering users
   - Uses exact same layout/styling as suppliers page

2. **`components/invite-user-dialog.tsx`**
   - Dialog with email input and role select
   - Based on Add Supplier dialog pattern
   - Send invite button (calls API)
   - Form validation (email required, role required)

3. **`components/user-list-table.tsx`**
   - Table component showing user list
   - Columns: Email, Role, Status, Actions
   - Actions: Edit Role, Remove User
   - Uses shadcn/ui Table component

4. **`components/edit-role-dialog.tsx`**
   - Dialog to change user role
   - Select dropdown with role options
   - Save button (updates role)

5. **`api/team-routes.ts`**
   - API route stubs (skeleton only)
   - POST /api/team/invite (send invite)
   - GET /api/team/users (list users)
   - PATCH /api/team/users/:id (update role)
   - DELETE /api/team/users/:id (remove user)

6. **`README.md`**
   - Integration instructions
   - How to add to navigation (manual step)
   - API implementation guide
   - Testing checklist

---

## Integration Strategy

**Cloned files are READ-ONLY references**. New team page will:
- Follow exact same UI pattern as suppliers page
- Use same components (Dialog, Button, Table, etc.)
- Match existing color scheme and spacing
- Not modify navigation (admin access via direct URL initially)

**Navigation Note**: Since navigation is FIXED, team page will be accessible via:
- Direct URL: `/app-dashboard/team`
- NOT added to sidebar menu (constraint violation)
- Can be linked from admin settings later (Phase N)

---

## UI Pattern Match Requirements

**Header Section** (from suppliers page):
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
      <Users className="h-8 w-8" />
      Team
    </h1>
    <p className="text-muted-foreground">Manage team members and permissions</p>
  </div>
  <Button className="gap-2" onClick={() => setDialogOpen(true)}>
    <Plus className="h-4 w-4" />
    Invite User
  </Button>
</div>
```

**Search Bar** (from suppliers page):
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Search team members..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9"
  />
</div>
```

**Table Layout**: Use shadcn/ui Table component with same styling

---

## Verification After Clone

- [ ] All 8+ files cloned successfully
- [ ] suppliers/page.tsx can be used as template
- [ ] UI components available for reference
- [ ] Auth provider pattern understood

---

**Status**: Ready for PHASE 3 (cloning)
**Estimated Clone Size**: ~600 lines total
