/**
 * MODULE-1C: Quote Approval Workflow
 * File: components/quote-approval-dialog.tsx
 *
 * Purpose: Dialog for approving/rejecting quotes
 * Status: SKELETON - Structure complete, logic placeholder
 *
 * Allows managers and admins to review and approve/reject quotes.
 */

'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Types
import type { QuoteWithRelations, ApprovalAction } from '../types/quote-approval.types';
import { QuoteStatusBadge } from './quote-status-badge';

// Hooks
import { useApproveQuote, useRejectQuote } from '../hooks/use-quote-approval';

interface QuoteApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuoteWithRelations | null;
  action: ApprovalAction | null; // 'approve' or 'reject'
  onSuccess?: () => void;
}

/**
 * Quote Approval Dialog Component
 *
 * Features:
 * - Shows quote details for review
 * - Approve button with notes field
 * - Reject button with reason field
 * - Validation and error handling
 */
export function QuoteApprovalDialog({
  open,
  onOpenChange,
  quote,
  action,
  onSuccess,
}: QuoteApprovalDialogProps) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Mutations
  const { mutate: approveQuote, isPending: isApproving } = useApproveQuote();
  const { mutate: rejectQuote, isPending: isRejecting } = useRejectQuote();

  const isPending = isApproving || isRejecting;
  const isApprovalAction = action === 'approve';

  // Handle submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!quote) return;

    // Validation
    if (!notes.trim()) {
      setError(isApprovalAction ? 'Please add approval notes' : 'Please provide a rejection reason');
      return;
    }

    if (isApprovalAction) {
      approveQuote(
        {
          quote_id: quote.id,
          notes: notes.trim(),
        },
        {
          onSuccess: () => {
            setNotes('');
            onOpenChange(false);
            onSuccess?.();
          },
          onError: (err: any) => {
            setError(err.message || 'Failed to approve quote');
          },
        }
      );
    } else {
      rejectQuote(
        {
          quote_id: quote.id,
          reason: notes.trim(),
        },
        {
          onSuccess: () => {
            setNotes('');
            onOpenChange(false);
            onSuccess?.();
          },
          onError: (err: any) => {
            setError(err.message || 'Failed to reject quote');
          },
        }
      );
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (isPending) return;
    setNotes('');
    setError(null);
    onOpenChange(false);
  };

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprovalAction ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approve Quote
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Reject Quote
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isApprovalAction
              ? 'Review and approve this quote. Your approval notes will be recorded.'
              : 'Provide a reason for rejecting this quote. This will be visible to the quote creator.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Quote Details */}
            <div className="space-y-3">
              <h3 className="font-medium">Quote Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-muted-foreground">Title</Label>
                  <p className="font-medium">{quote.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Current Status</Label>
                  <div className="mt-1">
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Supplier</Label>
                  <p className="font-medium">{quote.supplier?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-medium">
                    {quote.amount ? `${quote.currency} ${quote.amount.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm">{quote.description || 'No description'}</p>
                </div>
                {quote.created_by_user && (
                  <div>
                    <Label className="text-muted-foreground">Created By</Label>
                    <p className="text-sm">{quote.created_by_user.email}</p>
                  </div>
                )}
                {quote.submitted_at && (
                  <div>
                    <Label className="text-muted-foreground">Submitted</Label>
                    <p className="text-sm">{new Date(quote.submitted_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Notes/Reason Field */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-1">
                {isApprovalAction ? 'Approval Notes' : 'Rejection Reason'}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  isApprovalAction
                    ? 'Add notes about why this quote was approved...'
                    : 'Explain why this quote is being rejected...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                {isApprovalAction
                  ? 'These notes will be recorded for audit purposes'
                  : 'This reason will be shared with the quote creator'}
              </p>
            </div>

            {/* Warning Alert */}
            <Alert variant={isApprovalAction ? 'default' : 'destructive'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {isApprovalAction ? 'Confirm Approval' : 'Confirm Rejection'}
              </AlertTitle>
              <AlertDescription>
                {isApprovalAction
                  ? 'Once approved, the quote creator will be able to accept or decline this quote.'
                  : 'Rejecting this quote will return it to draft status. The creator can revise and resubmit.'}
              </AlertDescription>
            </Alert>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isApprovalAction ? 'default' : 'destructive'}
              disabled={isPending || !notes.trim()}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isApprovalAction ? 'Approving...' : 'Rejecting...'}
                </>
              ) : (
                <>
                  {isApprovalAction ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Quote
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Quote
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Basic Usage:
 *    ```typescript
 *    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
 *    const [selectedQuote, setSelectedQuote] = useState<QuoteWithRelations | null>(null);
 *    const [approvalAction, setApprovalAction] = useState<ApprovalAction | null>(null);
 *
 *    const handleApprove = (quote: QuoteWithRelations) => {
 *      setSelectedQuote(quote);
 *      setApprovalAction('approve');
 *      setApprovalDialogOpen(true);
 *    };
 *
 *    const handleReject = (quote: QuoteWithRelations) => {
 *      setSelectedQuote(quote);
 *      setApprovalAction('reject');
 *      setApprovalDialogOpen(true);
 *    };
 *
 *    <QuoteApprovalDialog
 *      open={approvalDialogOpen}
 *      onOpenChange={setApprovalDialogOpen}
 *      quote={selectedQuote}
 *      action={approvalAction}
 *      onSuccess={() => refetchQuotes()}
 *    />
 *    ```
 *
 * 2. In Quote Table:
 *    ```typescript
 *    <DropdownMenuItem onClick={() => handleApprove(quote)}>
 *      <CheckCircle className="mr-2 h-4 w-4" />
 *      Approve
 *    </DropdownMenuItem>
 *    <DropdownMenuItem onClick={() => handleReject(quote)}>
 *      <XCircle className="mr-2 h-4 w-4" />
 *      Reject
 *    </DropdownMenuItem>
 *    ```
 *
 * 3. Permission Check:
 *    ```typescript
 *    import { canPerformAction } from '@/MODULE-1C/types/quote-approval.types';
 *
 *    const canApprove = canPerformAction(userRole, 'approve', quote.status, false);
 *    const canReject = canPerformAction(userRole, 'reject', quote.status, false);
 *    ```
 *
 * DEPENDENCIES:
 * - shadcn/ui components: Dialog, Button, Textarea, Alert, Label, Separator
 * - MODULE-1C hooks: useApproveQuote, useRejectQuote
 * - MODULE-1C types: QuoteWithRelations, ApprovalAction
 * - MODULE-1C components: QuoteStatusBadge
 *
 * TODO (Full Implementation):
 * - Add approval template selection (pre-filled notes)
 * - Add attachments support
 * - Add approval on behalf of (delegation)
 * - Add bulk approval (multiple quotes)
 * - Add approval history viewer
 * - Add email notification checkbox
 */
