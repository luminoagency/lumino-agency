-- ═══════════════════════════════════════════════════════════════════════════
-- 0033 — Il profilo diventa una persona
--
-- Tre colonne su staff_profiles. Nessuna tabella nuova, nessuna policy nuova.
--
-- `ruolo_titolo` non è `role`, ed è il motivo per cui sono due colonne.
-- `role` vale 'admin' | 'sales' e decide **cosa si vede**: lo legge la RLS, ha
-- un check constraint, e cambiarlo cambia i permessi. `ruolo_titolo` è il
-- biglietto da visita — «CCO», «Head of Sales» — e non decide niente. Farne una
-- sola colonna vorrebbe dire che rinominare un ruolo in azienda toglie a
-- qualcuno l'accesso ai margini.
--
-- `foto_url` è un **percorso dentro il bucket**, non un URL: `staff-avatars` è
-- privato, quindi l'indirizzo guardabile è una firma che scade in un'ora e non
-- ha senso conservarla. Il nome della colonna resta `foto_url` per coerenza con
-- `staff_field_reports.foto`, che contiene percorsi per la stessa ragione.
--
-- **Niente policy di scrittura in più.** La 0030 dà l'update su staff_profiles
-- al solo admin, e alzare quel cancello per far cambiare la foto a un venditore
-- gli darebbe anche `role` e `obiettivo_mensile`: la RLS decide per righe, non
-- per colonne, quindi «può modificare la propria riga» vuol dire «può
-- promuoversi ad admin». Queste tre colonne le scrive una server action con il
-- service-role su un elenco fisso di campi (`aggiornaProfilo` in
-- lib/staff/actions.ts), che è l'unico modo di limitare la scrittura a una
-- colonna.
-- ═══════════════════════════════════════════════════════════════════════════

alter table staff_profiles add column if not exists ruolo_titolo  text;
alter table staff_profiles add column if not exists saluto_custom text;
alter table staff_profiles add column if not exists foto_url      text;

-- Un titolo vuoto e un titolo assente sono la stessa cosa, e l'interfaccia deve
-- poter controllare `is null` una volta sola invece di tre volte.
alter table staff_profiles drop constraint if exists staff_profiles_ruolo_titolo_non_vuoto;
alter table staff_profiles add  constraint staff_profiles_ruolo_titolo_non_vuoto
  check (ruolo_titolo is null or length(btrim(ruolo_titolo)) > 0);

alter table staff_profiles drop constraint if exists staff_profiles_saluto_non_vuoto;
alter table staff_profiles add  constraint staff_profiles_saluto_non_vuoto
  check (saluto_custom is null or length(btrim(saluto_custom)) > 0);

comment on column staff_profiles.ruolo_titolo  is 'Titolo mostrato nel saluto (CCO, Head of Sales). Non ha effetti sui permessi: quelli stanno in role.';
comment on column staff_profiles.saluto_custom is 'La riga sotto il saluto della home. Se è null si usa una frase in base all''ora.';
comment on column staff_profiles.foto_url      is 'Percorso dentro il bucket privato staff-avatars, non un URL: la firma scade.';
