-- ============================================================
-- 0015 — Backfill: applies what 0008 + 0009 should have added.
-- Fully idempotent (IF NOT EXISTS). Safe to re-run.
-- Root cause: /lumino-admin queried `sites.custom_domain` and
-- `site_content.reviews` which never existed in prod.
-- ============================================================

BEGIN;

-- ── from 0009 ────────────────────────────────────────────────
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS custom_domain            text,
  ADD COLUMN IF NOT EXISTS domain_managed_by_lumino boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_custom_domain_unique
  ON sites (custom_domain)
  WHERE custom_domain IS NOT NULL;

ALTER TABLE site_content
  ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- ── from 0008 ────────────────────────────────────────────────
ALTER TABLE site_content
  ADD COLUMN IF NOT EXISTS chef_name        text,
  ADD COLUMN IF NOT EXISTS chef_role        text,
  ADD COLUMN IF NOT EXISTS chef_quote       text,
  ADD COLUMN IF NOT EXISTS chef_photo_url   text,
  ADD COLUMN IF NOT EXISTS chef_years       integer,
  ADD COLUMN IF NOT EXISTS chef_active      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS faq              jsonb   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reviews_score    numeric(2,1),
  ADD COLUMN IF NOT EXISTS reviews_count    integer,
  ADD COLUMN IF NOT EXISTS reviews_source   text,
  ADD COLUMN IF NOT EXISTS reviews          jsonb   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS theme_template   text,
  ADD COLUMN IF NOT EXISTS theme_accent     text,
  ADD COLUMN IF NOT EXISTS theme_font       text,
  ADD COLUMN IF NOT EXISTS hero_images      jsonb   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS time_slots       text[]           DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS logo_url         text;

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS site_newsletter (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    uuid NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  email      text NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_site_newsletter_site_id ON site_newsletter (site_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_newsletter_unique ON site_newsletter (site_id, email);
ALTER TABLE site_newsletter ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_newsletter' AND policyname='public can subscribe on live sites') THEN
    CREATE POLICY "public can subscribe on live sites"
      ON site_newsletter FOR INSERT
      WITH CHECK (is_site_live(site_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_newsletter' AND policyname='owner can manage own newsletter list') THEN
    CREATE POLICY "owner can manage own newsletter list"
      ON site_newsletter FOR ALL
      USING (is_site_owner(site_id));
  END IF;
END $$;

-- User-submitted reviews
CREATE TABLE IF NOT EXISTS site_user_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      uuid NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  author_name  text NOT NULL,
  author_email text,
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text         text NOT NULL,
  approved     boolean NOT NULL DEFAULT false,
  approved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_site_user_reviews_site_id ON site_user_reviews (site_id);
CREATE INDEX IF NOT EXISTS idx_site_user_reviews_approved ON site_user_reviews (approved);
ALTER TABLE site_user_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_user_reviews' AND policyname='public can submit reviews on live sites') THEN
    CREATE POLICY "public can submit reviews on live sites"
      ON site_user_reviews FOR INSERT
      WITH CHECK (is_site_live(site_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_user_reviews' AND policyname='public can read approved reviews on live sites') THEN
    CREATE POLICY "public can read approved reviews on live sites"
      ON site_user_reviews FOR SELECT
      USING (approved = true AND is_site_live(site_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_user_reviews' AND policyname='owner can manage own reviews') THEN
    CREATE POLICY "owner can manage own reviews"
      ON site_user_reviews FOR ALL
      USING (is_site_owner(site_id));
  END IF;
END $$;

-- Content history snapshots
CREATE TABLE IF NOT EXISTS site_content_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    uuid NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
  snapshot   jsonb NOT NULL,
  user_id    uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_site_content_history_site_id ON site_content_history (site_id);
ALTER TABLE site_content_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_content_history' AND policyname='owner can read own site history') THEN
    CREATE POLICY "owner can read own site history"
      ON site_content_history FOR SELECT
      USING (is_site_owner(site_id));
  END IF;
END $$;

COMMIT;
