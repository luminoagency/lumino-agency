-- ============================================================
-- Lumino Agency — Migration 0002: Scraper State
-- Adds: scan_state, search_strategy, scrape_runs
-- Alters: restaurants (enrichment columns for scraping/email/selection)
-- Target: Supabase (PostgreSQL)
-- ============================================================

begin;

-- ------------------------------------------------------------
-- scan_state — sequential city-by-city scan queue + progress.
-- One row per city. The scraper works the lowest priority_rank
-- city with status != 'complete', advancing (tile_cursor,
-- category_cursor) each night until the whole city is covered,
-- then moves to the next city.
-- ------------------------------------------------------------
create table scan_state (
  id                uuid primary key default gen_random_uuid(),
  city              text not null,
  region            text,
  country           text not null default 'Italy',
  priority_rank     integer not null,             -- 1=Milan, 2=Turin, ...
  center_lat        double precision,
  center_lng        double precision,
  bbox              jsonb,                         -- {min_lat,min_lng,max_lat,max_lng}
  search_radius_m   integer not null default 1000, -- per-tile Nearby radius
  tiles_total       integer,                       -- set when the city scan begins
  tile_cursor       integer not null default 0,    -- next tile index to scan
  category_cursor   integer not null default 0,    -- next category index within tile
  status            text not null default 'pending'
                      check (status in ('pending','in_progress','complete')),
  restaurants_found integer not null default 0,
  api_calls_used    integer not null default 0,    -- cumulative for this city
  started_at        timestamptz,
  last_scanned_at   timestamptz,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique (city, country)
);

create index idx_scan_state_queue on scan_state (status, priority_rank);

-- Seed the priority city list (coords/bbox approximate — refined by grid.ts).
insert into scan_state (city, region, priority_rank, center_lat, center_lng, bbox) values
  ('Milan',    'Lombardy',       1, 45.4642,  9.1900, '{"min_lat":45.40,"min_lng":9.04,"max_lat":45.54,"max_lng":9.28}'),
  ('Turin',    'Piedmont',       2, 45.0703,  7.6869, '{"min_lat":45.00,"min_lng":7.58,"max_lat":45.13,"max_lng":7.78}'),
  ('Rome',     'Lazio',          3, 41.9028, 12.4964, '{"min_lat":41.79,"min_lng":12.34,"max_lat":42.00,"max_lng":12.62}'),
  ('Bologna',  'Emilia-Romagna', 4, 44.4949, 11.3426, '{"min_lat":44.44,"min_lng":11.27,"max_lat":44.55,"max_lng":11.41}'),
  ('Florence', 'Tuscany',        5, 43.7696, 11.2558, '{"min_lat":43.72,"min_lng":11.18,"max_lat":43.82,"max_lng":11.33}'),
  ('Naples',   'Campania',       6, 40.8518, 14.2681, '{"min_lat":40.80,"min_lng":14.13,"max_lat":40.90,"max_lng":14.34}');
-- Smaller cities (rank 7+) can be appended later; the weekly AI may re-rank.

-- ------------------------------------------------------------
-- search_strategy — the AI's evolving playbook. Exactly one
-- active row at a time (enforced below). Nightly scraper reads
-- the active row to order cities/categories and weight scoring.
-- ------------------------------------------------------------
create table search_strategy (
  id                     uuid primary key default gen_random_uuid(),
  version                integer not null unique,
  active                 boolean not null default false,
  prioritized_cities     jsonb not null default '[]',
  prioritized_categories jsonb not null default '[]',
  profile_weights        jsonb not null default '{}',
  reasoning              text,
  created_at             timestamptz not null default now()
);

-- At most one active strategy at any time.
create unique index one_active_strategy on search_strategy (active) where active;

-- Seed version 1 (neutral defaults; follows your city/category order).
insert into search_strategy (version, active, prioritized_cities, prioritized_categories, profile_weights, reasoning) values
  (1, true,
   '["Milan","Turin","Rome","Bologna","Florence","Naples"]',
   '["restaurant","trattoria","pizzeria","fast_food","kebab","bar","cafe","bakery","street_food","new_brand"]',
   '{"no_site":0.40,"underexposed":0.30,"newly_opened":0.20,"reviews":0.10}',
   'Initial default strategy before any conversion data exists.');

-- ------------------------------------------------------------
-- scrape_runs — per-run audit log (nightly + weekly).
-- ------------------------------------------------------------
create table scrape_runs (
  id               uuid primary key default gen_random_uuid(),
  run_type         text not null default 'nightly'
                     check (run_type in ('nightly','weekly')),
  city             text,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  status           text not null default 'running'
                     check (status in ('running','success','partial','error')),
  tiles_scanned    integer not null default 0,
  candidates_found integer not null default 0,
  new_restaurants  integer not null default 0,
  details_fetched  integer not null default 0,
  emails_found     integer not null default 0,
  api_calls        integer not null default 0,
  error            text
);

create index idx_scrape_runs_started_at on scrape_runs (started_at);

-- ------------------------------------------------------------
-- restaurants — enrichment columns for scraping, email
-- discovery (#3), newly-opened detection (#4), and selection (#2).
-- ------------------------------------------------------------
alter table restaurants
  add column email_status  text not null default 'pending'
    check (email_status in ('pending','found','not_found','manual_review')),
  add column email_source  text
    check (email_source in ('website','google','facebook','instagram','manual')),
  add column newly_opened   boolean not null default false,
  add column opened_signal  text,                 -- web-search evidence of recent opening
  add column priority_score numeric(4,3);         -- 0.000–1.000 selection score

create index idx_restaurants_email_status on restaurants (email_status);
create index idx_restaurants_priority     on restaurants (priority_score desc nulls last);

commit;
