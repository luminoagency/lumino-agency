-- ============================================================
-- Lumino Agency — Database Schema
-- Target: Supabase (PostgreSQL)
-- gen_random_uuid() is available by default in Supabase (pgcrypto).
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. restaurants — discovered leads (from Google Maps, etc.)
-- ------------------------------------------------------------
create table restaurants (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  address         text,
  city            text,
  zone            text,
  category        text,
  stars           numeric(2,1),                 -- e.g. 4.5
  reviews_count   integer default 0,
  phone           text,
  email           text,
  website         text,
  photos_urls     text[] default '{}',          -- array of photo URLs
  google_place_id text unique,                  -- dedupe key from Google
  created_at      timestamptz not null default now()
);

create index idx_restaurants_city     on restaurants (city);
create index idx_restaurants_zone     on restaurants (zone);
create index idx_restaurants_category on restaurants (category);

-- ------------------------------------------------------------
-- 2. clients — restaurants that entered the sales pipeline
-- ------------------------------------------------------------
create table clients (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants (id) on delete set null,
  name          text not null,
  email         text,
  phone         text,
  plan          text check (plan in ('basic','pro','premium','custom')),
  price         numeric(10,2),
  status        text not null default 'lead'
                  check (status in ('lead','negotiating','paid','building','delivered')),
  created_at    timestamptz not null default now()
);

create index idx_clients_restaurant_id on clients (restaurant_id);
create index idx_clients_status        on clients (status);

-- ------------------------------------------------------------
-- 3. sites — generated/deployed websites for clients
-- ------------------------------------------------------------
create table sites (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients (id) on delete cascade,
  domain         text,
  template_style text check (template_style in ('luxury','exotic','modern')),
  vercel_url     text,
  status         text not null default 'building'
                   check (status in ('building','live','error')),
  deployed_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index idx_sites_client_id on sites (client_id);
create index idx_sites_status    on sites (status);

-- ------------------------------------------------------------
-- 4. emails_sent — cold-outreach log per restaurant
-- ------------------------------------------------------------
create table emails_sent (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants (id) on delete cascade,
  strategy      smallint check (strategy between 1 and 5),
  subject       text,
  sent_at       timestamptz not null default now(),
  opened        boolean not null default false,
  replied       boolean not null default false,
  unsubscribed  boolean not null default false
);

create index idx_emails_sent_restaurant_id on emails_sent (restaurant_id);
create index idx_emails_sent_sent_at        on emails_sent (sent_at);

-- ------------------------------------------------------------
-- 5. payments — deposits and final payments per client
-- ------------------------------------------------------------
create table payments (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  amount    numeric(10,2) not null,
  type      text check (type in ('deposit','final')),
  status    text not null default 'pending'
              check (status in ('pending','received')),
  date      date not null default current_date,
  notes     text
);

create index idx_payments_client_id on payments (client_id);
create index idx_payments_status    on payments (status);

-- ------------------------------------------------------------
-- 6. domains — registered domains per client
-- ------------------------------------------------------------
create table domains (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients (id) on delete cascade,
  domain_name text not null unique,
  provider    text not null default 'porkbun'
                check (provider in ('porkbun')),
  expires_at  date,
  auto_renew  boolean not null default true,
  created_at  timestamptz not null default now()
);

create index idx_domains_client_id on domains (client_id);

-- ------------------------------------------------------------
-- 7. ai_logs — audit trail of AI actions (cost/usage tracking)
-- ------------------------------------------------------------
create table ai_logs (
  id             uuid primary key default gen_random_uuid(),
  action         text not null,
  input_summary  text,
  output_summary text,
  model          text,
  tokens_used    integer,
  created_at     timestamptz not null default now()
);

create index idx_ai_logs_created_at on ai_logs (created_at);
create index idx_ai_logs_action     on ai_logs (action);

commit;
