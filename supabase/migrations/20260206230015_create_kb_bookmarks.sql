-- Module D: KB Bookmarks
CREATE TABLE IF NOT EXISTS sandbox_kb_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES sandbox_kb_categories(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_kb_bookmarks_category ON sandbox_kb_bookmarks(category_id);
