/**
 * Customer Responses - Type Definitions
 * Phase 3 - Feature 4
 */

export type ResponseType = 'accept' | 'reject' | 'request_changes';

export interface CustomerResponse {
  id: string;
  quotation_id: string;
  response_type: ResponseType;
  customer_name: string;
  customer_email: string;
  signature?: string;
  notes?: string;
  responded_at: string;
  ip_address?: string;
}

export interface ResponseRequest {
  response_type: ResponseType;
  customer_name: string;
  customer_email?: string;
  signature?: string;
  notes?: string;
}
