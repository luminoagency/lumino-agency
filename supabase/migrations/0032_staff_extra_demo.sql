-- ═══════════════════════════════════════════════════════════════════════════
-- 0032 — Le modifiche extra entrano nei dati demo
--
-- La 0031 ha messo `is_demo` su sette tabelle. Ne aveva lasciata fuori una:
-- `staff_extra_changes`, perché fino alla F3 nessuna pagina la leggeva.
--
-- Con la F4 la legge «Soldi», che somma gli extra non pagati dentro «da
-- incassare». Senza la colonna succederebbe esattamente il guaio che la 0031
-- descrive per le altre: a interruttore spento gli extra finti resterebbero nel
-- totale vero, perché quella somma non passa dai clienti.
--
-- La colonna non basta però per le sole righe demo: gli extra appesi a un
-- progetto finto vanno **cancellati** col resto del seed, e `on delete cascade`
-- da staff_projects lo fa già. Quindi qui la colonna serve solo a nascondere.
--
-- Il default è `false`: tutto ciò che esiste oggi resta dato vero.
-- ═══════════════════════════════════════════════════════════════════════════

alter table staff_extra_changes add column if not exists is_demo boolean not null default false;

-- Indice parziale, come gli altri della 0031: indicizza le poche righe finte e
-- non tutta la colonna.
create index if not exists idx_staff_extra_demo on staff_extra_changes (id) where is_demo;

-- ═══════════════════════════════════════════════════════════════════════════
-- Indici di lettura per le pagine della F4
--
-- Non sono ottimizzazioni premature: sono le tre colonne su cui Soldi, Progetti
-- e Statistiche ordinano e filtrano a ogni apertura, e senza indice Postgres
-- legge la tabella intera per rispondere. Costano poco perché le tabelle sono
-- piccole, e restano giuste quando non lo saranno più.
-- ═══════════════════════════════════════════════════════════════════════════

-- Soldi: i saldi ancora aperti, in ordine di chiusura.
create index if not exists idx_staff_deals_chiusura on staff_deals (data_chiusura desc nulls last);

-- Progetti: i domini che scadono prima.
create index if not exists idx_staff_projects_dominio on staff_projects (scadenza_dominio)
  where scadenza_dominio is not null;

-- Soldi: gli extra da incassare.
create index if not exists idx_staff_extra_pagato on staff_extra_changes (project_id) where not pagato;
