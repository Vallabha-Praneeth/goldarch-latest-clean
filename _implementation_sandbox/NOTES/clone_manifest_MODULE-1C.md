# Clone Manifest: MODULE-1C (Quote Approval Workflow)

**Module Purpose**: Add Accept/Reject actions to quote management
**Implementation Order**: 6th
**Phase**: 1 (Supplier Management)

---

## Files to Clone

### 1. Quotes Page
**Source**: `app/app-dashboard/quotes/page.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/app-dashboard/quotes/page.tsx`
**Reason**: Need to understand current quote display to add approval UI
**Will Change**: YES - Will add approval buttons and status indicators
**Will NOT Change**: Layout, grid structure, existing functionality

### 2. Supabase Client
**Source**: `lib/supabase-client.ts`
**Destination**: `_implementation_sandbox/CLONED/lib/supabase-client.ts`
**Reason**: Understand query patterns for status updates
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

**Note**: If already cloned for other modules, reuse.

### 3. UI Components (Badge, Dialog, Alert)
**Source**: `components/ui/badge.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/badge.tsx`
**Reason**: Use for status badges (Pending, Accepted, Rejected)
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

**Source**: `components/ui/alert-dialog.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/alert-dialog.tsx`
**Reason**: Confirmation dialog for approval actions
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

---

## Files NOT to Clone

- Other page files
- Non-quote related components
- Supplier/project files

---

## What Will Be Created (NEW files)

All new files will be in `_implementation_sandbox/MODULES/MODULE-1C/`:

1. **`components/quote-approval-dialog.tsx`**
   - AlertDialog for approve/reject confirmation
   - Shows quote details (amount, supplier, etc.)
   - Confirm/Cancel buttons
   - Calls API on confirm

2. **`components/quote-status-badge.tsx`**
   - Status badge component
   - Colors: Pending (yellow), Accepted (green), Rejected (red)
   - Uses shadcn/ui Badge component
   - Matches existing badge styling

3. **`components/quote-approval-buttons.tsx`**
   - Accept/Reject button group
   - Only shows if status is "Pending"
   - Disabled if user lacks permission
   - Triggers approval dialog

4. **`api/quote-approval-routes.ts`**
   - PATCH /api/quotes/:id/status
   - Body: { status: 'accepted' | 'rejected', userId: string }
   - Updates quote status
   - Logs approval action (audit trail)
   - Skeleton only (structure, not full implementation)

5. **`utils/quote-approval-logic.ts`**
   - Function: `canUserApproveQuote(userId, quoteId)`
   - Checks user role/permissions
   - Returns: { canApprove: boolean, reason?: string }

6. **`hooks/use-quote-approval.ts`**
   - Custom hook: `useQuoteApproval(quoteId)`
   - Handles approval mutation
   - Invalidates queries after approval
   - Returns: { approve, reject, isLoading }

7. **`README.md`**
   - Integration instructions
   - How to add to quotes page
   - API implementation guide
   - Database schema requirements (status field)

---

## Integration Strategy

### Current Quote Card (assumed structure):
```tsx
<Card>
  <CardContent>
    <h3>{quote.supplier_name}</h3>
    <p>${quote.amount}</p>
    {/* Details */}
  </CardContent>
</Card>
```

### Enhanced Quote Card (with approval):
```tsx
<Card>
  <CardContent>
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3>{quote.supplier_name}</h3>
        <QuoteStatusBadge status={quote.status} />
      </div>
    </div>

    <p>${quote.amount}</p>
    {/* Details */}

    {/* NEW: Approval Buttons */}
    {quote.status === 'pending' && (
      <QuoteApprovalButtons
        quoteId={quote.id}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    )}
  </CardContent>
</Card>
```

---

## Status Badge Design

```tsx
// components/quote-status-badge.tsx
export function QuoteStatusBadge({ status }: { status: string }) {
  const variants = {
    pending: { className: 'bg-yellow-500/10 text-yellow-600', label: 'Pending' },
    accepted: { className: 'bg-green-500/10 text-green-600', label: 'Accepted' },
    rejected: { className: 'bg-red-500/10 text-red-600', label: 'Rejected' },
  };

  const variant = variants[status] || variants.pending;

  return (
    <Badge className={variant.className}>
      {variant.label}
    </Badge>
  );
}
```

---

## Approval Buttons Design

```tsx
// components/quote-approval-buttons.tsx
export function QuoteApprovalButtons({ quoteId, onApprove, onReject }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  return (
    <>
      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button
          variant="default"
          size="sm"
          onClick={() => { setAction('approve'); setDialogOpen(true); }}
          className="flex-1"
        >
          Accept Quote
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setAction('reject'); setDialogOpen(true); }}
          className="flex-1"
        >
          Reject
        </Button>
      </div>

      <QuoteApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        action={action}
        quoteId={quoteId}
        onConfirm={action === 'approve' ? onApprove : onReject}
      />
    </>
  );
}
```

---

## Approval Dialog Design

```tsx
// components/quote-approval-dialog.tsx
export function QuoteApprovalDialog({ open, onOpenChange, action, quoteId, onConfirm }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === 'approve' ? 'Accept Quote?' : 'Reject Quote?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action === 'approve'
              ? 'This will mark the quote as accepted. Other quotes for this deal may be automatically rejected.'
              : 'This will mark the quote as rejected and notify the supplier.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {action === 'approve' ? 'Accept' : 'Reject'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## Database Requirements

Quotes table needs:
- `status` column (if missing): ENUM('pending', 'accepted', 'rejected')
- `approved_by` column: UUID (user who approved)
- `approved_at` column: TIMESTAMP

Migration (skeleton):
```sql
-- Add status column if not exists
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
```

---

## Verification After Clone

- [ ] quotes/page.tsx cloned successfully
- [ ] Current quote card structure understood
- [ ] Can identify insertion points for approval UI
- [ ] Badge and AlertDialog components available

---

**Status**: Ready for PHASE 3 (cloning)
**Estimated Clone Size**: ~200 lines total
