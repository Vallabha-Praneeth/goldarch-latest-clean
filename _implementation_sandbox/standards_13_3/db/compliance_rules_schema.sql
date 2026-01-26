-- Admin-managed compliance rules (V0)
-- Informational/approximate use only; do not store copyrighted standards text.

create table if not exists compliance_rules (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id text not null,
  item_category text not null,
  rule_version text not null,
  rule_json jsonb not null,
  is_active boolean not null default true,
  updated_by text null,
  updated_at timestamptz not null default now()
);

create index if not exists compliance_rules_lookup
  on compliance_rules (jurisdiction_id, item_category, is_active);

create table if not exists compliance_audit_log (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references compliance_rules(id),
  action text not null, -- create/update/deactivate
  reason text null,
  actor text null,
  created_at timestamptz not null default now(),
  before_json jsonb null,
  after_json jsonb null
);
