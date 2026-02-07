-- Module D: KB Categories
CREATE TABLE IF NOT EXISTS sandbox_kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES sandbox_kb_categories(id) ON DELETE CASCADE,
  icon_name TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_kb_categories_parent ON sandbox_kb_categories(parent_id);
