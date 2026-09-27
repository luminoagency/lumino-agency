-- ═══════════════════════════════════════════════════════════════════════════
-- 0031 — Dati demo marcati
--
-- Una colonna sola, ripetuta sulle tabelle che l'interfaccia legge in modo
-- diretto. Serve a due cose:
--
--   1. far vedere la dashboard piena a qualcuno senza inventarsi clienti veri;
--   2. poterli cancellare tutti con una riga, senza pescarli a mano.
--
-- Perché su sette tabelle e non solo su staff_clients: la cancellazione
-- basterebbe (le figlie hanno `on delete cascade`), ma il *nascondere* no —
-- la home somma staff_deals e staff_subscriptions senza passare dai clienti,
-- e senza la colonna anche a interruttore spento i soldi finti finirebbero
-- nei totali veri.
--
-- Il default è `false`: tutto ciò che esiste oggi resta dato vero.
-- ═══════════════════════════════════════════════════════════════════════════

alter table staff_clients       add column if not exists is_demo boolean not null default false;
alter table staff_deals         add column if not exists is_demo boolean not null default false;
alter table staff_subscriptions add column if not exists is_demo boolean not null default false;
alter table staff_projects      add column if not exists is_demo boolean not null default false;
alter table staff_activities    add column if not exists is_demo boolean not null default false;
alter table staff_followups     add column if not exists is_demo boolean not null default false;
alter table staff_field_reports add column if not exists is_demo boolean not null default false;

-- Indici parziali: indicizzano solo le righe finte, che sono poche decine.
-- Un indice sull'intera colonna costerebbe come uno vero per rispondere a una
-- domanda che riguarda l'1% delle righe.
create index if not exists idx_staff_clients_demo  on staff_clients (id)  where is_demo;
create index if not exists idx_staff_deals_demo    on staff_deals (id)    where is_demo;
create index if not exists idx_staff_subs_demo     on staff_subscriptions (id) where is_demo;
create index if not exists idx_staff_projects_demo on staff_projects (id) where is_demo;
create index if not exists idx_staff_act_demo      on staff_activities (id) where is_demo;
create index if not exists idx_staff_follow_demo   on staff_followups (id) where is_demo;
create index if not exists idx_staff_field_demo    on staff_field_reports (id) where is_demo;

-- Nessuna policy nuova: le righe demo vivono sotto la RLS delle loro tabelle,
-- intestate al venditore che ha lanciato il seed. Nascondere i dati finti è
-- una scelta di interfaccia, non una regola di sicurezza — e va tenuta dove
-- si può cambiare idea senza una migration.
