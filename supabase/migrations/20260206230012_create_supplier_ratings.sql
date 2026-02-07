-- Module C: Supplier Ratings
CREATE TABLE IF NOT EXISTS sandbox_supplier_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  rating_type TEXT NOT NULL CHECK (rating_type IN ('quality', 'price', 'delivery', 'communication', 'overall')),
  rating_value INTEGER CHECK (rating_value >= 1 AND rating_value <= 5),
  notes TEXT,
  rated_by UUID REFERENCES profiles(id),
  rated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_ratings_supplier ON sandbox_supplier_ratings(supplier_id);
