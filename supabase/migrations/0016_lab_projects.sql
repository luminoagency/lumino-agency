-- ============================================================
-- 0016 — Lumino Lab (Step 0): bacheca progetti.
-- Tabella lab_projects + RLS solo super-admin. Idempotente.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS lab_projects (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name       text NOT NULL,
  business_type       text NOT NULL,
  business_input_mode text,
  business_input_value text,
  status              text NOT NULL DEFAULT 'bozza',
  current_step        int  NOT NULL DEFAULT 1,
  project_data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Vincoli sugli stati (state machine). business_type resta libero ma con default lista app-side.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lab_projects_status_chk') THEN
    ALTER TABLE lab_projects ADD CONSTRAINT lab_projects_status_chk
      CHECK (status IN ('bozza', 'in_costruzione', 'pubblicato'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lab_projects_step_chk') THEN
    ALTER TABLE lab_projects ADD CONSTRAINT lab_projects_step_chk
      CHECK (current_step BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lab_projects_input_mode_chk') THEN
    ALTER TABLE lab_projects ADD CONSTRAINT lab_projects_input_mode_chk
      CHECK (business_input_mode IS NULL OR business_input_mode IN ('url', 'description'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lab_projects_status     ON lab_projects (status);
CREATE INDEX IF NOT EXISTS idx_lab_projects_created_by ON lab_projects (created_by);
CREATE INDEX IF NOT EXISTS idx_lab_projects_updated_at ON lab_projects (updated_at DESC);

ALTER TABLE lab_projects ENABLE ROW LEVEL SECURITY;

-- RLS difensiva: solo il super-admin (per email nel JWT) può leggere/scrivere.
-- Nota: l'app usa il service-role client (bypassa RLS) + gate SUPER_ADMINS,
-- come il resto di /lumino-admin. Questa policy è difesa in profondità.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lab_projects' AND policyname='super admin full access') THEN
    CREATE POLICY "super admin full access"
      ON lab_projects FOR ALL
      USING      ((auth.jwt() ->> 'email') = 'bylumino06@gmail.com')
      WITH CHECK ((auth.jwt() ->> 'email') = 'bylumino06@gmail.com');
  END IF;
END $$;

COMMIT;
