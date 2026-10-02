-- ═══════════════════════════════════════════════════════════════════════════
-- 0040 — Chi comanda, e chi vede cosa
--
-- Tre cose, e la terza è l'unica che conta davvero.
--
-- ## 1. `owner`: un ruolo sopra l'admin
--
-- Fino a qui `role` valeva 'admin' | 'sales', e `admin` era il tetto: chi lo
-- aveva poteva tutto, compreso scrivere la riga di chiunque altro in
-- `staff_profiles` — cioè promuoversi, declassare un socio, o darsi un
-- permesso. Con tre persone che sono tutte e tre admin, «tutto» non era un
-- problema teorico: era la configurazione.
--
-- `owner` è il terzo valore, e ce l'ha una persona sola. È lui e soltanto lui
-- che aggiunge membri, crea le loro credenziali e decide cosa vedono.
--
-- **`is_staff_admin()` include l'owner**, ed è la ragione per cui questa
-- migration non riscrive venti policy: tutte quelle della 0030 continuano a
-- dire quello che dicevano. Un owner è un admin con qualcosa in più, non una
-- categoria a parte — se non lo fosse, il titolare perderebbe l'accesso ai
-- margini il giorno in cui si dà il ruolo più alto, che è l'esatto contrario
-- di quello che deve succedere.
--
-- ## 2. Quattro permessi per membro
--
-- Colonne su `staff_profiles` e non una tabella a parte. Una tabella
-- `staff_permessi` sarebbe più elegante e sbagliata qui: questi permessi
-- vengono letti **dentro le policy RLS**, cioè una volta per riga per query, e
-- una join in una policy è il modo più sicuro di rendere lenta tutta l'area.
-- Quattro booleani sulla riga che la funzione legge già sono quattro booleani.
--
-- Il default è `true`, e non è una svista. Un permesso che nasce a `false`
-- svuota la dashboard di chiunque venga aggiunto da una strada che non conosce
-- queste colonne — lo script dell'utente di prova, un import, una riga
-- nell'SQL editor — e una dashboard misteriosamente vuota costa più di un
-- interruttore da spegnere. Il senso della funzione è «l'owner può togliere»,
-- non «i nuovi nascono ciechi».
--
-- ## 3. La RLS, che è l'unico posto dove un permesso è vero
--
-- Nascondere una voce di menù non protegge niente: la chiave anon di Supabase
-- è nel bundle del browser, quindi chiunque abbia una sessione valida può
-- chiamare PostgREST a mano e chiedere `staff_deals`. Un permesso che vive
-- nell'interfaccia è un suggerimento. Qui ogni permesso spegne delle **righe**:
--
--   · `can_view_trattative` → `staff_deals`, `staff_deal_margins`
--     (prezzi, sconto, modalità di pagamento: le condizioni economiche)
--   · `can_view_soldi`      → `staff_subscriptions`, `staff_extra_changes`
--     (i canoni e gli extra, cioè quello che la sezione Soldi somma)
--   · `can_view_incassi`    → `staff_subscription_payments`, più il diritto di
--     **toccare** le spunte di acconto e saldo su `staff_deals`
--   · `can_manage_clients`  → insert, update e delete su `staff_clients`
--
-- Le due spunte dell'incasso stanno su `staff_deals`, e la RLS filtra righe e
-- non colonne: non si può dare la riga e negare due campi. Per quelli serve un
-- trigger, che è esattamente ciò che fa `staff_blocca_incassi_senza_permesso`
-- qui sotto. Non è un doppione dell'interfaccia: è la stessa regola nel punto
-- in cui non si può aggirare.
--
-- Il SELECT su `staff_clients` resta aperto a tutto lo staff. Vedere i propri
-- clienti è il lavoro, non un privilegio — il permesso riguarda il modificarli.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Il ruolo
-- ───────────────────────────────────────────────────────────────────────────

-- Il vecchio vincolo era dichiarato dentro il `create table` della 0030, cioè
-- con un nome che Postgres ha scelto da sé. `drop constraint if exists
-- staff_profiles_role_check` indovinerebbe quel nome, e se lo indovinasse male
-- il vincolo vecchio resterebbe in piedi a rifiutare 'owner'. Si cerca invece
-- per **definizione**: qualunque check su questa tabella che nomini 'sales' è
-- quello, come che si chiami.
do $$
declare c record;
begin
  for c in
    select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace ns on ns.oid = rel.relnamespace
     where ns.nspname = 'public'
       and rel.relname = 'staff_profiles'
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) like '%sales%'
  loop
    execute format('alter table staff_profiles drop constraint %I', c.conname);
  end loop;
end $$;

alter table staff_profiles add constraint staff_profiles_role_check
  check (role in ('owner', 'admin', 'sales'));

comment on column staff_profiles.role is
  'owner = il titolare, uno solo: gestisce il team e i permessi. admin = vede tutto il lavoro di tutti. sales = i propri clienti.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. I permessi
-- ───────────────────────────────────────────────────────────────────────────

alter table staff_profiles add column if not exists can_view_soldi      boolean not null default true;
alter table staff_profiles add column if not exists can_view_incassi    boolean not null default true;
alter table staff_profiles add column if not exists can_manage_clients  boolean not null default true;
alter table staff_profiles add column if not exists can_view_trattative boolean not null default true;

comment on column staff_profiles.can_view_soldi      is 'Sezione Soldi, canoni, extra e ogni importo che ne discende.';
comment on column staff_profiles.can_view_incassi    is 'Segnare e annullare un incasso, e vedere i canoni già incassati.';
comment on column staff_profiles.can_manage_clients  is 'Creare, modificare ed eliminare clienti. Vederli non dipende da questo.';
comment on column staff_profiles.can_view_trattative is 'Trattative e condizioni economiche: prezzo, sconto, modalità di pagamento.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Amin owner, gli altri due senza la gestione del team
--
-- La 0037 aveva dato `puo_creare_membri` a tutti e tre. Era giusto allora —
-- erano tre soci e nessun altro — ed è sbagliato adesso che i membri si
-- aggiungono da una pagina: «chi crea credenziali» e «chi è socio» sono due
-- domande diverse. Il permesso resta la colonna che apre il pannello, e da
-- oggi ce l'ha solo l'owner.
--
-- Gli id sono quelli della 0037, letti una volta con l'API di amministrazione:
-- `auth.users` non è raggiungibile da PostgREST e una migration che lo
-- interroga passa qui e fallisce altrove.
-- ───────────────────────────────────────────────────────────────────────────

update staff_profiles
   set role = 'owner',
       puo_creare_membri = true,
       can_view_soldi = true,
       can_view_incassi = true,
       can_manage_clients = true,
       can_view_trattative = true
 where id = '84d1f911-d41f-4e6f-9a45-f8cb54bba6a5';  -- Amin

-- Ayman e Ratib restano admin con tutti i permessi di lavoro accesi: l'owner
-- li regola dal pannello. Quello che perdono è la gestione del team.
update staff_profiles
   set puo_creare_membri = false
 where id in (
   'f1e5035c-f79c-42d3-a5e5-f62266db2d38',  -- Ayman
   'e618caf3-36f2-4537-a1fa-631a839b0ed5'   -- Ratib
 );

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Le funzioni
-- ───────────────────────────────────────────────────────────────────────────

-- `is_staff_admin()` adesso include l'owner. Vedi la nota in testa: è questo
-- che tiene in piedi tutte le policy della 0030 senza riscriverle.
create or replace function public.is_staff_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff_profiles
    where id = auth.uid() and attivo and role in ('admin', 'owner')
  )
$$;

create or replace function public.is_staff_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff_profiles
    where id = auth.uid() and attivo and role = 'owner'
  )
$$;

/*
 * `staff_has_perm(perm)`: il permesso di chi sta chiedendo, adesso.
 *
 * `language sql` e un `case`, non `plpgsql` con dell'SQL dinamico: questa
 * funzione finisce dentro le policy, quindi gira una volta per query (è
 * `stable`, il planner la tiene). Un `execute format(...)` per leggere una
 * colonna dal nome variabile costerebbe un parse a ogni chiamata e non
 * aggiungerebbe niente — i permessi sono quattro e sono scritti qui.
 *
 * **L'owner passa sempre**, e deve: è lui che assegna i permessi, e un titolare
 * che si chiude fuori dai propri incassi con un click sbagliato non ha nessuno
 * a cui chiedere di riaprirlo. Un admin invece **non** passa: Ayman è admin, e
 * il senso di tutta questa migration è che anche lui sia regolabile.
 *
 * Un nome di permesso che non esiste risponde `false`. Una funzione di
 * sicurezza che risponde «non lo so» va trattata come un no, e scrivere
 * `staff_has_perm('can_view_tutto')` in una policy futura deve chiudere la
 * porta, non aprirla.
 */
create or replace function public.staff_has_perm(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff_profiles p
    where p.id = auth.uid()
      and p.attivo
      and (
        p.role = 'owner'
        or case perm
             when 'can_view_soldi'      then p.can_view_soldi
             when 'can_view_incassi'    then p.can_view_incassi
             when 'can_manage_clients'  then p.can_manage_clients
             when 'can_view_trattative' then p.can_view_trattative
             else false
           end
      )
  )
$$;

revoke all on function public.is_staff_owner() from public;
revoke all on function public.staff_has_perm(text) from public;
grant execute on function public.is_staff_owner() to authenticated;
grant execute on function public.staff_has_perm(text) to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Nessuno si dà i permessi da solo
--
-- Estende il trigger della 0037 da una colonna a sei: i quattro permessi,
-- `puo_creare_membri` e `role`. Le scrive la server action col service-role,
-- che salta la RLS, quindi senza questo controllo **dentro** il database
-- qualunque policy di update su `staff_profiles` — presente o futura — sarebbe
-- una strada per alzarsi da sé. `auth.role()` legge il claim del JWT della
-- connessione: 'service_role' per la chiave di servizio, 'authenticated' per
-- chiunque arrivi da un browser. `postgres` copre l'SQL editor e questa stessa
-- migration.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function staff_blocca_permesso_membri()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dal_server boolean := coalesce(auth.role(), current_user)
                        in ('service_role', 'postgres', 'supabase_admin');
begin
  if dal_server then
    return new;
  end if;

  if tg_op = 'INSERT' then
    /* Una riga di staff nuova non la crea mai una sessione utente: la fa la
       server action dell'owner, col service-role. */
    raise exception 'un profilo staff si crea solo dal pannello Team';
  end if;

  if new.role is distinct from old.role then
    raise exception 'role non si cambia da una sessione utente';
  end if;
  if coalesce(new.puo_creare_membri, false)
       is distinct from coalesce(old.puo_creare_membri, false) then
    raise exception 'puo_creare_membri non si cambia da una sessione utente';
  end if;
  if coalesce(new.can_view_soldi, false) is distinct from coalesce(old.can_view_soldi, false)
     or coalesce(new.can_view_incassi, false) is distinct from coalesce(old.can_view_incassi, false)
     or coalesce(new.can_manage_clients, false) is distinct from coalesce(old.can_manage_clients, false)
     or coalesce(new.can_view_trattative, false) is distinct from coalesce(old.can_view_trattative, false)
  then
    raise exception 'i permessi non si cambiano da una sessione utente';
  end if;

  return new;
end;
$$;

drop trigger if exists staff_profiles_permesso_membri on staff_profiles;
create trigger staff_profiles_permesso_membri
  before insert or update on staff_profiles
  for each row execute function staff_blocca_permesso_membri();

-- ───────────────────────────────────────────────────────────────────────────
-- 6. `staff_profiles`: la scrittura passa all'owner
--
-- La 0030 dava l'update su staff_profiles a `is_staff_admin()`. Con tre admin
-- quella policy diceva: ognuno dei tre può riscrivere la riga degli altri due.
-- Il trigger sopra copre `role` e i permessi, ma restano nome, email, foto,
-- obiettivo e `attivo` — cioè la possibilità di sospendere un socio.
--
-- Non rompe la modifica del proprio profilo: `aggiornaProfilo()` scrive con il
-- service-role su un elenco fisso di tre colonne, proprio perché la RLS decide
-- per righe e «può modificare la propria riga» vorrebbe dire «può promuoversi».
-- Vedi la nota della 0033.
-- ───────────────────────────────────────────────────────────────────────────

drop policy if exists staff_profiles_write on staff_profiles;
create policy staff_profiles_write on staff_profiles
  for all to authenticated
  using (public.is_staff_owner())
  with check (public.is_staff_owner());

-- ───────────────────────────────────────────────────────────────────────────
-- 7. I clienti: vederli sì, toccarli con permesso
-- ───────────────────────────────────────────────────────────────────────────

drop policy if exists staff_clients_insert on staff_clients;
create policy staff_clients_insert on staff_clients
  for insert to authenticated
  with check (
    public.staff_has_perm('can_manage_clients')
    and (public.is_staff_admin() or (public.is_staff() and assegnato_a = auth.uid()))
  );

drop policy if exists staff_clients_update on staff_clients;
create policy staff_clients_update on staff_clients
  for update to authenticated
  using (
    public.staff_has_perm('can_manage_clients')
    and (public.is_staff_admin() or assegnato_a = auth.uid())
  )
  with check (
    public.staff_has_perm('can_manage_clients')
    and (public.is_staff_admin() or assegnato_a = auth.uid())
  );

drop policy if exists staff_clients_delete on staff_clients;
create policy staff_clients_delete on staff_clients
  for delete to authenticated
  using (public.is_staff_admin() and public.staff_has_perm('can_manage_clients'));

-- ───────────────────────────────────────────────────────────────────────────
-- 8. Le trattative e i margini
--
-- `staff_deals` aveva la policy generata nel ciclo della 0030 (`staff_deals_rw`,
-- un `for all`). Qui esce dal ciclo e prende la sua, perché ha una condizione
-- in più delle sorelle.
--
-- Nota su `staff_applica_accettazione()` (0038): è `security definer`, quindi
-- salta la RLS. Mettere un cliente su «Accettato» continua a creare trattativa,
-- progetto e abbonamento anche per un membro che le trattative non le vede —
-- ed è giusto così: il suo lavoro è chiudere il cliente, non leggere i numeri.
-- ───────────────────────────────────────────────────────────────────────────

drop policy if exists staff_deals_rw on staff_deals;
create policy staff_deals_rw on staff_deals
  for all to authenticated
  using (
    public.staff_has_perm('can_view_trattative')
    and public.staff_owns_client(client_id)
  )
  with check (
    public.staff_has_perm('can_view_trattative')
    and public.staff_owns_client(client_id)
  );

-- I margini: admin (e owner) come prima, più il permesso. Chi non vede le
-- trattative non ha nessun motivo di vedere il costo interno.
drop policy if exists staff_deal_margins_admin on staff_deal_margins;
create policy staff_deal_margins_admin on staff_deal_margins
  for all to authenticated
  using (public.is_staff_admin() and public.staff_has_perm('can_view_trattative'))
  with check (public.is_staff_admin() and public.staff_has_perm('can_view_trattative'));

-- ───────────────────────────────────────────────────────────────────────────
-- 9. Le due spunte dell'incasso, che la RLS non sa proteggere
--
-- `acconto_30_pagato`, `saldo_70_pagato` e le loro date stanno su
-- `staff_deals`: la policy sopra dà o nega la riga intera, e non c'è modo di
-- dare la riga negando quattro colonne. Il trigger è quel modo.
--
-- Guarda solo i **cambiamenti**: un update che tocca il prezzo e lascia le
-- spunte come stanno passa senza chiedere niente. E lascia passare il
-- service-role, perché il trigger della 0038 materializza una trattativa con
-- le spunte a false e non deve inciampare qui.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function staff_blocca_incassi_senza_permesso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), current_user) in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if (new.acconto_30_pagato is distinct from old.acconto_30_pagato
      or new.acconto_30_data is distinct from old.acconto_30_data
      or new.saldo_70_pagato is distinct from old.saldo_70_pagato
      or new.saldo_70_data  is distinct from old.saldo_70_data)
     and not public.staff_has_perm('can_view_incassi')
  then
    raise exception 'non hai il permesso di segnare un incasso';
  end if;

  return new;
end;
$$;

drop trigger if exists staff_deals_incassi_permesso on staff_deals;
create trigger staff_deals_incassi_permesso
  before update on staff_deals
  for each row execute function staff_blocca_incassi_senza_permesso();

-- ───────────────────────────────────────────────────────────────────────────
-- 10. Canoni, extra e incassi dei canoni
--
-- `staff_subscriptions` esce anche lui dal ciclo della 0030.
-- ───────────────────────────────────────────────────────────────────────────

drop policy if exists staff_subscriptions_rw on staff_subscriptions;
create policy staff_subscriptions_rw on staff_subscriptions
  for all to authenticated
  using (
    public.staff_has_perm('can_view_soldi')
    and public.staff_owns_client(client_id)
  )
  with check (
    public.staff_has_perm('can_view_soldi')
    and public.staff_owns_client(client_id)
  );

drop policy if exists staff_extra_changes_rw on staff_extra_changes;
create policy staff_extra_changes_rw on staff_extra_changes
  for all to authenticated
  using (
    public.staff_has_perm('can_view_soldi')
    and exists (
      select 1 from staff_projects p
      where p.id = project_id and public.staff_owns_client(p.client_id)
    )
  )
  with check (
    public.staff_has_perm('can_view_soldi')
    and exists (
      select 1 from staff_projects p
      where p.id = project_id and public.staff_owns_client(p.client_id)
    )
  );

drop policy if exists staff_subscription_payments_rw on staff_subscription_payments;
create policy staff_subscription_payments_rw on staff_subscription_payments
  for all to authenticated
  using (
    public.staff_has_perm('can_view_incassi')
    and exists (
      select 1 from staff_subscriptions s
       where s.id = staff_subscription_payments.subscription_id
         and public.staff_owns_client(s.client_id)
    )
  )
  with check (
    public.staff_has_perm('can_view_incassi')
    and exists (
      select 1 from staff_subscriptions s
       where s.id = staff_subscription_payments.subscription_id
         and public.staff_owns_client(s.client_id)
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- Il controllo finale: chi è chi, e cosa può.
-- ───────────────────────────────────────────────────────────────────────────

select nome, email, role, puo_creare_membri,
       can_view_soldi, can_view_incassi, can_manage_clients, can_view_trattative
  from staff_profiles
 order by case role when 'owner' then 0 when 'admin' then 1 else 2 end, nome;
