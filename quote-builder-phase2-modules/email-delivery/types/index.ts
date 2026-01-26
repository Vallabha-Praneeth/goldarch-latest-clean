/**
 * Email Delivery Module - Type Definitions
 * Phase 2 - Modular Implementation
 */

export interface QuoteEmailData {
  to: string;
  customerName: string;
  quoteNumber: string;
  total: number;
  currency: string;
  validUntil: string;
  pdfAttachment?: Buffer;
  customMessage?: string;
}

export interface EmailConfig {
  fromAddress: string;
  fromName: string;
  replyTo?: string;
  ccAddresses?: string[];
  bccAddresses?: string[];
}

export interface EmailSendResult {
  success: boolean;
  emailId?: string;
  error?: string;
  provider?: 'resend' | 'sendgrid';
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTrackingData {
  quotation_id: string;
  recipient_email: string;
  subject: string;
  sent_at: string;
  provider: string;
  provider_message_id?: string;
  status: 'sent' | 'failed' | 'bounced' | 'delivered';
  error_message?: string;
}
