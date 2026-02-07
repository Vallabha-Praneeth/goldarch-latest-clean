-- Module G: Task Dependencies
CREATE TABLE IF NOT EXISTS sandbox_task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES sandbox_timeline_tasks(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES sandbox_timeline_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'FS' CHECK (dependency_type IN ('FS', 'SS', 'FF', 'SF')),
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(predecessor_id, successor_id)
);
CREATE INDEX idx_sandbox_deps_predecessor ON sandbox_task_dependencies(predecessor_id);
CREATE INDEX idx_sandbox_deps_successor ON sandbox_task_dependencies(successor_id);
