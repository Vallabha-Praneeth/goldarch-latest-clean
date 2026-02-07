-- Module H: Category Owners
CREATE TABLE IF NOT EXISTS sandbox_category_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  owner_user_id UUID REFERENCES profiles(id),
  backup_user_id UUID REFERENCES profiles(id),
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_cat_owners_category ON sandbox_category_owners(category_id);
