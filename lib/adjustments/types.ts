/**
 * Manual Quantity Editing Module - Type Definitions
 * Phase 2 - Modular Implementation
 */

export interface ExtractionAdjustment {
  id?: string;
  job_id: string;
  category: string;
  item_type: string;
  original_quantity: number;
  adjusted_quantity: number;
  reason?: string;
  adjusted_by?: string;
  adjusted_at?: string;
  created_at?: string;
}

export interface AdjustmentRequest {
  category: string;
  itemType: string;
  originalQuantity: number;
  adjustedQuantity: number;
  reason?: string;
}

export interface AdjustmentResponse {
  success: boolean;
  adjustment?: ExtractionAdjustment;
  error?: string;
}

export interface AdjustmentsListResponse {
  success: boolean;
  adjustments: ExtractionAdjustment[];
  error?: string;
}

export interface ExtractedItem {
  category: string;
  itemType: string;
  quantity: number;
  adjustedQuantity?: number;
  hasAdjustment: boolean;
  adjustmentReason?: string;
}

export interface AdjustmentHistory {
  jobId: string;
  adjustments: ExtractionAdjustment[];
  totalAdjustments: number;
}

export const ADJUSTMENT_REASONS = {
  MANUAL_CORRECTION: 'Manual correction based on plan review',
  CUSTOMER_REQUEST: 'Customer requested quantity change',
  MEASUREMENT_ERROR: 'Original measurement/extraction error',
  DESIGN_CHANGE: 'Design or scope change',
  SUPPLIER_RECOMMENDATION: 'Supplier recommended adjustment',
  OTHER: 'Other reason',
} as const;

export type AdjustmentReason = typeof ADJUSTMENT_REASONS[keyof typeof ADJUSTMENT_REASONS];
