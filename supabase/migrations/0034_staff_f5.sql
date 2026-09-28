-- ═══════════════════════════════════════════════════════════════════════════
-- 0034 — F5: il laboratorio e il materiale
--
-- Nessuna tabella nuova. `staff_ai_insights` e `staff_resources` esistono dalla
-- 0030: qui si aggiunge quello che serve a usarle davvero, e si cambia **una**
-- policy, che è la parte di questo file che vale la pena leggere.
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------------------
-- 1. Gli insight: chi li ha salvati, e i dati finti
-- ---------------------------------------------------------------------------
-- `created_by` non è un dato di servizio. Un insight è una frase in italiano
-- («i ristoranti senza sito chiudono al 40%, i bar al 12%») e una frase senza
-- autore, in un elenco che cresce, diventa in sei mesi un elenco di affermazioni
-- di cui nessuno risponde. Con l'autore si sa a chi chiedere su quali dati era
-- stata fatta.
--
-- `on delete set null` e non `cascade`: un venditore che lascia l'azienda non
-- deve portarsi via quello che ha capito. Resta l'insight, si perde il nome.
alter table staff_ai_insights add column if not exists created_by uuid
  references auth.users (id) on delete set null;
alter table staff_ai_insights add column if not exists is_demo boolean not null default false;

create index if not exists idx_staff_insights_demo on staff_ai_insights (id) where is_demo;
create index if not exists idx_staff_insights_data on staff_ai_insights (created_at desc);

-- ---------------------------------------------------------------------------
-- 2. LA policy che cambia: salvare un insight non è un atto da amministratore
-- ---------------------------------------------------------------------------
-- La 0030 dava `for all` sugli insight al solo admin. Era coerente con l'idea
-- che gli insight li generasse un processo notturno, ma in F5 li salva **chi sta
-- parlando col Lab**: con quella policy un venditore poteva fare la domanda,
-- leggere la risposta e non poterla tenere. Cioè la funzione non esisteva per
-- otto persone su nove.
--
-- La regola nuova è la stessa del resto dell'area: si scrive ciò che è proprio,
-- l'admin scrive tutto. `with check` sull'insert impedisce di intestare a un
-- collega una frase che non ha mai detto — la RLS controlla la riga che *entra*,
-- non chi la manda, quindi senza questo il campo `created_by` sarebbe un campo
-- libero.
drop policy if exists staff_ai_insights_write on staff_ai_insights;

drop policy if exists staff_ai_insights_insert on staff_ai_insights;
create policy staff_ai_insights_insert on staff_ai_insights
  for insert to authenticated
  with check (public.is_staff() and (created_by = auth.uid() or public.is_staff_admin()));

drop policy if exists staff_ai_insights_update on staff_ai_insights;
create policy staff_ai_insights_update on staff_ai_insights
  for update to authenticated
  using (public.is_staff_admin() or created_by = auth.uid())
  with check (public.is_staff_admin() or created_by = auth.uid());

drop policy if exists staff_ai_insights_delete on staff_ai_insights;
create policy staff_ai_insights_delete on staff_ai_insights
  for delete to authenticated
  using (public.is_staff_admin() or created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Le risorse: un file nostro o un link di qualcun altro
-- ---------------------------------------------------------------------------
-- Due colonne e non una perché sono due cose diverse. `file_path` è un percorso
-- dentro il bucket privato `staff-resources` — stessa scelta di `foto_url` in
-- 0033: l'indirizzo guardabile è una firma che scade, quindi non si conserva.
-- `file_url` (che c'era già) resta il link esterno: il listino condiviso su
-- Drive, un video, la demo di un settore ospitata altrove. Una risorsa ha l'uno
-- **o** l'altro, e il vincolo qui sotto lo impone invece di lasciarlo a un
-- controllo nell'interfaccia — una riga senza né file né link è una voce in
-- elenco che non si apre.
alter table staff_resources add column if not exists descrizione  text;
alter table staff_resources add column if not exists file_path    text;
alter table staff_resources add column if not exists dimensione   bigint;
alter table staff_resources add column if not exists created_by   uuid
  references auth.users (id) on delete set null;
alter table staff_resources add column if not exists is_demo boolean not null default false;

alter table staff_resources drop constraint if exists staff_resources_ha_qualcosa;
alter table staff_resources add  constraint staff_resources_ha_qualcosa
  check (file_path is not null or file_url is not null);

create index if not exists idx_staff_resources_demo on staff_resources (id) where is_demo;
create index if not exists idx_staff_resources_data on staff_resources (created_at desc);

comment on column staff_resources.file_path  is 'Percorso dentro il bucket privato staff-resources, non un URL: la firma scade.';
comment on column staff_resources.file_url   is 'Link esterno, in alternativa a file_path. Una risorsa ha l''uno o l''altro.';
comment on column staff_resources.dimensione is 'Byte del file caricato. Serve a scrivere «2,4 MB» accanto al nome prima di aprirlo con la connessione del telefono.';
