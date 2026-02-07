-- Module G: Timeline Tasks
CREATE TABLE IF NOT EXISTS sandbox_timeline_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  task_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,
  percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
  assigned_to UUID REFERENCES profiles(id),
  parent_task_id UUID REFERENCES sandbox_timeline_tasks(id),
  display_order INTEGER DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_tasks_project ON sandbox_timeline_tasks(project_id);
CREATE INDEX idx_sandbox_tasks_parent ON sandbox_timeline_tasks(parent_task_id);
