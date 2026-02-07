-- Module B: Invoices
CREATE TABLE IF NOT EXISTS sandbox_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES sandbox_contracts(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES sandbox_payment_milestones(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  amount_due DECIMAL(12,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')),
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_terms TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_invoices_project ON sandbox_invoices(project_id);
CREATE INDEX idx_sandbox_invoices_status ON sandbox_invoices(status);
CREATE INDEX idx_sandbox_invoices_number ON sandbox_invoices(invoice_number);
