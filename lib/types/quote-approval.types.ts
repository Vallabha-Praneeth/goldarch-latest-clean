/**
 * MODULE-1C: Quote Approval Workflow
 * File: types/quote-approval.types.ts
 *
 * Purpose: Type definitions for quote approval system
 * Status: COMPLETE - Type definitions ready
 *
 * Defines quote statuses, approval workflows, and related types.
 */

import type { UserRole } from './rbac.types';

// ============================================================================
// QUOTE STATUS
// ============================================================================

/**
 * Quote status workflow:
 * Draft → Pending → Approved/Rejected → Accepted/Declined
 */
export type QuoteStatus =
  | 'draft'           // Being prepared, not yet submitted
  | 'pending'         // Submitted, awaiting approval
  | 'approved'        // Approved by manager/admin
  | 'rejected'        // Rejected by manager/admin
  | 'accepted'        // Approved quote accepted by procurement
  | 'declined';       // Approved quote declined by procurement

/**
 * Display names for quote statuses
 */
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  accepted: 'Accepted',
  declined: 'Declined',
};

/**
 * Color coding for status badges
 */
export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'gray',
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  accepted: 'blue',
  declined: 'orange',
};

// ============================================================================
// APPROVAL ACTIONS
// ============================================================================

/**
 * Actions that can be performed on a quote
 */
export type ApprovalAction =
  | 'submit'          // Submit draft for approval
  | 'approve'         // Approve pending quote
  | 'reject'          // Reject pending quote
  | 'accept'          // Accept approved quote
  | 'decline'         // Decline approved quote
  | 'revise';         // Return to draft for revision

/**
 * Approval decision
 */
export interface ApprovalDecision {
  action: 'approve' | 'reject';
  notes: string;
  approved_by?: string;
  approved_at?: string;
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Quote record from database
 */
export interface Quote {
  id: string;
  supplier_id: string;
  project_id: string | null;
  created_by: string;
  status: QuoteStatus;

  // Quote details
  title: string;
  description: string | null;
  amount: number | null;
  currency: string;
  valid_until: string | null;

  // Approval tracking
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Extended quote with related data
 */
export interface QuoteWithRelations extends Quote {
  supplier?: {
    id: string;
    name: string;
    contact_email: string | null;
  };
  project?: {
    id: string;
    name: string;
  } | null;
  created_by_user?: {
    id: string;
    email: string;
  };
  approved_by_user?: {
    id: string;
    email: string;
  } | null;
  rejected_by_user?: {
    id: string;
    email: string;
  } | null;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to submit quote for approval
 */
export interface SubmitQuoteRequest {
  quote_id: string;
  notes?: string;
}

/**
 * Request to approve quote
 */
export interface ApproveQuoteRequest {
  quote_id: string;
  notes: string;
}

/**
 * Request to reject quote
 */
export interface RejectQuoteRequest {
  quote_id: string;
  reason: string;
}

/**
 * Request to accept approved quote
 */
export interface AcceptQuoteRequest {
  quote_id: string;
  notes?: string;
}

/**
 * Response after approval action
 */
export interface ApprovalActionResponse {
  success: boolean;
  quote: Quote;
  message: string;
  error?: string;
}

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Permissions for quote actions based on role
 */
export interface QuotePermissions {
  canCreate: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canAccept: boolean;
  canDecline: boolean;
  canDelete: boolean;
  canViewAll: boolean;
}

/**
 * Quote permission matrix by role
 */
export const QUOTE_ROLE_PERMISSIONS: Record<UserRole, QuotePermissions> = {
  Admin: {
    canCreate: true,
    canSubmit: true,
    canApprove: true,
    canReject: true,
    canAccept: true,
    canDecline: true,
    canDelete: true,
    canViewAll: true,
  },
  Manager: {
    canCreate: true,
    canSubmit: true,
    canApprove: true,
    canReject: true,
    canAccept: true,
    canDecline: true,
    canDelete: false,
    canViewAll: true,
  },
  Procurement: {
    canCreate: true,
    canSubmit: true,
    canApprove: false,
    canReject: false,
    canAccept: true,
    canDecline: true,
    canDelete: false,
    canViewAll: false, // Only their own quotes
  },
  Viewer: {
    canCreate: false,
    canSubmit: false,
    canApprove: false,
    canReject: false,
    canAccept: false,
    canDecline: false,
    canDelete: false,
    canViewAll: true,
  },
};

// ============================================================================
// WORKFLOW VALIDATION
// ============================================================================

/**
 * Valid state transitions
 */
export const VALID_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['pending'],                      // Can only submit
  pending: ['approved', 'rejected', 'draft'], // Can approve, reject, or revise
  approved: ['accepted', 'declined'],      // Can accept or decline
  rejected: ['draft'],                     // Can revise
  accepted: [],                            // Terminal state
  declined: ['draft'],                     // Can revise
};

/**
 * Actions allowed for each status
 */
export const STATUS_ALLOWED_ACTIONS: Record<QuoteStatus, ApprovalAction[]> = {
  draft: ['submit'],
  pending: ['approve', 'reject', 'revise'],
  approved: ['accept', 'decline'],
  rejected: ['revise'],
  accepted: [],
  declined: ['revise'],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get permissions for a role
 */
export function getQuotePermissions(role: UserRole | null): QuotePermissions {
  if (!role) {
    return {
      canCreate: false,
      canSubmit: false,
      canApprove: false,
      canReject: false,
      canAccept: false,
      canDecline: false,
      canDelete: false,
      canViewAll: false,
    };
  }
  return QUOTE_ROLE_PERMISSIONS[role];
}

/**
 * Check if user can perform action on quote
 */
export function canPerformAction(
  userRole: UserRole | null,
  action: ApprovalAction,
  quoteStatus: QuoteStatus,
  isOwner: boolean = false
): boolean {
  const permissions = getQuotePermissions(userRole);

  // Check if action is allowed for current status
  const allowedActions = STATUS_ALLOWED_ACTIONS[quoteStatus];
  if (!allowedActions.includes(action)) {
    return false;
  }

  // Check role permissions
  switch (action) {
    case 'submit':
      return permissions.canSubmit && isOwner;
    case 'approve':
      return permissions.canApprove;
    case 'reject':
      return permissions.canReject;
    case 'accept':
      return permissions.canAccept && isOwner;
    case 'decline':
      return permissions.canDecline && isOwner;
    case 'revise':
      return permissions.canCreate && isOwner;
    default:
      return false;
  }
}

/**
 * Check if status transition is valid
 */
export function isValidTransition(
  currentStatus: QuoteStatus,
  newStatus: QuoteStatus
): boolean {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get next possible statuses
 */
export function getNextStatuses(currentStatus: QuoteStatus): QuoteStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Get allowed actions for current status
 */
export function getAllowedActions(quoteStatus: QuoteStatus): ApprovalAction[] {
  return STATUS_ALLOWED_ACTIONS[quoteStatus];
}

/**
 * Check if quote is in terminal state
 */
export function isTerminalStatus(status: QuoteStatus): boolean {
  return status === 'accepted';
}

/**
 * Check if quote is pending approval
 */
export function isPendingApproval(status: QuoteStatus): boolean {
  return status === 'pending';
}

/**
 * Check if quote is approved
 */
export function isApproved(status: QuoteStatus): boolean {
  return status === 'approved' || status === 'accepted';
}

/**
 * Check if quote is rejected/declined
 */
export function isRejected(status: QuoteStatus): boolean {
  return status === 'rejected' || status === 'declined';
}

/**
 * Get status badge variant
 */
export function getStatusBadgeVariant(status: QuoteStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'approved':
    case 'accepted':
      return 'default'; // Green
    case 'rejected':
    case 'declined':
      return 'destructive'; // Red
    case 'pending':
      return 'secondary'; // Yellow
    case 'draft':
    default:
      return 'outline'; // Gray
  }
}

/**
 * Format approval status for display
 */
export function formatApprovalStatus(quote: Quote): string {
  if (quote.approved_at && quote.approved_by) {
    return `Approved by ${quote.approved_by} on ${new Date(quote.approved_at).toLocaleDateString()}`;
  }
  if (quote.rejected_at && quote.rejected_by) {
    return `Rejected by ${quote.rejected_by} on ${new Date(quote.rejected_at).toLocaleDateString()}`;
  }
  if (quote.submitted_at) {
    return `Submitted on ${new Date(quote.submitted_at).toLocaleDateString()}`;
  }
  return 'Not submitted';
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Database Schema Required:
 *    ```sql
 *    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
 *    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
 *    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
 *    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
 *    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approval_notes TEXT;
 *    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);
 *    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
 *    ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
 *    ```
 *
 * 2. Usage Examples:
 *    ```typescript
 *    // Check if user can approve
 *    const canApprove = canPerformAction(userRole, 'approve', quote.status, false);
 *
 *    // Get allowed actions for quote
 *    const actions = getAllowedActions(quote.status);
 *
 *    // Check valid transition
 *    const canTransition = isValidTransition(quote.status, 'approved');
 *
 *    // Get permissions for role
 *    const permissions = getQuotePermissions('Manager');
 *    ```
 *
 * 3. Workflow:
 *    - Procurement creates draft quote
 *    - Procurement submits quote (draft → pending)
 *    - Manager/Admin approves or rejects (pending → approved/rejected)
 *    - If approved, procurement accepts or declines (approved → accepted/declined)
 *    - If rejected, procurement can revise (rejected → draft)
 *
 * DEPENDENCIES:
 * - MODULE-0B: UserRole type
 * - quotes table in database
 *
 * TODO (Full Implementation):
 * - Add approval workflow history table
 * - Add email notifications on status changes
 * - Add approval delegation (acting on behalf)
 * - Add bulk approval for multiple quotes
 * - Add approval templates with pre-filled notes
 */
