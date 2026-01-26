-- MODULE-1C: Quote Approval Workflow
-- Add approval columns to quotes table
-- Migration: add_quote_approval_columns.sql
-- Date: January 14, 2026

-- Add status column (default: draft)
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'accepted', 'declined'));

-- Add submission tracking
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Add approval tracking
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Add rejection tracking
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Add index for pending approvals
CREATE INDEX IF NOT EXISTS idx_quotes_pending ON quotes(status) WHERE status = 'pending';

-- Add index for approval lookups
CREATE INDEX IF NOT EXISTS idx_quotes_approved_by ON quotes(approved_by);
CREATE INDEX IF NOT EXISTS idx_quotes_rejected_by ON quotes(rejected_by);

-- Add comment
COMMENT ON COLUMN quotes.status IS 'Quote approval status: draft → pending → approved/rejected → accepted/declined';
COMMENT ON COLUMN quotes.approved_by IS 'User ID who approved the quote (Manager or Admin)';
COMMENT ON COLUMN quotes.rejected_by IS 'User ID who rejected the quote (Manager or Admin)';
