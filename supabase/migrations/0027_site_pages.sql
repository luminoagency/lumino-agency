-- ============================================================
-- FASE 5B.2 — Siti multi-pagina Pro/Premium
-- Aggiunge site_content.pages (jsonb): config attivazione + label
-- personalizzata delle 6 pagine del sito (home/menu/chiSiamo/
-- contatti/eventi/gallery). NULL = usa i default (vedi lib/sites/pages.ts).
-- Stesso pattern delle altre colonne jsonb esistenti (social_links, faq).
-- ============================================================

BEGIN;

ALTER TABLE site_content
  ADD COLUMN IF NOT EXISTS pages jsonb;

COMMIT;
