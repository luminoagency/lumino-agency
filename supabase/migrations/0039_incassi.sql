-- ═══════════════════════════════════════════════════════════════════════════
-- 0039 — I canoni mensili incassati
--
-- Acconto e saldo avevano già dove stare: due booleani e due date su
-- `staff_deals`, che si pagano una volta sola e non tornano più indietro. Un
-- abbonamento no: si incassa **ogni mese**, e una colonna `pagato` su
-- `staff_subscriptions` direbbe soltanto «l'ultima volta sì» — senza sapere
-- quale mese, e cancellando novembre nel momento in cui si spunta dicembre.
--
-- Quindi una riga per mese. Costa una tabella e dà tre cose che la colonna non
-- poteva dare: il grafico «cosa è entrato, mese per mese» smette di ignorare i
-- ricorrenti (che sono la parte di fatturato che non va rivenduta, cioè quella
-- che si guarda), un mese saltato resta visibile come buco invece di sparire,
-- e segnare due volte lo stesso mese è impossibile — lo impedisce l'unicità,
-- non un controllo nell'interfaccia.
--
-- `mese` è **sempre il primo del mese**: il vincolo lo impone invece di
-- fidarsi di chi scrive. Senza, «ottobre» sarebbe il 1, il 15 o il 31 a
-- seconda di quando qualcuno ha premuto il bottone, e l'unicità non servirebbe
-- a niente.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists staff_subscription_payments (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references staff_subscriptions (id) on delete cascade,
  -- Il mese di competenza, normalizzato al primo giorno.
  mese            date not null,
  importo         numeric(10, 2) not null,
  -- Quando è entrato davvero: può non essere lo stesso mese.
  incassato_il    date not null default current_date,
  created_by      uuid references staff_profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  is_demo         boolean not null default false,
  constraint staff_subscription_payments_mese_primo
    check (mese = date_trunc('month', mese)::date),
  constraint staff_subscription_payments_importo_positivo
    check (importo >= 0),
  constraint staff_subscription_payments_una_volta
    unique (subscription_id, mese)
);

create index if not exists idx_staff_sub_pay_sub  on staff_subscription_payments (subscription_id, mese desc);
create index if not exists idx_staff_sub_pay_mese on staff_subscription_payments (mese desc);

comment on table staff_subscription_payments is
  'Un canone incassato, una riga. Il mese è normalizzato al primo giorno e non si può segnare due volte.';

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Stessa forma di `staff_extra_changes`: la tabella non ha un `client_id`, e il
-- proprietario si raggiunge passando per l'abbonamento. `staff_owns_client()`
-- resta l'unica regola — il venditore sui propri clienti, l'admin su tutti.

alter table staff_subscription_payments enable row level security;

drop policy if exists staff_subscription_payments_rw on staff_subscription_payments;
create policy staff_subscription_payments_rw on staff_subscription_payments
  for all
  using (
    exists (
      select 1 from staff_subscriptions s
       where s.id = staff_subscription_payments.subscription_id
         and staff_owns_client(s.client_id)
    )
  )
  with check (
    exists (
      select 1 from staff_subscriptions s
       where s.id = staff_subscription_payments.subscription_id
         and staff_owns_client(s.client_id)
    )
  );

select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'staff_subscription_payments') as tabella,
  (select count(*) from pg_policies
    where tablename = 'staff_subscription_payments')                              as policy,
  (select count(*) from staff_subscription_payments)                              as righe;
