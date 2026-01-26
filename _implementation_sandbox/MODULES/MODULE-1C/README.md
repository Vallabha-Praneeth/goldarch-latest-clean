# MODULE-1C: Quote Approval Workflow

**Status**: ⚠️ SKELETON IMPLEMENTATION (Ready for Integration)
**Phase**: 1 (Supplier Management)
**Priority**: HIGH
**Implementation Order**: 5th (after MODULE-0A, 0B, 0C, 1A)

---

## Purpose

Implements a complete approval workflow for quotes, allowing procurement to submit quotes for manager/admin approval, and tracking the full lifecycle from draft to acceptance.

---

## What This Module Does

1. **Quote Status Management**: Track quotes through workflow (draft → pending → approved/rejected → accepted/declined)
2. **Role-Based Approvals**: Only managers/admins can approve, procurement can submit/accept
3. **Approval Dialog**: Rich UI for reviewing and approving/rejecting quotes
4. **Status Tracking**: Visual indicators showing current quote status
5. **Audit Trail**: Records who approved/rejected and when

---

## Files in This Module

```
MODULE-1C/
├── types/
│   └── quote-approval.types.ts          # Type definitions & workflow logic
├── components/
│   ├── quote-status-badge.tsx           # Status indicator component
│   └── quote-approval-dialog.tsx        # Approval/rejection dialog
├── hooks/
│   └── use-quote-approval.ts            # React Query hooks
├── api/
│   └── quote-approval-routes.ts         # API route handlers
└── README.md                            # This file
```

---

## Current Status: SKELETON IMPLEMENTATION

- ✅ Complete workflow types and state machine
- ✅ Permission matrix for all roles
- ✅ Status badge component (production-ready)
- ✅ Approval dialog component (functional)
- ✅ React Query hooks (structure complete)
- ✅ API route handlers (structure complete)
- ⚠️ Uses mock data (needs Supabase integration)
- ⚠️ Requires database schema updates
- ⚠️ Needs email notification integration

---

## Workflow Overview

### Quote Lifecycle

```
Draft → Pending → Approved → Accepted
                 ↘ Rejected → (revise back to Draft)
                            ↘ Declined → (revise back to Draft)
```

### Status Definitions

1. **Draft**: Quote being prepared, not yet submitted
2. **Pending**: Submitted, awaiting manager/admin approval
3. **Approved**: Manager/admin approved, awaiting procurement acceptance
4. **Rejected**: Manager/admin rejected with reason
5. **Accepted**: Procurement accepted the approved quote (terminal state)
6. **Declined**: Procurement declined the approved quote

### Role Permissions

| Action | Admin | Manager | Procurement | Viewer |
|--------|-------|---------|-------------|--------|
| Create Quote | ✅ | ✅ | ✅ | ❌ |
| Submit for Approval | ✅ | ✅ | ✅ (own) | ❌ |
| Approve Quote | ✅ | ✅ | ❌ | ❌ |
| Reject Quote | ✅ | ✅ | ❌ | ❌ |
| Accept Approved | ✅ | ✅ | ✅ (own) | ❌ |
| Decline Approved | ✅ | ✅ | ✅ (own) | ❌ |
| View All Quotes | ✅ | ✅ | ❌ | ✅ |

---

## File Details

### 1. types/quote-approval.types.ts (380 lines)

**Purpose**: Complete type system and workflow logic

**Key Exports**:

**Types**:
- `QuoteStatus` - 6 possible statuses
- `Quote` - Database record structure
- `QuoteWithRelations` - Extended with supplier, project, user data
- `ApprovalAction` - Possible actions (submit, approve, reject, accept, decline, revise)
- `QuotePermissions` - Permission matrix structure

**Constants**:
- `QUOTE_STATUS_LABELS` - Display names for each status
- `QUOTE_STATUS_COLORS` - Color coding for badges
- `QUOTE_ROLE_PERMISSIONS` - Complete permission matrix
- `VALID_STATUS_TRANSITIONS` - State machine transitions
- `STATUS_ALLOWED_ACTIONS` - Actions allowed per status

**Helper Functions** (14):
- `getQuotePermissions(role)` - Get permissions for role
- `canPerformAction(role, action, status, isOwner)` - Permission check
- `isValidTransition(currentStatus, newStatus)` - Validate state change
- `getNextStatuses(currentStatus)` - Get possible next states
- `getAllowedActions(status)` - Get allowed actions for status
- `isTerminalStatus(status)` - Check if final state
- `isPendingApproval(status)` - Check if awaiting approval
- `isApproved(status)` - Check if approved
- `isRejected(status)` - Check if rejected/declined
- `getStatusBadgeVariant(status)` - Get badge color
- `formatApprovalStatus(quote)` - Human-readable status text

**Usage**:
```typescript
// Check if user can approve
const canApprove = canPerformAction(userRole, 'approve', quote.status, false);

// Get allowed actions
const actions = getAllowedActions(quote.status);

// Validate transition
const canTransition = isValidTransition('pending', 'approved'); // true
```

### 2. components/quote-status-badge.tsx (100 lines)

**Purpose**: Visual status indicators

**Components** (3):

1. **QuoteStatusBadge** - Full badge with icon and label
   - Color-coded by status
   - Optional icon
   - Uses shadcn/ui Badge

2. **QuoteStatusDot** - Compact colored dot
   - Just 2px circle
   - Tooltip with status name

3. **QuoteStatusWithTimestamp** - Badge + date
   - Shows status and when it changed
   - Formatted date display

**Usage**:
```typescript
<QuoteStatusBadge status={quote.status} />
<QuoteStatusDot status="pending" />
<QuoteStatusWithTimestamp
  status={quote.status}
  timestamp={quote.approved_at}
/>
```

### 3. components/quote-approval-dialog.tsx (220 lines)

**Purpose**: Dialog for approving/rejecting quotes

**Features**:
- Shows quote details for review (title, supplier, amount, description)
- Approve mode: Green theme, approval notes field
- Reject mode: Red theme, rejection reason field
- Validation: Notes/reason required
- Loading states during submission
- Error handling and display
- Success callbacks

**Props**:
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuoteWithRelations | null;
  action: 'approve' | 'reject' | null;
  onSuccess?: () => void;
}
```

**Usage**:
```typescript
const [dialogOpen, setDialogOpen] = useState(false);
const [selectedQuote, setSelectedQuote] = useState(null);
const [action, setAction] = useState<'approve' | 'reject' | null>(null);

<Button onClick={() => {
  setSelectedQuote(quote);
  setAction('approve');
  setDialogOpen(true);
}}>
  Approve
</Button>

<QuoteApprovalDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  quote={selectedQuote}
  action={action}
  onSuccess={() => refetchQuotes()}
/>
```

### 4. hooks/use-quote-approval.ts (280 lines)

**Purpose**: React Query hooks for data fetching and mutations

**Query Hooks** (4):
- `useQuotes(filters?)` - Fetch quotes with filters
- `usePendingQuotes()` - Fetch pending approvals (managers)
- `useMyQuotes()` - Fetch user's own quotes (procurement)
- `useQuoteDetails(quoteId)` - Fetch specific quote

**Mutation Hooks** (5):
- `useSubmitQuote()` - Submit draft for approval
- `useApproveQuote()` - Approve pending quote
- `useRejectQuote()` - Reject pending quote
- `useAcceptQuote()` - Accept approved quote
- `useDeclineQuote()` - Decline approved quote

**Utility Hooks**:
- `useInvalidateQuotes()` - Invalidate cache

**Usage**:
```typescript
// Manager dashboard
const { data: pendingQuotes } = usePendingQuotes();

// Procurement view
const { data: myQuotes } = useMyQuotes();

// Approve quote
const { mutate: approve, isPending } = useApproveQuote();
approve(
  { quote_id: 'xxx', notes: 'Approved' },
  {
    onSuccess: () => toast.success('Quote approved'),
    onError: (err) => toast.error(err.message),
  }
);
```

### 5. api/quote-approval-routes.ts (320 lines)

**Purpose**: Server-side API handlers

**Handlers** (6):
1. `getQuotesHandler` - GET /api/quotes (with filters)
2. `getQuoteDetailsHandler` - GET /api/quotes/{id}
3. `submitQuoteHandler` - POST /api/quotes/{id}/submit
4. `approveQuoteHandler` - POST /api/quotes/{id}/approve
5. `rejectQuoteHandler` - POST /api/quotes/{id}/reject
6. `acceptQuoteHandler` - POST /api/quotes/{id}/accept (to implement)
7. `declineQuoteHandler` - POST /api/quotes/{id}/decline (to implement)

**Features**:
- Permission checks using MODULE-0B roles
- Status validation before transitions
- Audit trail recording (who, when, notes)
- Error handling with proper status codes

---

## Integration Steps

### Step 1: Update Database Schema

Run this SQL in Supabase:

```sql
-- Add quote approval columns
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add status constraint
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'accepted', 'declined'));

-- Add index for pending quotes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);
```

### Step 2: Create API Routes

**app/api/quotes/route.ts**:
```typescript
import { withApiAuth } from '@/MODULE-0A/middleware/api-auth';
import { getQuotesHandler } from '@/MODULE-1C/api/quote-approval-routes';

export const GET = withApiAuth(getQuotesHandler);
```

**app/api/quotes/[quoteId]/approve/route.ts**:
```typescript
import { withApiAuth } from '@/MODULE-0A/middleware/api-auth';
import { approveQuoteHandler } from '@/MODULE-1C/api/quote-approval-routes';

export async function POST(req: Request, { params }: { params: { quoteId: string } }) {
  return withApiAuth((req) => approveQuoteHandler(req, params.quoteId))(req);
}
```

Create similar routes for: submit, reject, accept, decline

### Step 3: Update Quotes Page

**app/app-dashboard/quotes/page.tsx**:
```typescript
'use client';

import { withPageAuth } from '@/MODULE-0A/middleware/page-auth';
import { useQuotes, usePendingQuotes } from '@/MODULE-1C/hooks/use-quote-approval';
import { QuoteStatusBadge } from '@/MODULE-1C/components/quote-status-badge';
import { QuoteApprovalDialog } from '@/MODULE-1C/components/quote-approval-dialog';
import { canPerformAction } from '@/MODULE-1C/types/quote-approval.types';

function QuotesPage() {
  const { data: quotes } = useQuotes();
  const [approvalDialog, setApprovalDialog] = useState({
    open: false,
    quote: null,
    action: null,
  });

  return (
    <div>
      <Table>
        {quotes?.map(quote => (
          <TableRow key={quote.id}>
            <TableCell>{quote.title}</TableCell>
            <TableCell>
              <QuoteStatusBadge status={quote.status} />
            </TableCell>
            <TableCell>
              {canPerformAction(userRole, 'approve', quote.status) && (
                <Button onClick={() => setApprovalDialog({
                  open: true,
                  quote,
                  action: 'approve'
                })}>
                  Approve
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <QuoteApprovalDialog
        {...approvalDialog}
        onOpenChange={(open) => setApprovalDialog(prev => ({ ...prev, open }))}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

export default withPageAuth(QuotesPage);
```

### Step 4: Add Manager Dashboard Widget

**app/app-dashboard/page.tsx**:
```typescript
import { usePendingQuotes } from '@/MODULE-1C/hooks/use-quote-approval';

function Dashboard() {
  const { data: pendingQuotes } = usePendingQuotes();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {pendingQuotes?.length || 0}
        </div>
        <p className="text-sm text-muted-foreground">
          quotes awaiting approval
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## Testing Checklist

### Database Tests
- [ ] quotes table has status column
- [ ] quotes table has approval columns
- [ ] Status constraint allows only valid values
- [ ] Indexes created

### API Tests
- [ ] GET /api/quotes returns quotes
- [ ] POST /api/quotes/{id}/submit works
- [ ] POST /api/quotes/{id}/approve works (managers only)
- [ ] POST /api/quotes/{id}/reject works (managers only)
- [ ] Procurement cannot approve own quotes
- [ ] Status transitions validated

### UI Tests
- [ ] Quote status badge displays correctly
- [ ] Approval dialog opens
- [ ] Approval requires notes
- [ ] Rejection requires reason
- [ ] Success notification shown
- [ ] Quote list refreshes after action

### Workflow Tests
- [ ] Draft → Pending transition works
- [ ] Pending → Approved transition works
- [ ] Pending → Rejected transition works
- [ ] Approved → Accepted transition works
- [ ] Invalid transitions blocked

---

## Dependencies

### Required:
- ✅ MODULE-0A: Auth enforcement
- ✅ MODULE-0B: RBAC roles (Manager, Procurement permissions)
- ✅ quotes table in database
- ✅ React Query
- ✅ shadcn/ui components

### Optional:
- Email notification service
- Real-time updates (Supabase subscriptions)

---

## Summary

**MODULE-1C Status**: ✅ **SKELETON COMPLETE**

- **Types**: Complete workflow state machine
- **Components**: Production-ready UI
- **Hooks**: Structure complete, needs API integration
- **API**: Structure complete, needs Supabase queries

**Files**: 6 files, ~1,400 lines total
**Estimated Integration Time**: 4-5 hours
**Complexity**: Medium
**Resumable**: Yes

**Ready for**: Integration with quotes page and database
