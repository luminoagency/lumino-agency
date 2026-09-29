-- ═══════════════════════════════════════════════════════════════════════════
-- 0035 — L'Archivio: il posto dove si butta dentro, e che l'AI sa leggere
--
-- Non è un doppione delle Risorse. Le Risorse sono materiale **da mostrare a un
-- cliente** — listino, manuale, demo — e le aggiunge solo l'admin. Qui dentro ci
-- va tutto il resto: il PDF che ha mandato un fornitore, lo screenshot di una
-- chat, la foto di un menù storto, la nota scritta in macchina, la vocale detta
-- mentre si esce da un locale. Roba che oggi resta nel telefono di chi l'ha
-- presa, e che nessuno rilegge mai.
--
-- La cosa che rende l'Archivio diverso da una cartella è la colonna `testo`: il
-- browser estrae il testo al caricamento (dai PDF, dalle immagini con l'OCR,
-- dalle vocali col dettato), e da lì in poi quel materiale è **cercabile e
-- analizzabile** come se fosse stato scritto a mano. Una foto di un menù
-- diventa una fonte di prezzi; una vocale diventa un'obiezione citabile.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists staff_archive (
  id           uuid primary key default gen_random_uuid(),

  -- Il genere della cosa, non il suo mime. Serve all'icona e ai filtri, e resta
  -- leggibile fra due anni: `immagine` dice cos'è, `image/webp` dice com'è
  -- codificata.
  kind         text not null check (kind in ('pdf', 'immagine', 'nota', 'vocale', 'link', 'testo')),

  titolo       text not null,
  -- La nota di chi carica: perché questa cosa è qui. È il campo che distingue
  -- un archivio da una cartella di file con nomi tipo IMG_4471.
  nota         text,

  -- Il file nostro, oppure il link di qualcun altro. Come nelle Risorse, non si
  -- conserva mai un indirizzo firmato: la firma scade.
  file_path    text,
  file_url     text,
  mime         text,
  dimensione   bigint,

  -- Il testo estratto, e **da dove viene**. Tre stati e non un booleano: una
  -- trascrizione automatica e una corretta a mano valgono diversamente quando
  -- l'AI ci costruisce sopra un'analisi, e chi legge la citazione ha il diritto
  -- di sapere se quella frase l'ha scritta una persona o un OCR.
  testo        text,
  testo_stato  text not null default 'assente'
               check (testo_stato in ('assente', 'automatico', 'corretto')),

  -- Da dove arriva («telefonata», «sopralluogo», «WhatsApp», «fiera»): non un
  -- elenco chiuso, perché il giorno che serve «cartello sulla vetrina» nessuno
  -- ha voglia di fare una migration.
  fonte        text,
  tags         text[] not null default '{}',

  -- **Il cliente è facoltativo, ed è il punto.** Le altre tabelle dell'area
  -- girano tutte intorno a un cliente; qui la maggior parte del materiale non
  -- riguarda nessuno in particolare — un'idea, un articolo, la foto di un locale
  -- che non è ancora un cliente. Obbligare a sceglierne uno vorrebbe dire non
  -- caricare niente.
  client_id    uuid references staff_clients (id) on delete set null,

  -- Quando è **successo**, che non è quando è stato caricato: la foto la si
  -- carica la sera, la visita era la mattina. Senza questa colonna l'archivio
  -- ordina per il momento in cui qualcuno ha trovato il tempo.
  avvenuto_il  date,

  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  is_demo      boolean not null default false,

  -- Una voce si apre: o ha un file, o ha un link, o ha qualcosa scritto dentro.
  -- Un titolo e basta è una riga in elenco che non porta da nessuna parte.
  constraint staff_archive_ha_qualcosa
    check (file_path is not null or file_url is not null or nota is not null or testo is not null)
);

-- ---------------------------------------------------------------------------
-- La ricerca
-- ---------------------------------------------------------------------------
-- Colonna generata e non trigger: il tsvector non può restare indietro rispetto
-- alla riga, perché Postgres lo ricalcola nella stessa transazione che la
-- scrive. Con un trigger, un `update` fatto da un'altra strada — una correzione
-- del testo via SQL, una migration futura — lascerebbe l'indice a raccontare la
-- versione vecchia, ed è il tipo di bug che si scopre quando una ricerca non
-- trova una cosa che c'è.
--
-- I pesi non sono decorativi: A al titolo, B ai tag e alla fonte, C alla nota
-- scritta a mano, D al testo estratto. Cercando «menù» una voce che si *chiama*
-- «Menù del Bacaro» deve venire prima di un PDF di trenta pagine in cui la
-- parola compare a pagina 12. E il testo automatico pesa meno del resto perché
-- è il pezzo che un OCR può aver sbagliato.
--
-- `italian` e non `simple`: senza lo stemming «ristoranti» non trova
-- «ristorante», che è metà delle ricerche che si faranno qui dentro.
--
-- I tag passano invece da `array_to_tsvector`, che li prende **così come sono**
-- senza stemming. Non è una preferenza: `array_to_string` è `stable` e non
-- `immutable` — dipende dalla funzione di output del tipo — e una colonna
-- generata pretende funzioni immutabili, quindi Postgres rifiuta la tabella
-- intera. Il prezzo è che un tag `prezzi` non esce cercando «prezzo», e si paga
-- volentieri: i tag hanno un filtro dedicato lì accanto, e le stesse parole
-- stanno quasi sempre anche nel titolo o nella nota, che invece sono stemmati.
-- Per questo l'interfaccia salva i tag **già in minuscolo**: senza stemming,
-- `Prezzi` e `prezzi` sarebbero due lessemi diversi.
alter table staff_archive drop column if exists ricerca;
alter table staff_archive add column ricerca tsvector
  generated always as (
    setweight(to_tsvector('italian', coalesce(titolo, '')), 'A') ||
    setweight(array_to_tsvector(tags), 'B') ||
    setweight(to_tsvector('italian', coalesce(fonte, '')), 'B') ||
    setweight(to_tsvector('italian', coalesce(nota, '')), 'C') ||
    setweight(to_tsvector('italian', coalesce(testo, '')), 'D')
  ) stored;

create index if not exists idx_staff_archive_ricerca on staff_archive using gin (ricerca);
-- I tag si filtrano per contenimento (`tags @> '{prezzi}'`): serve un GIN, un
-- btree su un array non lo sa fare.
create index if not exists idx_staff_archive_tags    on staff_archive using gin (tags);
create index if not exists idx_staff_archive_data    on staff_archive (created_at desc);
create index if not exists idx_staff_archive_cliente on staff_archive (client_id) where client_id is not null;
create index if not exists idx_staff_archive_demo    on staff_archive (id) where is_demo;

-- ---------------------------------------------------------------------------
-- Chi può cosa
-- ---------------------------------------------------------------------------
-- **Tutti leggono tutto.** È diverso dai clienti, dove ognuno vede i propri, ed
-- è voluto: un archivio in cui ognuno vede solo quello che ha caricato lui è
-- nove cartelle separate, cioè esattamente la situazione da cui si parte. Il
-- valore dell'archivio è che la nota presa da un collega sei mesi fa esca da una
-- ricerca fatta da un altro.
--
-- In scrittura vale la regola del resto dell'area: si scrive il proprio,
-- l'admin scrive tutto. `with check` sull'insert perché la RLS guarda la riga
-- che entra: senza, `created_by` sarebbe un campo libero e si potrebbe
-- intestare a un collega una nota che non ha mai preso.
alter table staff_archive enable row level security;

drop policy if exists staff_archive_select on staff_archive;
create policy staff_archive_select on staff_archive
  for select to authenticated
  using (public.is_staff());

drop policy if exists staff_archive_insert on staff_archive;
create policy staff_archive_insert on staff_archive
  for insert to authenticated
  with check (public.is_staff() and (created_by = auth.uid() or public.is_staff_admin()));

drop policy if exists staff_archive_update on staff_archive;
create policy staff_archive_update on staff_archive
  for update to authenticated
  using (public.is_staff_admin() or created_by = auth.uid())
  with check (public.is_staff_admin() or created_by = auth.uid());

drop policy if exists staff_archive_delete on staff_archive;
create policy staff_archive_delete on staff_archive
  for delete to authenticated
  using (public.is_staff_admin() or created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Note per chi aprirà la tabella fra un anno senza il codice davanti
-- ---------------------------------------------------------------------------
comment on table  staff_archive is 'Materiale grezzo di qualunque genere, anche senza cliente: PDF, foto, note, vocali, link. Il testo estratto lo rende cercabile e analizzabile dal Lab AI.';
comment on column staff_archive.testo       is 'Testo estratto dal browser al caricamento (PDF, OCR, dettato) e correggibile a mano. È la colonna che il Lab AI legge.';
comment on column staff_archive.testo_stato is 'assente | automatico (estratto e mai riletto) | corretto (una persona ci ha messo mano).';
comment on column staff_archive.avvenuto_il is 'Quando è successo, non quando è stato caricato.';
comment on column staff_archive.file_path   is 'Percorso dentro il bucket privato staff-archive. Mai un URL: la firma scade.';
