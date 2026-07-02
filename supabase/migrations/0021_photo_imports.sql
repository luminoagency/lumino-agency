-- Layer 4.7 — Photo Import multi-fonte (hotel). Job di import foto.
-- NB: applicare manualmente. NON eseguita automaticamente.

CREATE TABLE IF NOT EXISTS lab_photo_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES lab_projects(id) ON DELETE CASCADE,

  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')) DEFAULT 'pending',

  source_url TEXT,
  source_type TEXT,
  business_name TEXT,
  business_address TEXT,

  photos_found INT DEFAULT 0,
  photos_imported INT DEFAULT 0,
  photos_skipped INT DEFAULT 0,

  log JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_imports_project ON lab_photo_imports(project_id);
CREATE INDEX IF NOT EXISTS idx_photo_imports_status ON lab_photo_imports(status);
