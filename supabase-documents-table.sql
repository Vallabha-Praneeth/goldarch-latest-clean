-- ============================================
-- DOCUMENTS TABLE FOR GOLD.ARCH CRM
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DOCUMENTS TABLE
-- Store all document types: quotes, invoices, contracts, proposals, etc.
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    document_type TEXT NOT NULL DEFAULT 'other', -- 'quote', 'invoice', 'contract', 'proposal', 'purchase_order', 'receipt', 'other'
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    user_id UUID,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_supplier ON documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_deal ON documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for access (adjust based on your auth requirements)
CREATE POLICY "Allow all access to documents" ON documents FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DONE! Documents table is ready
-- ============================================
