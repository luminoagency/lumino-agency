-- ═══════════════════════════════════════════════════════════════════════════
-- 0036 — Le foto non hanno testo, e un cliente si può cancellare davvero
--
-- Due cose senza niente in comune tranne il giorno in cui sono state trovate.
--
-- 1. **L'OCR delle immagini se ne va.** L'Archivio faceva girare `tesseract`
--    su ogni foto caricata e salvava quello che ne usciva. Su una foto di un
--    menù scritto a mano, su uno screenshot compresso o su una vetrina ripresa
--    di sbieco quello che ne esce non è un testo sbagliato: sono righe di
--    caratteri che non sono parole. E quelle righe finivano nella `ricerca`
--    (la tsvector generata, 0035), cioè sporcavano la ricerca di *tutto*
--    l'archivio, e arrivavano al Lab AI come se fossero contenuto.
--    Da qui in poi una foto si guarda: l'interfaccia ne mostra l'anteprima, e
--    quello che c'è da dire sta nella nota, che è indicizzata come il testo.
--
-- 2. **La cancellazione di un cliente, verificata.** Le `on delete cascade`
--    c'erano già tutte; qui si ri-affermano in un blocco che si può rileggere,
--    perché una cascade che manca non dà errore — dà un cliente che non si
--    cancella e nessuno che sappia perché.
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- 1. Il testo estratto dalle foto già caricate
-- ---------------------------------------------------------------------------

-- Prima il caso di confine: una voce immagine che *non* ha né file né link né
-- nota, e sta in piedi solo grazie al testo. Svuotarle il testo violerebbe
-- `staff_archive_ha_qualcosa`, cioè la migration fallirebbe a metà. Quel testo
-- si sposta nella nota: è il posto dove va la descrizione di una foto, ed è
-- comunque indicizzato.
update staff_archive
   set nota = left(testo, 2000)
 where (mime like 'image/%' or kind = 'immagine')
   and testo is not null
   and nota is null
   and file_path is null
   and file_url is null;

update staff_archive
   set testo = null,
       testo_stato = 'assente'
 where (mime like 'image/%' or kind = 'immagine')
   and testo is not null;

-- E perché non torni. Il controllo vive nel server action e nel browser, ma
-- quelli si possono aggirare con una richiesta scritta a mano: questo no.
alter table staff_archive drop constraint if exists staff_archive_foto_senza_testo;
alter table staff_archive add constraint staff_archive_foto_senza_testo
  check (kind <> 'immagine' or testo is null);

-- ---------------------------------------------------------------------------
-- 2. Cancellare un cliente
-- ---------------------------------------------------------------------------

-- Le tabelle che *sono* il cliente: senza di lui non vogliono dire niente, e
-- se ne vanno con lui in una transazione sola. `confdeltype` è la lettera che
-- Postgres tiene nel catalogo: 'c' è cascade, 'n' è set null, 'a' è niente —
-- ed è 'a' il valore che lascerebbe la delete a fallire con un errore di
-- chiave esterna, cioè il modo in cui questa cosa si rompe in silenzio.
do $$
declare
  t text;
  nome text;
begin
  foreach t in array array[
    'staff_deals', 'staff_subscriptions', 'staff_projects',
    'staff_activities', 'staff_followups', 'staff_field_reports'
  ]
  loop
    select c.conname into nome
      from pg_constraint c
      join lateral unnest(c.conkey) k(attnum) on true
      join pg_attribute a
        on a.attrelid = c.conrelid and a.attnum = k.attnum
     where c.contype = 'f'
       and c.conrelid = ('public.' || t)::regclass
       and c.confrelid = 'public.staff_clients'::regclass
       and a.attname = 'client_id'
       and c.confdeltype <> 'c';

    if nome is not null then
      raise notice 'FK % su %: non era cascade, la rifaccio', nome, t;
      execute format('alter table %I drop constraint %I', t, nome);
      execute format(
        'alter table %I add constraint %I
           foreign key (client_id) references staff_clients (id) on delete cascade',
        t, t || '_client_id_fkey');
    end if;
    nome := null;
  end loop;
end $$;

-- L'archivio **non** è in quell'elenco, ed è una scelta. Il suo `client_id` è
-- `on delete set null`: il PDF di un fornitore o la foto di un menù restano
-- materiale buono anche quando il locale non è più un cliente, e la ricerca e
-- il Lab AI continuano a leggerli. Si stacca il nome, non si brucia la roba.
-- Chi vuole via anche quelle le cancella dall'Archivio, dove si vede cosa si
-- sta buttando. Qui si ri-afferma solo che è `set null` e non `no action`,
-- che è il valore che bloccherebbe la cancellazione del cliente.
do $$
declare nome text;
begin
  select c.conname into nome
    from pg_constraint c
   where c.contype = 'f'
     and c.conrelid = 'public.staff_archive'::regclass
     and c.confrelid = 'public.staff_clients'::regclass
     and c.confdeltype not in ('n', 'c');

  if nome is not null then
    execute format('alter table staff_archive drop constraint %I', nome);
    alter table staff_archive add constraint staff_archive_client_id_fkey
      foreign key (client_id) references staff_clients (id) on delete set null;
  end if;
end $$;

-- La policy di delete resta dell'admin: uno storico perso non torna, e un
-- venditore che sbaglia cliente non deve poter cancellare il lavoro di un
-- collega. Si ri-scrive qui perché chi legge questa migration cercando «perché
-- non riesco a cancellare» la trovi, invece di dover risalire alla 0030.
drop policy if exists staff_clients_delete on staff_clients;
create policy staff_clients_delete on staff_clients
  for delete to authenticated
  using (public.is_staff_admin());

-- Il controllo, in una riga sola: la Management API restituisce solo il
-- risultato dell'ultima istruzione del file.
select
  (select count(*) from staff_archive
    where kind = 'immagine' and testo is not null)              as foto_con_testo_rimaste,
  (select count(*) from pg_constraint
    where contype = 'f' and confrelid = 'public.staff_clients'::regclass
      and confdeltype = 'c')                                    as fk_in_cascade,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'staff_clients'
      and cmd = 'DELETE')                                       as policy_delete;
