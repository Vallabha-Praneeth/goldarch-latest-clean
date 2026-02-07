-- Module D: KB Documents
CREATE TABLE IF NOT EXISTS sandbox_kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES sandbox_kb_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  content_format TEXT DEFAULT 'markdown' CHECK (content_format IN ('markdown', 'html', 'plain')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_pinned BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  tags TEXT[],
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_kb_docs_category ON sandbox_kb_documents(category_id);
CREATE INDEX idx_sandbox_kb_docs_status ON sandbox_kb_documents(status);
