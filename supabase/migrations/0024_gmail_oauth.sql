-- ============================================================
-- Migration 0024 — OAuth Gmail (lettura risposte) + email_replies
-- Token salvati cifrati (AES-256-GCM, stessa chiave OUTREACH_SMTP_KEY).
-- Scope minimo: gmail.readonly.
-- ============================================================

BEGIN;

-- 1. Token OAuth Gmail (una riga per casella collegata)
CREATE TABLE IF NOT EXISTS gmail_oauth_tokens (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_email  text NOT NULL UNIQUE,        -- es. 'lumino.studio@gmail.com'
  access_token   text,                        -- cifrato
  refresh_token  text,                        -- cifrato
  expires_at     timestamptz,
  last_sync_at   timestamptz,                 -- ultimo fetch risposte andato a buon fine
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. Risposte ricevute, classificate, con la risposta del bot già pronta
CREATE TABLE IF NOT EXISTS email_replies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_email_id uuid REFERENCES emails_sent (id) ON DELETE SET NULL,
  gmail_message_id  text NOT NULL UNIQUE,
  from_email        text,
  subject           text,
  body              text,
  received_at       timestamptz,
  classification    text CHECK (classification IN
                      ('interested', 'question', 'not_interested', 'out_of_target', 'ambiguous')),
  reply_generated   text,                     -- la risposta che il bot ha generato (nullable)
  reply_status      text NOT NULL DEFAULT 'ready_to_send'
                      CHECK (reply_status IN ('ready_to_send', 'sent', 'discarded')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_replies_status ON email_replies (reply_status);
CREATE INDEX IF NOT EXISTS idx_email_replies_original ON email_replies (original_email_id);

COMMIT;
