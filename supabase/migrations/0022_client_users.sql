-- Layer 5 — Dashboard cliente: utenti, sessioni, messaggi, draft.
-- NB: applicare manualmente. NON eseguita automaticamente.

CREATE TABLE IF NOT EXISTS lab_client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES lab_projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('owner', 'staff')) DEFAULT 'owner',
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  notify_new_messages BOOLEAN DEFAULT true,
  notify_billing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_users_email ON lab_client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_project ON lab_client_users(project_id);

CREATE TABLE IF NOT EXISTS lab_client_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES lab_client_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON lab_client_sessions(token_hash);

CREATE TABLE IF NOT EXISTS lab_project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES lab_projects(id) ON DELETE CASCADE,
  message_type TEXT CHECK (message_type IN ('contact', 'booking', 'quote', 'other')) DEFAULT 'contact',
  status TEXT CHECK (status IN ('new', 'read', 'replied', 'archived')) DEFAULT 'new',
  from_name TEXT,
  from_email TEXT,
  from_phone TEXT,
  subject TEXT,
  message_body TEXT,
  extra_data JSONB,
  page_slug TEXT,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_project ON lab_project_messages(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON lab_project_messages(status);

ALTER TABLE lab_projects
  ADD COLUMN IF NOT EXISTS client_draft JSONB,
  ADD COLUMN IF NOT EXISTS client_draft_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_last_publish_at TIMESTAMPTZ;
