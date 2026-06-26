-- ============================================================
-- Migration 0019 — Persona del bot WhatsApp
-- Ogni numero riceve al primo contatto un nome del team a caso
-- (Matteo, Francesca, Davide, Sara) che resta fisso per sempre.
-- ============================================================

BEGIN;

ALTER TABLE whatsapp_conversations
  ADD COLUMN IF NOT EXISTS bot_persona text;

COMMIT;
