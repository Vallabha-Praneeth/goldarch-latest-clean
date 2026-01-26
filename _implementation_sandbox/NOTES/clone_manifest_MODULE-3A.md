# Clone Manifest: MODULE-3A (Payment Tracking)

**Module Purpose**: Track payment milestones and schedules
**Implementation Order**: 8th
**Phase**: 3 (Payment Milestones)

---

## Files to Clone

### 1. Projects Page
**Source**: `app/app-dashboard/projects/page.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/app-dashboard/projects/page.tsx`
**Reason**: Understand project display to add payment tracking section
**Will Change**: YES - Will add payment milestones section in detail view
**Will NOT Change**: Project list layout, existing functionality

### 2. Quotes Page (for amount/pricing patterns)
**Source**: `app/app-dashboard/quotes/page.tsx`
**Destination**: `_implementation_sandbox/CLONED/app/app-dashboard/quotes/page.tsx`
**Reason**: Understand how pricing/amounts are displayed
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

**Note**: If already cloned for MODULE-1C, reuse.

### 3. UI Components (Progress, Badge, Checkbox)
**Source**: `components/ui/progress.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/progress.tsx`
**Reason**: Use for payment progress bar
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

**Source**: `components/ui/checkbox.tsx`
**Destination**: `_implementation_sandbox/CLONED/components/ui/checkbox.tsx`
**Reason**: Use for marking milestones as paid
**Will Change**: NO - Reference only
**Will NOT Change**: Everything (read-only reference)

---

## Files NOT to Clone

- Other page files
- Non-project related components
- Deal/supplier pages

---

## What Will Be Created (NEW files)

All new files will be in `_implementation_sandbox/MODULES/MODULE-3A/`:

1. **`components/payment-schedule-form.tsx`**
   - Form to define payment milestones
   - Add milestone button
   - Milestone rows: Name, Amount/%, Due Date, Remove
   - Total validation (must sum to project total)
   - Save button

2. **`components/payment-status-tracker.tsx`**
   - Visual display of payment progress
   - Progress bar showing % paid
   - List of milestones with status
   - Summary: "$X of $Y paid"
   - Overdue indicator

3. **`components/payment-milestone-card.tsx`**
   - Individual milestone display
   - Shows: Name, Amount, Due Date, Status
   - Checkbox to mark as paid (admin only)
   - Date picker for payment date
   - Matches card styling from other modules

4. **`components/add-milestone-dialog.tsx`**
   - Dialog to add new milestone
   - Inputs: Name, Amount, Due Date
   - Auto-calculate remaining amount
   - Validation (can't exceed total)

5. **`api/payment-routes.ts`**
   - GET /api/projects/:id/milestones (list milestones)
   - POST /api/projects/:id/milestones (create milestone)
   - PATCH /api/milestones/:id (update status/payment date)
   - DELETE /api/milestones/:id (delete milestone)
   - Skeleton only (structure, not full implementation)

6. **`hooks/use-payment-milestones.ts`**
   - Custom hook: `usePaymentMilestones(projectId)`
   - Fetches milestones for project
   - Returns: { milestones, totalPaid, percentPaid, overdue }
   - Mutation helpers: addMilestone, markAsPaid, deleteMilestone

7. **`utils/payment-calculations.ts`**
   - Function: `calculatePaymentProgress(milestones)`
   - Function: `validateMilestoneTotal(milestones, projectTotal)`
   - Function: `getOverdueMilestones(milestones)`
   - Pure functions for calculations

8. **`schema/payments.sql`**
   - CREATE TABLE project_milestones
   - Columns: id, project_id, name, amount, due_date, status, paid_date, etc.
   - Indexes for querying

9. **`README.md`**
   - Integration instructions
   - How to add to project detail page
   - Payment workflow explanation
   - Database schema guide
   - Testing scenarios

---

## Integration Strategy

### Projects Page Enhancement:

Assuming project detail view exists (or create one):

```tsx
// In project detail page
<div className="space-y-6">
  {/* Existing project details */}
  <ProjectHeader project={project} />
  <ProjectDescription project={project} />

  {/* NEW: Payment Tracking Section */}
  <Card>
    <CardHeader>
      <CardTitle>Payment Schedule</CardTitle>
    </CardHeader>
    <CardContent>
      <PaymentStatusTracker projectId={project.id} />

      {/* Admin can edit milestones */}
      {isAdmin && (
        <PaymentScheduleForm projectId={project.id} totalAmount={project.total_amount} />
      )}
    </CardContent>
  </Card>
</div>
```

---

## Payment Status Tracker Design

```tsx
// components/payment-status-tracker.tsx
export function PaymentStatusTracker({ projectId, totalAmount }) {
  const { milestones, totalPaid, percentPaid, overdue } = usePaymentMilestones(projectId);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">
            of ${totalAmount.toLocaleString()} paid
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{percentPaid}%</p>
          <p className="text-sm text-muted-foreground">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={percentPaid} className="h-2" />

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {overdue.length} payment{overdue.length > 1 ? 's' : ''} overdue
          </AlertDescription>
        </Alert>
      )}

      {/* Milestones List */}
      <div className="space-y-2">
        {milestones?.map((milestone) => (
          <PaymentMilestoneCard
            key={milestone.id}
            milestone={milestone}
            onMarkPaid={handleMarkPaid}
          />
        ))}
      </div>

      {/* Add Milestone Button */}
      {milestones?.length === 0 && (
        <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Milestone
        </Button>
      )}
    </div>
  );
}
```

---

## Milestone Card Design

```tsx
// components/payment-milestone-card.tsx
export function PaymentMilestoneCard({ milestone, onMarkPaid }) {
  const isPaid = milestone.status === 'paid';
  const isOverdue = !isPaid && new Date(milestone.due_date) < new Date();

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${
      isPaid ? 'bg-green-500/5 border-green-500/20' :
      isOverdue ? 'bg-red-500/5 border-red-500/20' :
      'bg-card border-border'
    }`}>
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isPaid}
          onCheckedChange={() => onMarkPaid(milestone.id)}
          disabled={isPaid}
        />
        <div>
          <p className="font-medium">{milestone.name}</p>
          <p className="text-sm text-muted-foreground">
            Due: {new Date(milestone.due_date).toLocaleDateString()}
            {isPaid && milestone.paid_date && (
              <span className="ml-2">
                • Paid: {new Date(milestone.paid_date).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-semibold">${milestone.amount.toLocaleString()}</p>
        {isPaid && (
          <Badge variant="outline" className="bg-green-500/10 text-green-600">
            Paid
          </Badge>
        )}
        {isOverdue && (
          <Badge variant="outline" className="bg-red-500/10 text-red-600">
            Overdue
          </Badge>
        )}
      </div>
    </div>
  );
}
```

---

## Payment Schedule Form Design

```tsx
// components/payment-schedule-form.tsx
export function PaymentScheduleForm({ projectId, totalAmount }) {
  const [milestones, setMilestones] = useState([
    { name: 'Advance', amount: 0, due_date: '' },
  ]);

  const totalAllocated = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const remaining = totalAmount - totalAllocated;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Payment Milestones</Label>
          <p className="text-sm text-muted-foreground">
            Remaining: ${remaining.toLocaleString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMilestones([...milestones, { name: '', amount: 0, due_date: '' }])}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {milestones.map((milestone, index) => (
        <div key={index} className="grid grid-cols-12 gap-3">
          <div className="col-span-5">
            <Input
              placeholder="Milestone name"
              value={milestone.name}
              onChange={(e) => updateMilestone(index, 'name', e.target.value)}
            />
          </div>
          <div className="col-span-3">
            <Input
              type="number"
              placeholder="Amount"
              value={milestone.amount}
              onChange={(e) => updateMilestone(index, 'amount', parseFloat(e.target.value))}
            />
          </div>
          <div className="col-span-3">
            <Input
              type="date"
              value={milestone.due_date}
              onChange={(e) => updateMilestone(index, 'due_date', e.target.value)}
            />
          </div>
          <div className="col-span-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeMilestone(index)}
              disabled={milestones.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {totalAllocated !== totalAmount && (
        <Alert>
          <AlertDescription>
            Total milestones (${totalAllocated.toLocaleString()}) must equal project total (${totalAmount.toLocaleString()})
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={handleSave} disabled={totalAllocated !== totalAmount}>
        Save Payment Schedule
      </Button>
    </div>
  );
}
```

---

## Database Schema

```sql
-- schema/payments.sql
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  paid_date DATE,
  paid_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_milestones_status ON project_milestones(status);
CREATE INDEX idx_milestones_due_date ON project_milestones(due_date);

-- Function to auto-update overdue status
CREATE OR REPLACE FUNCTION update_overdue_milestones()
RETURNS void AS $$
BEGIN
  UPDATE project_milestones
  SET status = 'overdue'
  WHERE status = 'pending'
  AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
```

---

## Verification After Clone

- [ ] projects/page.tsx cloned successfully
- [ ] Can identify where to add payment section
- [ ] Progress, Checkbox components available
- [ ] Quote page amount patterns understood

---

**Status**: Ready for PHASE 3 (cloning)
**Estimated Clone Size**: ~400 lines total
