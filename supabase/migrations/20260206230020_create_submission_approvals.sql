-- Module E: Submission Approvals
CREATE TABLE IF NOT EXISTS sandbox_submission_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES sandbox_intake_submissions(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES sandbox_approval_routing_rules(id),
  approver_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_at TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sandbox_sub_approvals_submission ON sandbox_submission_approvals(submission_id);
