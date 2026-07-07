-- ============================================================
-- 0029 — Policy RLS INSERT su `site_content`
--
-- Contesto: 0007 aveva creato su site_content solo le policy SELECT e UPDATE,
-- ma NON la INSERT. Le server action del pannello usano upsert/update: senza
-- una policy INSERT, l'arm INSERT dell'upsert veniva rifiutato dall'RLS in
-- contesto-utente (i salvataggi da /admin fallivano per tutti gli owner).
--
-- Questa policy è già stata applicata a mano sul DB di produzione; la migration
-- la TRACCIA per la ricreazione del DB da zero.
--
-- Nota: con il fix applicativo (upsert→update in app/admin/actions/site.ts) il
-- percorso normale usa la policy UPDATE; questa INSERT è difesa-in-profondità
-- e serve per eventuali upsert legittimi su righe non ancora esistenti.
--
-- Idempotente: DROP POLICY IF EXISTS + CREATE.
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "owner can insert own site content" ON site_content;
CREATE POLICY "owner can insert own site content"
  ON site_content FOR INSERT
  WITH CHECK (is_site_owner(site_id));

COMMIT;
