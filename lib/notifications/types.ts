/**
 * Quote Workflow Notification Types
 * MODULE-1C Integration
 */

export type QuoteNotificationType =
  | 'quote_submitted'
  | 'quote_approved'
  | 'quote_rejected'
  | 'quote_accepted'
  | 'quote_declined';

export interface QuoteNotificationData {
  type: QuoteNotificationType;
  quoteId: string;
  quoteNumber: string;
  title?: string;
  total?: number;
  currency?: string;
  recipientEmail: string;
  recipientName: string;
  actorName?: string;
  notes?: string;
  reason?: string;
}

export interface NotificationResult {
  success: boolean;
  emailId?: string;
  error?: string;
  skipped?: boolean;
}

export interface NotificationConfig {
  enabled: boolean;
  fromAddress: string;
  fromName: string;
  baseUrl: string;
}
