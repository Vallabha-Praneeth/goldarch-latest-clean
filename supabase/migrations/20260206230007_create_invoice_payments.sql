-- Module B: Invoice Payments
CREATE TABLE IF NOT EXISTS sandbox_invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES sandbox_invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'check', 'credit_card', 'cash', 'other')),
  reference_number TEXT,
  payment_date DATE NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_payments_invoice ON sandbox_invoice_payments(invoice_id);
