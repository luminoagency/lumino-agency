-- ============================================================
-- Phase 7 — Restaurant Website Templates
-- Extends existing sites table and adds content/reservations
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Extend sites table
--    slug     → URL routing key for app/sites/[slug]
--    tier     → mirrors clients.plan, denormalized for perf
--    active   → owner can take site offline without deleting
--    video_url → Higgsfield video (Premium), Supabase Storage URL
-- ------------------------------------------------------------
ALTER TABLE sites
  ADD COLUMN slug      text unique,
  ADD COLUMN tier      text check (tier in ('basic','pro','premium')),
  ADD COLUMN active    boolean not null default true,
  ADD COLUMN video_url text;

CREATE INDEX idx_sites_slug   ON sites (slug);
CREATE INDEX idx_sites_active ON sites (active);


-- ------------------------------------------------------------
-- 2. site_content — all editable website content
-- ------------------------------------------------------------
CREATE TABLE site_content (
  id                    uuid primary key default gen_random_uuid(),
  site_id               uuid not null references sites (id) on delete cascade,

  -- Identity
  restaurant_name       text not null,
  tagline               text,
  description           text,

  -- Hero
  hero_headline         text,
  hero_subheadline      text,
  hero_image_url        text,

  -- About
  about_title           text,
  about_text            text,
  about_image_url       text,
  team_photos           jsonb not null default '[]',
  -- [{url, name, role}]

  -- Contact
  address               text,
  city                  text,
  phone                 text,
  email                 text,
  whatsapp              text,           -- Pro+ only
  google_place_id       text,
  google_maps_embed_url text,

  -- Opening hours
  opening_hours         jsonb not null default '{}',
  -- {mon:{open:"12:00",close:"22:00",closed:false}, tue:{...}, ...}

  -- Gallery
  gallery_images        jsonb not null default '[]',
  -- [{url, caption, alt}]

  -- Style
  style_override        text check (style_override in ('luxury','exotic','modern')),
  -- null = use AI-selected style from sites.template_style

  -- Social
  social_links          jsonb not null default '{}',
  -- {instagram, facebook, tripadvisor, google}

  -- SEO
  seo_title             text,
  seo_description       text,
  seo_keywords          text[] default '{}',

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

CREATE UNIQUE INDEX idx_site_content_site_id ON site_content (site_id);


-- ------------------------------------------------------------
-- 3. site_menus — menu categories and items (all tiers)
--    Basic: static render only
--    Pro+: owner can edit via admin panel
-- ------------------------------------------------------------
CREATE TABLE site_menus (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references sites (id) on delete cascade,
  categories jsonb not null default '[]',
  -- [
  --   {
  --     id: "uuid",
  --     name: "Antipasti",
  --     description: "...",
  --     display_order: 0,
  --     items: [
  --       {
  --         id: "uuid",
  --         name: "Bruschetta",
  --         description: "...",
  --         price: 8.50,
  --         photo_url: "...",
  --         available: true,
  --         display_order: 0
  --       }
  --     ]
  --   }
  -- ]
  updated_at timestamptz not null default now()
);

CREATE UNIQUE INDEX idx_site_menus_site_id ON site_menus (site_id);


-- ------------------------------------------------------------
-- 4. site_events — news and events (Pro+ only)
-- ------------------------------------------------------------
CREATE TABLE site_events (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references sites (id) on delete cascade,
  title       text not null,
  description text,
  event_date  date,
  image_url   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

CREATE INDEX idx_site_events_site_id    ON site_events (site_id);
CREATE INDEX idx_site_events_event_date ON site_events (event_date);


-- ------------------------------------------------------------
-- 5. site_reservations — end-customer bookings (Pro+ only)
-- ------------------------------------------------------------
CREATE TABLE site_reservations (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references sites (id) on delete cascade,

  guest_name   text not null,
  guest_email  text,
  guest_phone  text not null,

  date         date not null,
  time         time not null,
  guests_count smallint not null check (guests_count between 1 and 50),
  notes        text,

  status       text not null default 'pending'
               check (status in ('pending','confirmed','cancelled','no_show','completed')),

  notified_at  timestamptz,  -- when owner was emailed via Gmail
  reminded_at  timestamptz,  -- reminder email sent to guest

  created_at   timestamptz not null default now()
);

CREATE INDEX idx_site_reservations_site_id ON site_reservations (site_id);
CREATE INDEX idx_site_reservations_date    ON site_reservations (date);
CREATE INDEX idx_site_reservations_status  ON site_reservations (status);


-- ------------------------------------------------------------
-- 6. site_customers — customer history (Premium only)
-- ------------------------------------------------------------
CREATE TABLE site_customers (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references sites (id) on delete cascade,

  name         text not null,
  email        text,
  phone        text,

  visits_count integer not null default 1,
  first_visit  date,
  last_visit   date,
  total_spent  numeric(10,2),
  notes        text,               -- private owner notes
  preferences  jsonb not null default '{}',
  -- {allergies: [...], favorites: [...], occasions: [...]}

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

CREATE INDEX idx_site_customers_site_id ON site_customers (site_id);
CREATE UNIQUE INDEX idx_site_customers_phone
  ON site_customers (site_id, phone)
  WHERE phone IS NOT NULL;


-- ------------------------------------------------------------
-- 7. site_owners — links Supabase Auth users to their site
--    Password auth (not magic link). Owner creates password
--    on first access. Reset via email link only.
-- ------------------------------------------------------------
CREATE TABLE site_owners (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  site_id    uuid not null references sites (id) on delete cascade,
  client_id  uuid references clients (id) on delete set null,
  role       text not null default 'owner'
             check (role in ('owner','staff')),
  created_at timestamptz not null default now()
);

CREATE UNIQUE INDEX idx_site_owners_user_site ON site_owners (user_id, site_id);
CREATE INDEX idx_site_owners_site_id          ON site_owners (site_id);


-- ------------------------------------------------------------
-- 8. Row Level Security
--    Public website (anon key): read-only on live sites
--    Owner (authenticated):     full control of their site
--    Admin (service_role key):  bypasses RLS entirely
-- ------------------------------------------------------------
ALTER TABLE site_content      ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_menus        ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_customers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_owners       ENABLE ROW LEVEL SECURITY;

-- Helper: is the current auth user an owner of this site?
CREATE OR REPLACE FUNCTION is_site_owner(p_site_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM site_owners
    WHERE user_id = auth.uid()
      AND site_id = p_site_id
  );
$$;

-- Helper: is this site publicly visible?
CREATE OR REPLACE FUNCTION is_site_live(p_site_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sites
    WHERE id = p_site_id
      AND active = true
      AND status = 'live'
  );
$$;

-- site_content
CREATE POLICY "public can read live site content"
  ON site_content FOR SELECT
  USING (is_site_live(site_id));

CREATE POLICY "owner can read own site content"
  ON site_content FOR SELECT
  USING (is_site_owner(site_id));

CREATE POLICY "owner can update own site content"
  ON site_content FOR UPDATE
  USING (is_site_owner(site_id));

-- site_menus
CREATE POLICY "public can read live site menus"
  ON site_menus FOR SELECT
  USING (is_site_live(site_id));

CREATE POLICY "owner can manage own menus"
  ON site_menus FOR ALL
  USING (is_site_owner(site_id));

-- site_events
CREATE POLICY "public can read active events on live sites"
  ON site_events FOR SELECT
  USING (active = true AND is_site_live(site_id));

CREATE POLICY "owner can manage own events"
  ON site_events FOR ALL
  USING (is_site_owner(site_id));

-- site_reservations
CREATE POLICY "public can submit reservations to live sites"
  ON site_reservations FOR INSERT
  WITH CHECK (is_site_live(site_id));

CREATE POLICY "owner can manage own reservations"
  ON site_reservations FOR ALL
  USING (is_site_owner(site_id));

-- site_customers
CREATE POLICY "owner can manage own customers"
  ON site_customers FOR ALL
  USING (is_site_owner(site_id));

-- site_owners
CREATE POLICY "user can read own site_owners row"
  ON site_owners FOR SELECT
  USING (user_id = auth.uid());


-- ------------------------------------------------------------
-- 9. updated_at auto-trigger
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER site_menus_updated_at
  BEFORE UPDATE ON site_menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER site_customers_updated_at
  BEFORE UPDATE ON site_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
