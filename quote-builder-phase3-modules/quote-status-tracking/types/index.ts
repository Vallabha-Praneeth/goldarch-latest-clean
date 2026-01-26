/**
 * Quote Status Tracking - Type Definitions
 * Phase 3 - Feature 2
 */

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'revised';

export interface QuoteStatusHistory {
  id: string;
  quotation_id: string;
  from_status: QuoteStatus | null;
  to_status: QuoteStatus;
  changed_by?: string;
  changed_at: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface StatusTransition {
  from: QuoteStatus;
  to: QuoteStatus;
  allowedBy: ('system' | 'admin' | 'customer')[];
}

export interface QuoteStatusSummary {
  current_status: QuoteStatus;
  status_history: QuoteStatusHistory[];
  can_transition_to: QuoteStatus[];
}
