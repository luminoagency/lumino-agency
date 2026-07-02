-- Layer 2 — Branding cliente: bucket Storage per asset di progetto (logo, ecc.)
-- NB: applicare manualmente (Supabase SQL editor o CLI). NON eseguita automaticamente.

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Lettura pubblica (i loghi sono serviti nel sito pubblico).
CREATE POLICY "Public read project-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-assets');

-- Scrittura riservata al service_role (upload lato server action admin).
CREATE POLICY "Admin write project-assets"
ON storage.objects FOR ALL
USING (auth.role() = 'service_role');
