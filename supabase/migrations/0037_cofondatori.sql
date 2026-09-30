-- ═══════════════════════════════════════════════════════════════════════════
-- 0037 — I due co-founder, e chi può creare un account
--
-- Due cose, e stanno insieme perché la seconda esiste per i primi.
--
-- ## 1. Amin e Ayman entrano nello staff
--
-- I due account esistevano già in `auth.users` (creati a mano nella dashboard
-- di Supabase); quello che mancava era la riga in `staff_profiles`, che è la
-- cosa che `requireStaff()` cerca davvero — un utente Supabase senza quella
-- riga non è staff e /staff gli si chiude in faccia. Amin una riga ce l'aveva,
-- ma col nome «Titolare» e senza titolo: qui diventa «Amin · Co-founder».
--
-- Gli id sono scritti a mano e non risolti da una sottoquery su `auth.users`:
-- quello schema non è raggiungibile da PostgREST e una migration che lo
-- interroga passa qui e fallisce altrove. Sono stati letti una volta con
-- l'API di amministrazione e valgono per sempre — un uuid di auth non cambia.
--
-- ## 2. `puo_creare_membri`: chi apre «Nuovo membro»
--
-- Da questa fase i membri si aggiungono dalla pagina Team, e creare un membro
-- vuol dire creare **credenziali**. `role = 'admin'` non basta come cancello,
-- ed è il punto: un admin creato domani dalla dashboard erediterebbe anche il
-- diritto di creare altri account, cioè il permesso si propagherebbe da solo.
-- Questa colonna è un permesso che **non si eredita**: ce l'hanno le tre
-- persone scritte qui sotto, e per darlo a una quarta si scrive una riga di
-- SQL apposta. È voluto che costi.
--
-- Il trigger non è decorazione. La colonna la scrive la server action col
-- service-role, che salta la RLS: senza un controllo dentro il database,
-- qualunque policy di update su `staff_profiles` — presente o futura —
-- lascerebbe a un admin la strada per alzarsi il permesso da sé. Il trigger
-- guarda chi sta scrivendo e lascia passare solo il service-role.
-- ═══════════════════════════════════════════════════════════════════════════

alter table staff_profiles add column if not exists puo_creare_membri boolean not null default false;

comment on column staff_profiles.puo_creare_membri is
  'Chi può aprire «Nuovo membro» nella pagina Team, cioè creare credenziali. Non si eredita da role: si concede a mano.';

-- ── I tre ────────────────────────────────────────────────────────────────────
-- Ratib c'era già (CCO): gli si aggiunge solo il permesso, il titolo non si
-- tocca. Amin e Ayman entrano con lo stesso `role` e lo stesso permesso.

insert into staff_profiles (id, nome, email, role, ruolo_titolo, attivo, puo_creare_membri)
values
  ('84d1f911-d41f-4e6f-9a45-f8cb54bba6a5', 'Amin',  'babafbads@gmail.com',   'admin', 'Co-founder', true, true),
  ('f1e5035c-f79c-42d3-a5e5-f62266db2d38', 'Ayman', 'aymanmouden7@gmail.com', 'admin', 'Co-founder', true, true)
on conflict (id) do update set
  nome              = excluded.nome,
  email             = excluded.email,
  role              = excluded.role,
  ruolo_titolo      = excluded.ruolo_titolo,
  attivo            = excluded.attivo,
  puo_creare_membri = excluded.puo_creare_membri;

update staff_profiles
   set puo_creare_membri = true
 where id = 'e618caf3-36f2-4537-a1fa-631a839b0ed5';

-- ── Il permesso non si concede da soli ───────────────────────────────────────
-- `auth.role()` legge il claim del JWT con cui sta girando la connessione:
-- 'service_role' per la chiave di servizio (cioè per la server action), e
-- 'authenticated' per chiunque passi dal browser. `postgres` copre l'SQL
-- editor e questa stessa migration.

create or replace function staff_blocca_permesso_membri()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.puo_creare_membri, false) is distinct from
     coalesce(case when tg_op = 'INSERT' then false else old.puo_creare_membri end, false)
  then
    if coalesce(auth.role(), current_user) not in ('service_role', 'postgres', 'supabase_admin') then
      raise exception 'puo_creare_membri non si cambia da una sessione utente';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists staff_profiles_permesso_membri on staff_profiles;
create trigger staff_profiles_permesso_membri
  before insert or update on staff_profiles
  for each row execute function staff_blocca_permesso_membri();

-- Il controllo finale: tre righe, tutte e tre con il permesso.
select id, nome, email, role, ruolo_titolo, puo_creare_membri, foto_url is not null as ha_foto
  from staff_profiles
 order by nome;
