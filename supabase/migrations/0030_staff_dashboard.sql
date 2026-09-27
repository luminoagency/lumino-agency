-- ============================================================================
-- 0030 — Staff Dashboard (/staff)
--
-- Area interna commerciale: clienti, trattative, abbonamenti, progetti,
-- attività di campo. Piano completo in docs/STAFF_DASHBOARD.md.
--
-- PREFISSO `staff_` su tutto: `clients` esiste già (scraper/outreach) e nomi
-- come `projects`, `activities`, `resources` sarebbero collisioni annunciate.
--
-- Due ruoli, una sola istanza Supabase condivisa con i clienti dei siti
-- generati: chi non ha una riga in staff_profiles non è staff e non vede nulla.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profili staff
--
-- NESSUN trigger su auth.users: la stessa istanza autentica anche i titolari
-- dei ristoranti (site_owners). Un trigger regalerebbe a ognuno di loro un
-- profilo staff. Le righe le inserisce l'admin a mano.
-- ---------------------------------------------------------------------------
create table if not exists staff_profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  nome              text not null,
  email             text,
  telefono          text,
  role              text not null default 'sales' check (role in ('admin', 'sales')),
  attivo            boolean not null default true,
  obiettivo_mensile numeric(10, 2),
  provvigione_pct   numeric(5, 2),
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Funzioni di ruolo
--
-- security definer perché devono leggere staff_profiles SENZA passare dalla
-- sua RLS: una policy che interroga la tabella che sta proteggendo ricorre su
-- se stessa e Postgres la fa fallire.
-- search_path fissato: una funzione definer con search_path libero è
-- dirottabile creando una tabella omonima in uno schema di ricerca.
-- ---------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff_profiles where id = auth.uid() and attivo)
$$;

create or replace function public.is_staff_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff_profiles
    where id = auth.uid() and attivo and role = 'admin'
  )
$$;

-- Il cliente è mio (o sono admin). È il perno di quasi tutte le policy: le
-- tabelle figlie non ripetono la logica, la chiamano.
create or replace function public.staff_owns_client(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff_clients c
    where c.id = target
      and (public.is_staff_admin() or c.assegnato_a = auth.uid())
  )
$$;

revoke all on function public.is_staff() from public;
revoke all on function public.is_staff_admin() from public;
revoke all on function public.staff_owns_client(uuid) from public;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_staff_admin() to authenticated;
grant execute on function public.staff_owns_client(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Clienti
-- ---------------------------------------------------------------------------
create table if not exists staff_clients (
  id                  uuid primary key default gen_random_uuid(),
  nome                text not null,
  settore             text not null default 'altro'
                        check (settore in ('ristorante', 'bar', 'hotel', 'estetista', 'barbiere', 'altro')),
  citta               text,
  zona                text,
  indirizzo           text,
  lat                 double precision,
  lng                 double precision,
  referente           text,
  telefono            text,
  email               text,
  instagram           text,
  sito_attuale        text check (sito_attuale in ('nessuno', 'solo_social', 'vecchio', 'ok')),
  note_sito           text,
  stato               text not null default 'da_contattare'
                        check (stato in ('da_contattare', 'contattato', 'in_trattativa',
                                         'preventivo_inviato', 'accettato', 'rifiutato', 'in_pausa')),
  motivo_rifiuto      text,
  assegnato_a         uuid references staff_profiles (id) on delete set null,

  -- Un solo paese attivo oggi (Italia), ma i campi ci sono da subito: aggiungere
  -- una valuta dopo i primi incassi vuol dire ricalcolare lo storico.
  country             text not null default 'IT',
  currency            text not null default 'EUR' check (currency in ('EUR', 'MAD')),

  -- Campi dell'agent di ricerca, per ora compilati a mano.
  voto_sito           smallint check (voto_sito between 1 and 10),
  problemi_recensioni text,
  prezzo_consigliato  numeric(10, 2),
  fonte               text not null default 'manuale' check (fonte in ('manuale', 'agent')),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Il motivo del rifiuto è obbligatorio, e lo è nel DB e non solo nel form: è
  -- l'unico dato che dice *perché* si perde, ed è quello che si salta sempre.
  constraint staff_clients_motivo_rifiuto check (
    stato <> 'rifiutato' or nullif(btrim(coalesce(motivo_rifiuto, '')), '') is not null
  )
);

create index if not exists idx_staff_clients_stato     on staff_clients (stato);
create index if not exists idx_staff_clients_assegnato on staff_clients (assegnato_a);
create index if not exists idx_staff_clients_settore   on staff_clients (settore);
create index if not exists idx_staff_clients_zona      on staff_clients (citta, zona);

-- ---------------------------------------------------------------------------
-- 4. Trattative, e i margini a parte
-- ---------------------------------------------------------------------------
create table if not exists staff_deals (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references staff_clients (id) on delete cascade,
  pacchetto         text check (pacchetto in ('basic', 'pro', 'premium')),
  prezzo_proposto   numeric(10, 2),
  prezzo_chiuso     numeric(10, 2),
  sconto            numeric(10, 2),
  acconto_30_pagato boolean not null default false,
  acconto_30_data   date,
  saldo_70_pagato   boolean not null default false,
  saldo_70_data     date,
  data_proposta     date not null default current_date,
  data_chiusura     date,
  created_at        timestamptz not null default now()
);

create index if not exists idx_staff_deals_client on staff_deals (client_id);

-- Tabella separata, non colonne su staff_deals: la RLS filtra RIGHE, non
-- colonne, e admin e sales sono entrambi il ruolo Postgres `authenticated`.
-- L'unico modo di non far vedere i margini a un venditore è non dargli la riga.
create table if not exists staff_deal_margins (
  deal_id       uuid primary key references staff_deals (id) on delete cascade,
  costo_interno numeric(10, 2),
  margine       numeric(10, 2),
  note          text,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. Abbonamenti
-- ---------------------------------------------------------------------------
create table if not exists staff_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references staff_clients (id) on delete cascade,
  tipo            text not null default 'manutenzione'
                    check (tipo in ('manutenzione', 'hosting', 'social', 'seo', 'altro')),
  importo_mensile numeric(10, 2),
  data_inizio     date,
  data_rinnovo    date,
  attivo          boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists idx_staff_subs_client  on staff_subscriptions (client_id);
create index if not exists idx_staff_subs_rinnovo on staff_subscriptions (data_rinnovo) where attivo;

-- ---------------------------------------------------------------------------
-- 6. Progetti e modifiche extra
-- ---------------------------------------------------------------------------
create table if not exists staff_projects (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references staff_clients (id) on delete cascade,
  fase               text not null default 'brief'
                       check (fase in ('brief', 'design', 'sviluppo', 'revisione', 'online')),
  preview_url        text,
  dominio            text,
  scadenza_dominio   date,
  materiale_ricevuto jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_staff_projects_client   on staff_projects (client_id);
create index if not exists idx_staff_projects_scadenza on staff_projects (scadenza_dominio);

create table if not exists staff_extra_changes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references staff_projects (id) on delete cascade,
  descrizione text,
  -- 80 € di listino, 120 € sugli hotel: il default copre il caso frequente.
  prezzo      numeric(10, 2) not null default 80,
  pagato      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_staff_extra_project on staff_extra_changes (project_id);

-- ---------------------------------------------------------------------------
-- 7. Attività e follow-up
-- ---------------------------------------------------------------------------
create table if not exists staff_activities (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references staff_clients (id) on delete cascade,
  user_id    uuid references staff_profiles (id) on delete set null,
  tipo       text not null check (tipo in ('visita', 'chiamata', 'messaggio', 'nota')),
  testo      text,
  data       timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_activities_client on staff_activities (client_id, data desc);

create table if not exists staff_followups (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references staff_clients (id) on delete cascade,
  user_id    uuid references staff_profiles (id) on delete set null,
  data       date not null,
  nota       text,
  fatto      boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_followups_data on staff_followups (data) where not fatto;

-- ---------------------------------------------------------------------------
-- 8. Report di campo (raccolta dati)
-- ---------------------------------------------------------------------------
create table if not exists staff_field_reports (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references staff_clients (id) on delete cascade,
  user_id               uuid references staff_profiles (id) on delete set null,
  gestione_prenotazioni text[] not null default '{}',
  strumenti_usati       text[] not null default '{}',
  commissioni_pagate    numeric(10, 2),
  lingue_clienti        text[] not null default '{}',
  turisti               boolean,
  problemi_dichiarati   text,
  reazione              text,
  obiezione_principale  text,
  frase_titolare        text,
  trascrizione_vocale   text,
  -- Percorsi dentro il bucket Storage, non URL: un URL firmato scade.
  foto                  text[] not null default '{}',
  lat                   double precision,
  lng                   double precision,
  created_at            timestamptz not null default now()
);

create index if not exists idx_staff_field_client on staff_field_reports (client_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 9. Insight AI e risorse — non legati a un cliente: tutto lo staff li legge
-- ---------------------------------------------------------------------------
create table if not exists staff_ai_insights (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null
                  check (tipo in ('pattern', 'errore', 'segmento', 'idea_startup', 'report_mensile')),
  titolo        text not null,
  contenuto     text,
  dati_supporto jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists staff_resources (
  id         uuid primary key default gen_random_uuid(),
  titolo     text not null,
  tipo       text,
  file_url   text,
  settore    text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. updated_at — riusa update_updated_at() di 0007
-- ---------------------------------------------------------------------------
drop trigger if exists staff_clients_updated_at on staff_clients;
create trigger staff_clients_updated_at
  before update on staff_clients
  for each row execute function update_updated_at();

drop trigger if exists staff_projects_updated_at on staff_projects;
create trigger staff_projects_updated_at
  before update on staff_projects
  for each row execute function update_updated_at();

drop trigger if exists staff_deal_margins_updated_at on staff_deal_margins;
create trigger staff_deal_margins_updated_at
  before update on staff_deal_margins
  for each row execute function update_updated_at();

-- ---------------------------------------------------------------------------
-- 11. RLS
--
-- Regola unica: admin tutto, sales solo i propri clienti e mai i margini.
-- `anon` non compare in nessuna policy: senza sessione qui non si entra.
-- ---------------------------------------------------------------------------
alter table staff_profiles      enable row level security;
alter table staff_clients       enable row level security;
alter table staff_deals         enable row level security;
alter table staff_deal_margins  enable row level security;
alter table staff_subscriptions enable row level security;
alter table staff_projects      enable row level security;
alter table staff_extra_changes enable row level security;
alter table staff_activities    enable row level security;
alter table staff_followups     enable row level security;
alter table staff_field_reports enable row level security;
alter table staff_ai_insights   enable row level security;
alter table staff_resources     enable row level security;

-- Profili: ognuno il suo, l'admin tutti. La scrittura è solo dell'admin,
-- altrimenti un sales si promuove da sé con una PATCH.
drop policy if exists staff_profiles_select on staff_profiles;
create policy staff_profiles_select on staff_profiles
  for select to authenticated
  using (id = auth.uid() or public.is_staff_admin());

drop policy if exists staff_profiles_write on staff_profiles;
create policy staff_profiles_write on staff_profiles
  for all to authenticated
  using (public.is_staff_admin())
  with check (public.is_staff_admin());

-- Clienti.
drop policy if exists staff_clients_select on staff_clients;
create policy staff_clients_select on staff_clients
  for select to authenticated
  using (public.is_staff_admin() or assegnato_a = auth.uid());

-- Un sales può creare solo clienti già intestati a sé: senza il with check
-- potrebbe inserirne uno assegnato a un collega (e poi non rivederlo).
drop policy if exists staff_clients_insert on staff_clients;
create policy staff_clients_insert on staff_clients
  for insert to authenticated
  with check (public.is_staff_admin() or (public.is_staff() and assegnato_a = auth.uid()));

drop policy if exists staff_clients_update on staff_clients;
create policy staff_clients_update on staff_clients
  for update to authenticated
  using (public.is_staff_admin() or assegnato_a = auth.uid())
  with check (public.is_staff_admin() or assegnato_a = auth.uid());

-- Cancellare clienti è solo dell'admin: uno storico perso non torna.
drop policy if exists staff_clients_delete on staff_clients;
create policy staff_clients_delete on staff_clients
  for delete to authenticated
  using (public.is_staff_admin());

-- Tabelle figlie: la stessa policy, generata sul client_id.
do $$
declare t text;
begin
  for t in select unnest(array[
    'staff_deals', 'staff_subscriptions', 'staff_projects',
    'staff_activities', 'staff_followups', 'staff_field_reports'
  ])
  loop
    execute format('drop policy if exists %1$s_rw on %1$s', t);
    execute format(
      'create policy %1$s_rw on %1$s for all to authenticated
         using (public.staff_owns_client(client_id))
         with check (public.staff_owns_client(client_id))', t);
  end loop;
end $$;

-- Extra: passa dal progetto, non dal cliente.
drop policy if exists staff_extra_changes_rw on staff_extra_changes;
create policy staff_extra_changes_rw on staff_extra_changes
  for all to authenticated
  using (exists (
    select 1 from staff_projects p
    where p.id = project_id and public.staff_owns_client(p.client_id)
  ))
  with check (exists (
    select 1 from staff_projects p
    where p.id = project_id and public.staff_owns_client(p.client_id)
  ));

-- I margini: admin e nessun altro.
drop policy if exists staff_deal_margins_admin on staff_deal_margins;
create policy staff_deal_margins_admin on staff_deal_margins
  for all to authenticated
  using (public.is_staff_admin())
  with check (public.is_staff_admin());

-- Insight e risorse: tutto lo staff legge, solo l'admin scrive.
drop policy if exists staff_ai_insights_select on staff_ai_insights;
create policy staff_ai_insights_select on staff_ai_insights
  for select to authenticated using (public.is_staff());

drop policy if exists staff_ai_insights_write on staff_ai_insights;
create policy staff_ai_insights_write on staff_ai_insights
  for all to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());

drop policy if exists staff_resources_select on staff_resources;
create policy staff_resources_select on staff_resources
  for select to authenticated using (public.is_staff());

drop policy if exists staff_resources_write on staff_resources;
create policy staff_resources_write on staff_resources
  for all to authenticated
  using (public.is_staff_admin()) with check (public.is_staff_admin());
