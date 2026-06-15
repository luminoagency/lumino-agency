-- ============================================================
-- Phase 8 — Admin panel extensions
-- Adds: chef, FAQ, reviews cache, newsletter, theme overrides
-- ============================================================

BEGIN;

-- 1. Extend site_content with new admin-managed sections
ALTER TABLE site_content
  -- Chef block
  ADD COLUMN chef_name        text,
  ADD COLUMN chef_role        text,
  ADD COLUMN chef_quote       text,
  ADD COLUMN chef_photo_url   text,
  ADD COLUMN chef_years       integer,
  ADD COLUMN chef_active      boolean not null default true,

  -- FAQ block (stored as JSON for simplicity)
  ADD COLUMN faq              jsonb not null default '[]',
  -- [{q: "...", a: "..."}]

  -- Reviews cache (synced from Google/Tripadvisor)
  ADD COLUMN reviews_score    numeric(2,1),
  ADD COLUMN reviews_count    integer,
  ADD COLUMN reviews_source   text,
  ADD COLUMN reviews          jsonb not null default '[]',
  -- [{author, rating, text, source, date, show}]

  -- Premium theme overrides (only used when tier=premium)
  ADD COLUMN theme_template   text,
  -- one of: cinematico, bento, panoramico, aurora, mercato

  ADD COLUMN theme_accent     text,
  -- hex color like '#e52d1d'

  ADD COLUMN theme_font       text,
  -- font family name

  ADD COLUMN hero_images      jsonb not null default '[]',
  -- ["url1", "url2", ...] for rotating hero
  ADD COLUMN time_slots       text[] default '{}',
  -- ["19:00", "19:30", "20:00"] for live availability buttons

  ADD COLUMN logo_url         text;


-- 2. Newsletter subscribers
CREATE TABLE IF NOT EXISTS site_newsletter (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references sites (id) on delete cascade,
  email      text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_site_newsletter_site_id ON site_newsletter (site_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_newsletter_unique
  ON site_newsletter (site_id, email);

ALTER TABLE site_newsletter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can subscribe on live sites"
  ON site_newsletter FOR INSERT
  WITH CHECK (is_site_live(site_id));

CREATE POLICY "owner can manage own newsletter list"
  ON site_newsletter FOR ALL
  USING (is_site_owner(site_id));


-- 3. User-submitted reviews (from the public site review form)
CREATE TABLE IF NOT EXISTS site_user_reviews (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references sites (id) on delete cascade,
  author_name  text not null,
  author_email text,
  rating       smallint not null check (rating between 1 and 5),
  text         text not null,
  approved     boolean not null default false,
  approved_at  timestamptz,
  created_at   timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_site_user_reviews_site_id
  ON site_user_reviews (site_id);
CREATE INDEX IF NOT EXISTS idx_site_user_reviews_approved
  ON site_user_reviews (approved);

ALTER TABLE site_user_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can submit reviews on live sites"
  ON site_user_reviews FOR INSERT
  WITH CHECK (is_site_live(site_id));

CREATE POLICY "public can read approved reviews on live sites"
  ON site_user_reviews FOR SELECT
  USING (approved = true AND is_site_live(site_id));

CREATE POLICY "owner can manage own reviews"
  ON site_user_reviews FOR ALL
  USING (is_site_owner(site_id));


-- 4. Audit/snapshot table (for versioning / restore-from-history)
CREATE TABLE IF NOT EXISTS site_content_history (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references sites (id) on delete cascade,
  snapshot   jsonb not null,
  user_id    uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_site_content_history_site_id
  ON site_content_history (site_id);

ALTER TABLE site_content_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can read own site history"
  ON site_content_history FOR SELECT
  USING (is_site_owner(site_id));

COMMIT;
