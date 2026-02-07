-- Module E: Intake Submissions
CREATE TABLE IF NOT EXISTS sandbox_intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES sandbox_intake_forms(id) ON DELETE CASCADE,
  submission_data JSONB NOT NULL,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'approved', 'rejected', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  submitted_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_submissions_form ON sandbox_intake_submissions(form_id);
CREATE INDEX idx_sandbox_submissions_status ON sandbox_intake_submissions(status);
