-- Migration: Create projects table
-- Required for MODULE-1C E2E tests (projects-crud.spec.ts)

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  client_email TEXT,
  location TEXT,
  budget NUMERIC(12, 2),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed', 'archived')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on org_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_projects_updated_at ON projects;
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Disable RLS for local dev/testing (following seed.sql pattern)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE projects IS 'Projects table for tracking client projects and their status';
