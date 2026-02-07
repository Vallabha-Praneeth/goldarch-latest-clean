-- Module D: Document Version History
CREATE TABLE IF NOT EXISTS sandbox_kb_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES sandbox_kb_documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT
);
CREATE INDEX idx_sandbox_kb_versions_doc ON sandbox_kb_document_versions(document_id);
