/**
 * ZOD VALIDATION SCHEMAS: Contracts
 * Module A - READY FOR INTEGRATION
 *
 * Copy to: lib/validation/contracts.ts
 */

import { z } from 'zod';

// ============================================================================
// Contract Schemas
// ============================================================================

export const contractSchema = z.object({
  quote_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  total_value: z.number().positive('Value must be positive').optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
  terms_and_conditions: z.string().optional(),
  effective_date: z.string().datetime().optional(),
  expiration_date: z.string().datetime().optional(),
});

export const updateContractSchema = contractSchema.partial();

export const contractStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'signed',
  'active',
  'completed',
  'cancelled',
]);

// ============================================================================
// Checkpoint Schemas
// ============================================================================

export const checkpointSchema = z.object({
  checkpoint_name: z.string().min(1, 'Checkpoint name is required'),
  checkpoint_order: z.number().int().positive(),
  required_role: z.enum(['owner', 'admin', 'procurement', 'manager']).optional(),
  notes: z.string().optional(),
});

export const approveCheckpointSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  rejected_reason: z.string().optional(),
});

// ============================================================================
// E-sign Schemas
// ============================================================================

export const esignRequestSchema = z.object({
  signers: z.array(z.object({
    email: z.string().email('Invalid email'),
    name: z.string().optional(),
    role: z.enum(['client', 'contractor', 'witness', 'approver']).optional(),
  })).min(1, 'At least one signer required'),
  provider: z.enum(['docusign', 'hellosign', 'adobe_sign']).optional(),
  message: z.string().optional(),
});

// ============================================================================
// Query Filters
// ============================================================================

export const contractFiltersSchema = z.object({
  status: contractStatusSchema.optional(),
  project_id: z.string().uuid().optional(),
  quote_id: z.string().uuid().optional(),
  search: z.string().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ContractInput = z.infer<typeof contractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractStatus = z.infer<typeof contractStatusSchema>;
export type CheckpointInput = z.infer<typeof checkpointSchema>;
export type ApproveCheckpointInput = z.infer<typeof approveCheckpointSchema>;
export type EsignRequestInput = z.infer<typeof esignRequestSchema>;
export type ContractFilters = z.infer<typeof contractFiltersSchema>;
