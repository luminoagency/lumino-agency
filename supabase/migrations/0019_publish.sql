-- Layer 4 — Deploy/Publish: colonne stato pubblicazione + tabella snapshot di backup.
-- NB: applicare manualmente. NON eseguita automaticamente.

ALTER TABLE lab_projects
  ADD COLUMN IF NOT EXISTS published_url TEXT,
  ADD COLUMN IF NOT EXISTS vercel_project_id TEXT,
  ADD COLUMN IF NOT EXISTS vercel_deployment_id TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS deployment_history JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS lab_project_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES lab_projects(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_snapshots_project ON lab_project_snapshots(project_id, created_at DESC);
