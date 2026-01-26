# PHASE 5: Testing Documentation

**Document**: Comprehensive Testing Procedures
**Date**: 2026-01-09
**Purpose**: Guide QA and development team through testing all integrated modules

---

## Overview

This document provides detailed testing procedures for all 6 modules. Each module has:
- Manual testing checklist
- Test scenarios with expected outcomes
- Edge cases to verify
- Performance considerations

**Total Test Cases**: ~120 across all modules

---

## Testing Environment Setup

### Prerequisites

Before testing, ensure:

- [ ] All modules integrated (see Integration Guide)
- [ ] Database schema updated
- [ ] Test users created with different roles:
  - Admin user
  - Manager user
  - Procurement user
  - Viewer user
- [ ] Sample data loaded:
  - Suppliers with categories/regions
  - Quotes in various statuses
  - Access rules for test users
- [ ] Browser dev tools open (check console for errors)

### Test Data Setup

```sql
-- Create test users (run in Supabase SQL editor)
-- Note: You'll need to invite these users first, then run this

-- Assign roles
INSERT INTO user_roles (user_id, role, notes) VALUES
  ('ADMIN_USER_ID', 'Admin', 'Test admin'),
  ('MANAGER_USER_ID', 'Manager', 'Test manager'),
  ('PROCUREMENT_USER_ID', 'Procurement', 'Test procurement'),
  ('VIEWER_USER_ID', 'Viewer', 'Test viewer');

-- Create access rules for Procurement user
INSERT INTO access_rules (user_id, category_id, region_id, active, notes) VALUES
  ('PROCUREMENT_USER_ID', 'HARDWARE_CATEGORY_ID', NULL, true, 'Hardware access'),
  ('PROCUREMENT_USER_ID', NULL, 'NORTH_REGION_ID', true, 'North region access');

-- Create test suppliers
INSERT INTO suppliers (name, category_id, region_id, status) VALUES
  ('Hardware Supplier A', 'HARDWARE_CATEGORY_ID', 'NORTH_REGION_ID', 'active'),
  ('Software Supplier B', 'SOFTWARE_CATEGORY_ID', 'SOUTH_REGION_ID', 'active'),
  ('Service Supplier C', 'SERVICES_CATEGORY_ID', 'EAST_REGION_ID', 'active');

-- Create test quotes
INSERT INTO quotes (supplier_id, project_id, created_by, status, title, amount) VALUES
  ('SUPPLIER_ID', 'PROJECT_ID', 'PROCUREMENT_USER_ID', 'draft', 'Test Quote 1', 10000),
  ('SUPPLIER_ID', 'PROJECT_ID', 'PROCUREMENT_USER_ID', 'pending', 'Test Quote 2', 20000),
  ('SUPPLIER_ID', 'PROJECT_ID', 'PROCUREMENT_USER_ID', 'approved', 'Test Quote 3', 30000);
```

---

## MODULE-0A: Auth Enforcement Layer

### Test Objective
Verify authentication middleware protects API routes and pages correctly.

### Test Cases (10)

#### TC-0A-001: API Route - Authenticated Access
**Steps**:
1. Log in as any user
2. Make GET request to `/api/suppliers`

**Expected**:
- ✅ Request succeeds
- ✅ Returns supplier data
- ✅ No 401 error

#### TC-0A-002: API Route - Unauthenticated Access
**Steps**:
1. Log out
2. Make GET request to `/api/suppliers`

**Expected**:
- ✅ Request fails with 401 Unauthorized
- ✅ Error message: "Unauthorized"

#### TC-0A-003: Page - Authenticated Access
**Steps**:
1. Log in as any user
2. Navigate to `/app-dashboard/suppliers`

**Expected**:
- ✅ Page loads successfully
- ✅ Content displays

#### TC-0A-004: Page - Unauthenticated Access
**Steps**:
1. Log out
2. Navigate to `/app-dashboard/suppliers`

**Expected**:
- ✅ Redirects to login page
- ✅ Return URL preserved (e.g., `?redirect=/app-dashboard/suppliers`)

#### TC-0A-005: Page - Role-Based Access (Admin Only)
**Steps**:
1. Log in as Procurement user
2. Navigate to `/app-dashboard/team`

**Expected**:
- ✅ Access denied (403) or redirected
- ✅ Error message displayed

#### TC-0A-006: useAuthUser Hook
**Steps**:
1. Log in
2. Open any page using useAuthUser hook
3. Check user data displayed

**Expected**:
- ✅ User ID, email, role displayed
- ✅ Data matches logged-in user

#### TC-0A-007: useHasRole Hook - Correct Role
**Steps**:
1. Log in as Admin
2. Component using `useHasRole('Admin')` should show admin content

**Expected**:
- ✅ Returns true
- ✅ Admin-only content visible

#### TC-0A-008: useHasRole Hook - Incorrect Role
**Steps**:
1. Log in as Viewer
2. Component using `useHasRole('Admin')` should hide admin content

**Expected**:
- ✅ Returns false
- ✅ Admin-only content hidden

#### TC-0A-009: Session Expiry
**Steps**:
1. Log in
2. Wait for session to expire (or manually expire in DB)
3. Make API request

**Expected**:
- ✅ Returns 401 Unauthorized
- ✅ User redirected to login

#### TC-0A-010: Token Refresh
**Steps**:
1. Log in
2. Use app continuously across token refresh period
3. Verify seamless operation

**Expected**:
- ✅ No interruption
- ✅ Token refreshed automatically
- ✅ No re-login required

### Edge Cases

- [ ] Multiple tabs open (session sync)
- [ ] Slow network (timeout handling)
- [ ] Invalid JWT token
- [ ] User deleted while logged in
- [ ] Role changed while logged in

---

## MODULE-0B: RBAC Schema & Database

### Test Objective
Verify database schema, RLS policies, and helper functions work correctly.

### Test Cases (15)

#### TC-0B-001: User Roles Table - Insert
**Steps**:
```sql
INSERT INTO user_roles (user_id, role, notes)
VALUES ('TEST_USER_ID', 'Manager', 'Test role assignment');
```

**Expected**:
- ✅ Row inserted successfully
- ✅ created_at/updated_at populated

#### TC-0B-002: User Roles Table - Duplicate User
**Steps**:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('EXISTING_USER_ID', 'Admin');
```

**Expected**:
- ✅ Fails with unique constraint violation
- ✅ Error message mentions unique constraint

#### TC-0B-003: User Roles Table - Invalid Role
**Steps**:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('TEST_USER_ID', 'InvalidRole');
```

**Expected**:
- ✅ Fails with check constraint violation
- ✅ Only 4 roles allowed

#### TC-0B-004: Access Rules Table - Insert
**Steps**:
```sql
INSERT INTO access_rules (user_id, category_id, region_id, active)
VALUES ('TEST_USER_ID', 'CATEGORY_ID', 'REGION_ID', true);
```

**Expected**:
- ✅ Row inserted successfully
- ✅ Multiple rules per user allowed

#### TC-0B-005: Access Rules Table - NULL Category/Region
**Steps**:
```sql
INSERT INTO access_rules (user_id, category_id, region_id, active)
VALUES ('TEST_USER_ID', NULL, NULL, true);
```

**Expected**:
- ✅ Allowed (NULL means "all")
- ✅ User gets access to all categories/regions

#### TC-0B-006: RLS Policy - Admin Bypass
**Steps**:
1. Log in as Admin
2. Query suppliers table
3. Should see all suppliers

**Expected**:
- ✅ All suppliers returned
- ✅ No filtering applied

#### TC-0B-007: RLS Policy - Procurement Filtering
**Steps**:
1. Log in as Procurement user (with specific access rules)
2. Query suppliers table
3. Should see only allowed suppliers

**Expected**:
- ✅ Only suppliers matching access rules returned
- ✅ Other suppliers filtered out

#### TC-0B-008: Helper Function - is_admin()
**Steps**:
```sql
SELECT is_admin('ADMIN_USER_ID'); -- Should return true
SELECT is_admin('VIEWER_USER_ID'); -- Should return false
```

**Expected**:
- ✅ Returns correct boolean
- ✅ Case-sensitive role check

#### TC-0B-009: Helper Function - has_role()
**Steps**:
```sql
SELECT has_role('MANAGER_USER_ID', 'Manager'); -- true
SELECT has_role('MANAGER_USER_ID', 'Admin'); -- false
```

**Expected**:
- ✅ Returns correct boolean for role match

#### TC-0B-010: Helper Function - user_can_view_supplier()
**Steps**:
```sql
SELECT user_can_view_supplier('PROCUREMENT_USER_ID', 'SUPPLIER_ID');
```

**Expected**:
- ✅ Returns true if supplier matches access rules
- ✅ Returns false if no match
- ✅ Admins always return true

#### TC-0B-011: Helper Function - get_user_access_rules()
**Steps**:
```sql
SELECT * FROM get_user_access_rules('PROCUREMENT_USER_ID');
```

**Expected**:
- ✅ Returns all active access rules for user
- ✅ Inactive rules excluded

#### TC-0B-012: RLS Policy - Insert (Admin Only)
**Steps**:
1. Log in as Procurement
2. Try to INSERT into user_roles table

**Expected**:
- ✅ Fails (only Admins can insert)
- ✅ RLS policy blocks operation

#### TC-0B-013: RLS Policy - Update Own Record
**Steps**:
1. Log in as any user
2. Try to UPDATE own user_roles record

**Expected**:
- ✅ Fails (users cannot change own role)
- ✅ Only Admins can update

#### TC-0B-014: Database Indexes
**Steps**:
```sql
EXPLAIN ANALYZE SELECT * FROM user_roles WHERE user_id = 'TEST_ID';
EXPLAIN ANALYZE SELECT * FROM access_rules WHERE user_id = 'TEST_ID';
```

**Expected**:
- ✅ Index scan (not seq scan)
- ✅ Fast query performance

#### TC-0B-015: Cascade Delete
**Steps**:
1. Delete user from auth.users
2. Check user_roles and access_rules

**Expected**:
- ✅ Related rows deleted (CASCADE)
- ✅ No orphan records

### Edge Cases

- [ ] User with no role (should default to Viewer behavior)
- [ ] User with conflicting access rules
- [ ] Access rules with both category and region NULL
- [ ] Very large number of access rules (performance)

---

## MODULE-0C: Team Management UI

### Test Objective
Verify admin can manage team members, roles, and access rules.

### Test Cases (20)

#### TC-0C-001: View Team Members
**Steps**:
1. Log in as Admin
2. Navigate to `/app-dashboard/team`

**Expected**:
- ✅ Page loads
- ✅ Team members list displayed
- ✅ Shows ID, email, role, created date

#### TC-0C-002: Invite User - Success
**Steps**:
1. Click "Invite User" button
2. Enter email: `newuser@example.com`
3. Select role: Manager
4. Add notes: "New team member"
5. Click "Send Invitation"

**Expected**:
- ✅ Success message shown
- ✅ Invitation email sent
- ✅ User appears in pending invitations

#### TC-0C-003: Invite User - Duplicate Email
**Steps**:
1. Try to invite existing user email

**Expected**:
- ✅ Error message: "User already exists"
- ✅ Invitation not sent

#### TC-0C-004: Invite User - Invalid Email
**Steps**:
1. Enter invalid email: `notanemail`

**Expected**:
- ✅ Form validation error
- ✅ Cannot submit

#### TC-0C-005: Change Role - Success
**Steps**:
1. Click "Change Role" on a user
2. Select new role: Admin
3. Add reason: "Promotion"
4. Confirm

**Expected**:
- ✅ Role updated in database
- ✅ Success message shown
- ✅ User sees updated role immediately

#### TC-0C-006: Change Role - Cannot Change Own Role
**Steps**:
1. Admin tries to change own role

**Expected**:
- ✅ Blocked (cannot change own role)
- ✅ Warning message shown

#### TC-0C-007: Manage Access - Add Rule
**Steps**:
1. Click "Manage Access" on Procurement user
2. Click "Add Rule"
3. Select category: Hardware
4. Select region: North
5. Save

**Expected**:
- ✅ Access rule created
- ✅ User can now see matching suppliers

#### TC-0C-008: Manage Access - Add Rule (NULL Category)
**Steps**:
1. Add rule with category = "All Categories" (NULL)

**Expected**:
- ✅ Rule created with NULL category_id
- ✅ User gets access to all categories in selected region

#### TC-0C-009: Manage Access - Remove Rule
**Steps**:
1. Click delete icon on existing rule
2. Confirm deletion

**Expected**:
- ✅ Rule deleted
- ✅ User loses access to those suppliers

#### TC-0C-010: Manage Access - Disable Rule
**Steps**:
1. Toggle "active" checkbox to false

**Expected**:
- ✅ Rule marked inactive
- ✅ User loses access (rule not applied)
- ✅ Can re-enable later

#### TC-0C-011: Statistics Display
**Steps**:
1. View team page statistics cards

**Expected**:
- ✅ Shows total team members
- ✅ Shows Admins count
- ✅ Shows Managers count
- ✅ Shows Procurement count
- ✅ Shows Viewers count
- ✅ Counts are accurate

#### TC-0C-012: Access Control - Non-Admin
**Steps**:
1. Log in as Manager or Procurement
2. Try to access `/app-dashboard/team`

**Expected**:
- ✅ Access denied
- ✅ Redirected or 403 error

#### TC-0C-013: Role Filter
**Steps**:
1. Use role filter dropdown
2. Select "Admin"

**Expected**:
- ✅ Table shows only Admins
- ✅ Other roles hidden

#### TC-0C-014: Search Team Members
**Steps**:
1. Enter email in search box
2. Type: `john@example.com`

**Expected**:
- ✅ Table filters to matching users
- ✅ Non-matching users hidden

#### TC-0C-015: Access Rules Summary
**Steps**:
1. View "Access Rules" column in table

**Expected**:
- ✅ Shows count: "3 rules"
- ✅ Shows "No restrictions" for Admins/Managers/Viewers
- ✅ Click opens detail dialog

#### TC-0C-016: Real-Time Updates (Optional)
**Steps**:
1. Open team page in two browser tabs
2. In tab 1, change a user's role
3. Check tab 2

**Expected**:
- ✅ Tab 2 updates automatically (if real-time enabled)
- ✅ Or shows stale data (if not enabled)

#### TC-0C-017: Pagination
**Steps**:
1. Add 50+ team members
2. Check pagination controls

**Expected**:
- ✅ Page 1 shows 20 members
- ✅ Can navigate to page 2
- ✅ Total count displayed

#### TC-0C-018: Sort Team Members
**Steps**:
1. Click "Email" column header

**Expected**:
- ✅ Table sorts by email alphabetically
- ✅ Click again to reverse sort

#### TC-0C-019: Delete User (Soft Delete)
**Steps**:
1. Click "Remove" on a user
2. Confirm deletion

**Expected**:
- ✅ User removed from team
- ✅ User row deleted from user_roles
- ✅ Access rules cascade deleted
- ✅ Auth user still exists (can be re-invited)

#### TC-0C-020: Invitation Expiry
**Steps**:
1. Send invitation
2. Wait 24 hours (or manually expire in DB)
3. User tries to accept invitation

**Expected**:
- ✅ Invitation expired message
- ✅ Admin can resend invitation

### Edge Cases

- [ ] 100+ team members (performance)
- [ ] User accepts invite while admin viewing page
- [ ] Network error during role change
- [ ] Multiple admins changing same user simultaneously

---

## MODULE-1A: Supplier Access Filtering

### Test Objective
Verify supplier visibility is correctly filtered based on access rules.

### Test Cases (15)

#### TC-1A-001: Admin - See All Suppliers
**Steps**:
1. Log in as Admin
2. Navigate to `/app-dashboard/suppliers`

**Expected**:
- ✅ All suppliers visible
- ✅ No filter indicator shown

#### TC-1A-002: Procurement - Filtered Suppliers
**Steps**:
1. Log in as Procurement user (with access rules)
2. Navigate to `/app-dashboard/suppliers`

**Expected**:
- ✅ Only suppliers matching access rules visible
- ✅ Filter indicator shown
- ✅ Count matches filtered suppliers

#### TC-1A-003: Procurement - No Access Rules
**Steps**:
1. Log in as Procurement user (NO access rules)
2. Navigate to `/app-dashboard/suppliers`

**Expected**:
- ✅ No suppliers visible (empty list)
- ✅ Filter indicator shown
- ✅ Message: "No suppliers visible. Contact admin for access."

#### TC-1A-004: Access Rule - Category Match
**Steps**:
1. Procurement user has rule: category = Hardware, region = NULL
2. Query suppliers

**Expected**:
- ✅ All Hardware suppliers visible (all regions)
- ✅ Non-Hardware suppliers hidden

#### TC-1A-005: Access Rule - Region Match
**Steps**:
1. Procurement user has rule: category = NULL, region = North
2. Query suppliers

**Expected**:
- ✅ All suppliers in North region visible (all categories)
- ✅ Other regions hidden

#### TC-1A-006: Access Rule - Category + Region Match
**Steps**:
1. Procurement user has rule: category = Hardware, region = North
2. Query suppliers

**Expected**:
- ✅ Only Hardware suppliers in North visible
- ✅ Other combinations hidden

#### TC-1A-007: Access Rule - Multiple Rules (OR Logic)
**Steps**:
1. Procurement user has 2 rules:
   - category = Hardware, region = North
   - category = Software, region = South
2. Query suppliers

**Expected**:
- ✅ Hardware/North OR Software/South visible
- ✅ Other combinations hidden

#### TC-1A-008: Filter Indicator - Dismissible
**Steps**:
1. View filter indicator as Procurement user
2. Click dismiss (X) button

**Expected**:
- ✅ Indicator hidden
- ✅ Preference saved (doesn't reappear on refresh)

#### TC-1A-009: Filter Indicator - Details
**Steps**:
1. Click "View Details" on filter indicator

**Expected**:
- ✅ Shows all active access rules
- ✅ Shows category and region for each rule
- ✅ Shows total supplier count

#### TC-1A-010: API - Filtered Response
**Steps**:
1. Log in as Procurement
2. Make GET request to `/api/suppliers`

**Expected**:
- ✅ Response includes: `isFiltered: true`
- ✅ Response includes: `accessRules: [...]`
- ✅ Only filtered suppliers returned

#### TC-1A-011: API - Admin Response
**Steps**:
1. Log in as Admin
2. Make GET request to `/api/suppliers`

**Expected**:
- ✅ Response includes: `isFiltered: false`
- ✅ Response includes: `accessRules: []`
- ✅ All suppliers returned

#### TC-1A-012: Supplier Details - Accessible
**Steps**:
1. Log in as Procurement
2. Click on supplier that matches access rules

**Expected**:
- ✅ Supplier details page loads
- ✅ Full information displayed

#### TC-1A-013: Supplier Details - Not Accessible
**Steps**:
1. Log in as Procurement
2. Try to access supplier URL that doesn't match access rules

**Expected**:
- ✅ 403 Forbidden error
- ✅ Error message: "You don't have access to this supplier"

#### TC-1A-014: Performance - Many Access Rules
**Steps**:
1. Create Procurement user with 50+ access rules
2. Query suppliers

**Expected**:
- ✅ Query completes in <1 second
- ✅ Correct suppliers returned

#### TC-1A-015: Real-Time Access Change
**Steps**:
1. Procurement user viewing suppliers page
2. Admin adds new access rule for this user
3. User refreshes page

**Expected**:
- ✅ New suppliers now visible
- ✅ Access rules updated

### Edge Cases

- [ ] Access rule with deleted category/region
- [ ] User role changed from Procurement to Admin (access rules ignored)
- [ ] Supplier moved to different category (visibility changes)
- [ ] NULL category + NULL region (access to all)

---

## MODULE-1C: Quote Approval Workflow

### Test Objective
Verify quote state machine and approval workflow function correctly.

### Test Cases (25)

#### TC-1C-001: Create Quote - Default Status
**Steps**:
1. Log in as Procurement
2. Create new quote

**Expected**:
- ✅ Quote created with status = "draft"
- ✅ All approval fields NULL

#### TC-1C-002: Submit Quote - Valid Transition
**Steps**:
1. Quote status = draft
2. Click "Submit for Approval"

**Expected**:
- ✅ Status changes to "pending"
- ✅ submitted_at populated
- ✅ Success notification shown

#### TC-1C-003: Submit Quote - Invalid Transition
**Steps**:
1. Quote status = approved
2. Try to submit again

**Expected**:
- ✅ Blocked (invalid transition)
- ✅ Error message shown

#### TC-1C-004: Approve Quote - Manager
**Steps**:
1. Log in as Manager
2. Quote status = pending
3. Click "Approve"
4. Enter approval notes: "Looks good"
5. Submit

**Expected**:
- ✅ Status changes to "approved"
- ✅ approved_by = Manager's user ID
- ✅ approved_at populated
- ✅ approval_notes saved

#### TC-1C-005: Approve Quote - Procurement (Blocked)
**Steps**:
1. Log in as Procurement
2. Try to approve own quote

**Expected**:
- ✅ Approve button not visible (canPerformAction = false)
- ✅ Or blocked by API (403)

#### TC-1C-006: Reject Quote - Manager
**Steps**:
1. Log in as Manager
2. Quote status = pending
3. Click "Reject"
4. Enter rejection reason: "Price too high"
5. Submit

**Expected**:
- ✅ Status changes to "rejected"
- ✅ rejected_by = Manager's user ID
- ✅ rejected_at populated
- ✅ rejection_reason saved

#### TC-1C-007: Accept Quote - Procurement
**Steps**:
1. Log in as Procurement (quote creator)
2. Quote status = approved
3. Click "Accept"

**Expected**:
- ✅ Status changes to "accepted"
- ✅ Quote finalized (terminal state)

#### TC-1C-008: Decline Quote - Procurement
**Steps**:
1. Log in as Procurement (quote creator)
2. Quote status = approved
3. Click "Decline"

**Expected**:
- ✅ Status changes to "declined"
- ✅ Can revise and resubmit

#### TC-1C-009: Revise Quote - From Rejected
**Steps**:
1. Quote status = rejected
2. Click "Revise"
3. Edit quote details
4. Re-submit

**Expected**:
- ✅ Status changes back to "draft"
- ✅ Can modify and resubmit
- ✅ Previous rejection reason preserved

#### TC-1C-010: Status Badge - Colors
**Steps**:
1. View quotes list with various statuses

**Expected**:
- ✅ Draft: Gray outline
- ✅ Pending: Yellow/warning
- ✅ Approved: Green
- ✅ Rejected: Red
- ✅ Accepted: Blue
- ✅ Declined: Orange

#### TC-1C-011: Status Badge - Icons
**Steps**:
1. View quote status badges

**Expected**:
- ✅ Draft: FileText icon
- ✅ Pending: Clock icon
- ✅ Approved: CheckCircle icon
- ✅ Rejected: XCircle icon
- ✅ Accepted: ThumbsUp icon
- ✅ Declined: ThumbsDown icon

#### TC-1C-012: Approval Dialog - Validation
**Steps**:
1. Open approve dialog
2. Try to submit without notes

**Expected**:
- ✅ Form validation error
- ✅ "Approval notes required"
- ✅ Cannot submit

#### TC-1C-013: Approval Dialog - Cancel
**Steps**:
1. Open approve dialog
2. Enter notes
3. Click "Cancel"

**Expected**:
- ✅ Dialog closes
- ✅ No changes made
- ✅ Notes discarded

#### TC-1C-014: Pending Quotes - Manager Dashboard
**Steps**:
1. Log in as Manager
2. View dashboard

**Expected**:
- ✅ Widget shows "X Pending Approvals"
- ✅ Count accurate
- ✅ Click navigates to quotes page (filtered to pending)

#### TC-1C-015: My Quotes - Procurement View
**Steps**:
1. Log in as Procurement
2. View quotes page

**Expected**:
- ✅ Only shows user's own quotes
- ✅ Other users' quotes hidden

#### TC-1C-016: All Quotes - Admin/Manager View
**Steps**:
1. Log in as Admin or Manager
2. View quotes page

**Expected**:
- ✅ Shows all quotes (all users)
- ✅ Filter by status available

#### TC-1C-017: Approval Audit Trail
**Steps**:
1. View approved/rejected quote
2. Check approval details

**Expected**:
- ✅ Shows who approved/rejected
- ✅ Shows when
- ✅ Shows notes/reason

#### TC-1C-018: State Machine - No Skipping
**Steps**:
1. Try to go directly from draft → approved (skip pending)

**Expected**:
- ✅ Blocked by state machine
- ✅ Must go through pending status

#### TC-1C-019: Terminal State - No Changes
**Steps**:
1. Quote status = accepted
2. Try to change status

**Expected**:
- ✅ All action buttons disabled/hidden
- ✅ Status locked

#### TC-1C-020: Permission Check - Viewer
**Steps**:
1. Log in as Viewer
2. View quotes page

**Expected**:
- ✅ Can view all quotes
- ✅ All action buttons disabled
- ✅ Cannot approve/reject/submit

#### TC-1C-021: Notification - Submitted (TODO)
**Steps**:
1. Procurement submits quote

**Expected**:
- ✅ Managers receive email notification
- ✅ Email contains quote details and approval link

#### TC-1C-022: Notification - Approved (TODO)
**Steps**:
1. Manager approves quote

**Expected**:
- ✅ Quote creator receives email
- ✅ Email contains approval notes

#### TC-1C-023: Notification - Rejected (TODO)
**Steps**:
1. Manager rejects quote

**Expected**:
- ✅ Quote creator receives email
- ✅ Email contains rejection reason

#### TC-1C-024: Filter Quotes by Status
**Steps**:
1. Use status filter on quotes page
2. Select "Pending"

**Expected**:
- ✅ Only pending quotes shown
- ✅ Other statuses hidden

#### TC-1C-025: Sort Quotes
**Steps**:
1. Use sort dropdown
2. Sort by "Amount (High to Low)"

**Expected**:
- ✅ Quotes sorted correctly
- ✅ Highest amount first

### Edge Cases

- [ ] Quote deleted while manager viewing
- [ ] Multiple managers approve same quote simultaneously
- [ ] User role changed while viewing quote
- [ ] Quote updated while approval dialog open

---

## MODULE-1B: Enhanced Search & Filters

### Test Objective
Verify search, filtering, and sorting work correctly across all pages.

### Test Cases (20)

#### TC-1B-001: Search - Immediate Input
**Steps**:
1. Navigate to suppliers page
2. Type in search box: "acme"

**Expected**:
- ✅ Input shows "acme" immediately (no delay)
- ✅ Search executes after 300ms
- ✅ Results filter to matching suppliers

#### TC-1B-002: Search - Debouncing
**Steps**:
1. Type quickly: "a", "ac", "acm", "acme"
2. Observe network requests

**Expected**:
- ✅ Only 1 API request (after "acme")
- ✅ No requests for "a", "ac", "acm"
- ✅ 300ms debounce working

#### TC-1B-003: Search - Clear Button
**Steps**:
1. Enter search term
2. Click X button

**Expected**:
- ✅ Search cleared
- ✅ Results reset to all items

#### TC-1B-004: Search - Multiple Fields
**Steps**:
1. Search for "john"
2. Should match supplier name OR contact name OR email

**Expected**:
- ✅ Matches in any field
- ✅ OR logic working

#### TC-1B-005: Filter - Open Panel
**Steps**:
1. Click "Filters" button

**Expected**:
- ✅ Filter panel opens from right
- ✅ Shows all filter fields
- ✅ Current values pre-selected

#### TC-1B-006: Filter - Select Field
**Steps**:
1. Open filter panel
2. Select status: "Active"
3. Click "Apply"

**Expected**:
- ✅ Panel closes
- ✅ Results filtered to active only
- ✅ Active filter badge shows "1"

#### TC-1B-007: Filter - Multiselect Field
**Steps**:
1. Open filter panel
2. Select categories: "Hardware", "Software"
3. Click "Apply"

**Expected**:
- ✅ Results show Hardware OR Software
- ✅ Other categories hidden
- ✅ Active badges show both selections

#### TC-1B-008: Filter - Reset
**Steps**:
1. Apply filters
2. Click "Reset" in panel

**Expected**:
- ✅ All filters cleared
- ✅ Results reset to all items
- ✅ Filter badge removed

#### TC-1B-009: Filter - Active Badges
**Steps**:
1. Apply multiple filters
2. View ActiveFilterBadges component

**Expected**:
- ✅ Shows all applied filters
- ✅ Format: "Status: Active, Category: Hardware"
- ✅ Each badge has X to remove

#### TC-1B-010: Filter - Remove Single Badge
**Steps**:
1. Apply multiple filters
2. Click X on one badge

**Expected**:
- ✅ That filter removed
- ✅ Other filters still active
- ✅ Results update

#### TC-1B-011: Filter - Clear All
**Steps**:
1. Apply multiple filters
2. Click "Clear all" button

**Expected**:
- ✅ All filters removed
- ✅ Results reset

#### TC-1B-012: Sort - Select Field
**Steps**:
1. Open sort dropdown
2. Select "Name"

**Expected**:
- ✅ Results sorted alphabetically by name (A→Z)
- ✅ Default direction applied

#### TC-1B-013: Sort - Toggle Direction
**Steps**:
1. Sort by "Name" (ascending)
2. Click direction toggle button

**Expected**:
- ✅ Sort direction reversed (Z→A)
- ✅ Arrow icon changes (↓)
- ✅ Results re-sorted

#### TC-1B-014: Sort - Table Column Header
**Steps**:
1. Click "Name" column header

**Expected**:
- ✅ Sorts by Name (ascending)
- ✅ Click again → descending
- ✅ Click again → unsorted (clear)
- ✅ Arrow indicators shown

#### TC-1B-015: Combined - Search + Filter + Sort
**Steps**:
1. Search: "acme"
2. Filter: Status = "Active"
3. Sort: "Name" (A→Z)

**Expected**:
- ✅ All three applied
- ✅ Results match all criteria
- ✅ URL shows all params

#### TC-1B-016: URL Sync - Initial Load
**Steps**:
1. Navigate to: `/suppliers?q=acme&filter_status=active&sort_by=name&sort_dir=asc`

**Expected**:
- ✅ Search, filter, sort applied on load
- ✅ UI shows correct values
- ✅ Results pre-filtered

#### TC-1B-017: URL Sync - Updates
**Steps**:
1. Apply search/filter/sort
2. Observe browser URL

**Expected**:
- ✅ URL updates without page reload
- ✅ All parameters in URL
- ✅ Can copy/paste URL to share

#### TC-1B-018: URL Sync - Browser Back
**Steps**:
1. Apply filter
2. Apply different filter
3. Click browser back button

**Expected**:
- ✅ Previous filter restored
- ✅ Results update
- ✅ No page reload

#### TC-1B-019: Performance - Large Dataset
**Steps**:
1. Load page with 1000+ items
2. Apply search/filter/sort

**Expected**:
- ✅ Operations complete quickly (<500ms)
- ✅ No UI lag
- ✅ Smooth scrolling

#### TC-1B-020: Empty Results
**Steps**:
1. Search for non-existent term: "xyzabc123"

**Expected**:
- ✅ Shows "No results found"
- ✅ Suggests clearing filters
- ✅ No errors

### Edge Cases

- [ ] Special characters in search (quotes, slashes)
- [ ] Very long search query (100+ chars)
- [ ] Rapid filter changes (stress test)
- [ ] URL with invalid filter values
- [ ] Browser refresh during search

---

## Performance Testing

### Load Time Targets

- [ ] Page initial load: <2 seconds
- [ ] API response: <500ms
- [ ] Search debounce: 300ms
- [ ] Filter apply: <200ms
- [ ] Sort operation: <100ms

### Database Query Performance

```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM suppliers WHERE /* filters */;
EXPLAIN ANALYZE SELECT * FROM quotes WHERE status = 'pending';
EXPLAIN ANALYZE SELECT * FROM user_roles WHERE user_id = 'test-id';
```

Expected:
- [ ] All queries use indexes (Index Scan, not Seq Scan)
- [ ] Execution time <50ms for single record
- [ ] Execution time <200ms for list queries

---

## Security Testing

### Authentication
- [ ] Cannot access API without auth token
- [ ] Cannot access pages without login
- [ ] Session expires correctly
- [ ] Token refresh works

### Authorization
- [ ] Procurement cannot approve quotes
- [ ] Viewer cannot modify data
- [ ] Users cannot change own role
- [ ] RLS policies enforced

### Input Validation
- [ ] XSS prevention (HTML escaped)
- [ ] SQL injection prevention (parameterized queries)
- [ ] CSRF protection (Next.js built-in)
- [ ] Rate limiting on API routes

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility (ARIA labels)
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Form labels associated
- [ ] Error messages announced

---

## Summary

**Total Test Cases**: ~120
**Estimated Testing Time**: 8-12 hours (full manual test)
**Automation Potential**: 60% (API tests, database tests)

**Next Steps**:
1. Execute manual tests in order
2. Document failures in issue tracker
3. Write automated tests for critical paths
4. Re-test after bug fixes
5. Sign off on each module

**Testing Complete**: Ready for production deployment

