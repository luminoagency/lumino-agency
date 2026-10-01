-- ═══════════════════════════════════════════════════════════════════════════
-- 0038 — Accettato vuol dire qualcosa
--
-- Il difetto: mettere un cliente su «Accettato» cambiava **una parola in una
-- colonna** e nient'altro. Nessuna trattativa chiusa, nessun progetto, niente
-- in Soldi. Chi usa la dashboard vedeva il cliente spostarsi nel kanban e poi
-- due pagine vuote, e l'unico modo di rimediare era scrivere a mano tre righe
-- in tre tabelle.
--
-- ## Perché un trigger e non la server action
--
-- Lo stato si cambia da **tre posti** — la tendina della scheda, il
-- trascinamento nel kanban, il menù nell'elenco clienti — e domani da un
-- quarto. Metterlo in `cambiaStato()` vuol dire che il giorno in cui qualcuno
-- scrive un `update staff_clients set stato = 'accettato'` da un'altra strada
-- (un import CSV, uno script, l'SQL editor) il cliente resta di nuovo a metà.
-- Il trigger vale per **ogni** scrittura, da qualunque parte arrivi, e la
-- funzione è richiamabile da sola per recuperare quelli già passati.
--
-- ## La funzione è idempotente, e non è un dettaglio
--
-- Un trigger `after update of stato` scatta anche quando lo stato viene
-- riscritto uguale, e un cliente può uscire e rientrare da «Accettato». Ogni
-- passo controlla se la riga c'è già: la trattativa si crea solo se non ce
-- n'è una, il progetto solo se non ce n'è uno, l'abbonamento solo se manca —
-- e se c'è ma è spento si riaccende invece di affiancargliene un altro.
--
-- ## I clienti demo restano fuori, apposta
--
-- `npm run staff:seed` inserisce i clienti **prima** delle trattative, e fra i
-- clienti ce ne sono cinque già accettati: con il trigger acceso su di loro il
-- seed si ritroverebbe una trattativa inventata qui e poi la sua, cioè due per
-- cliente. I dati demo sono una fixture scritta per intero in `lib/staff/demo.ts`
-- e vanno presi come sono: derivarne una parte vorrebbe dire che la fixture e
-- il database raccontano due cose diverse.
--
-- ## Le due modalità di pagamento
--
-- `modalita_pagamento` sta sulla **trattativa** e non sul cliente, perché è
-- quella la cosa che si incassa. `'30_70'` è il modello del piano (30%
-- all'ordine, 70% alla messa online) e resta il default; `'100_subito'` è una
-- voce sola per l'intero importo, e in quel caso la spunta che conta è
-- `acconto_30_pagato` — il vincolo qui sotto impedisce che qualcuno segni
-- anche il saldo e faccia contare il prezzo una volta e mezza.
--
-- Niente policy nuove: `staff_deals`, `staff_projects` e `staff_subscriptions`
-- hanno già `staff_owns_client(client_id)` in lettura e scrittura, quindi le
-- righe create qui le vede chi ha il cliente e le vede l'admin. La funzione è
-- `security definer` perché il trigger deve poter scrivere anche quando a
-- muovere il cliente è un venditore: la RLS decide chi **vede**, non se il
-- sistema può tenere in pari le proprie tabelle.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Le due colonne nuove sulla trattativa ────────────────────────────────

alter table staff_deals add column if not exists modalita_pagamento text not null default '30_70';

alter table staff_deals drop constraint if exists staff_deals_modalita_pagamento_valida;
alter table staff_deals add  constraint staff_deals_modalita_pagamento_valida
  check (modalita_pagamento in ('30_70', '100_subito'));

-- Con il pagamento unico il saldo non esiste: se restasse spuntabile, un
-- importo verrebbe contato al 100% più un altro 70%.
alter table staff_deals drop constraint if exists staff_deals_unico_senza_saldo;
alter table staff_deals add  constraint staff_deals_unico_senza_saldo
  check (modalita_pagamento <> '100_subito' or saldo_70_pagato = false);

-- L'abbonamento vive in `staff_subscriptions`, ma **l'importo si concorda nella
-- trattativa**: finché il cliente non accetta non esiste nessun abbonamento da
-- mettere in piedi, e metterlo subito in `staff_subscriptions` vorrebbe dire
-- un ricorrente che compare in Soldi prima di essere stato venduto.
alter table staff_deals add column if not exists abbonamento_mensile numeric(10, 2);

alter table staff_deals drop constraint if exists staff_deals_abbonamento_non_negativo;
alter table staff_deals add  constraint staff_deals_abbonamento_non_negativo
  check (abbonamento_mensile is null or abbonamento_mensile >= 0);

comment on column staff_deals.modalita_pagamento  is '30_70 (acconto 30% + saldo 70%) oppure 100_subito (una voce sola). Con 100_subito la spunta che conta è acconto_30_pagato.';
comment on column staff_deals.abbonamento_mensile is 'Canone mensile concordato. All''accettazione diventa una riga in staff_subscriptions.';

-- ── 2. Cosa succede quando un cliente accetta ───────────────────────────────

create or replace function staff_applica_accettazione(p_client uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c staff_clients%rowtype;
  d staff_deals%rowtype;
begin
  select * into c from staff_clients where id = p_client;
  if not found or c.stato <> 'accettato' or c.is_demo then
    return;
  end if;

  -- 2a. la trattativa, chiusa e vinta
  select * into d
    from staff_deals
   where client_id = c.id
   order by data_proposta desc, created_at desc
   limit 1;

  if not found then
    /* Il prezzo è quello che era stato consigliato sul cliente: è l'unico
       numero che il sistema conosce, e lasciarlo vuoto vorrebbe dire una
       trattativa chiusa a zero — cioè invisibile in Soldi, che è esattamente
       il difetto da cui siamo partiti. Se non c'è nemmeno quello la
       trattativa nasce senza prezzo e la scheda lo dice: è un dato che manca,
       non un dato da inventare. */
    insert into staff_deals (client_id, prezzo_proposto, prezzo_chiuso, data_chiusura, is_demo)
    values (c.id, c.prezzo_consigliato, c.prezzo_consigliato, current_date, c.is_demo)
    returning * into d;

  elsif d.data_chiusura is null or d.prezzo_chiuso is null then
    update staff_deals
       set prezzo_chiuso = coalesce(prezzo_chiuso, prezzo_proposto, c.prezzo_consigliato),
           data_chiusura = coalesce(data_chiusura, current_date)
     where id = d.id
    returning * into d;
  end if;

  -- 2b. il progetto, in Brief
  insert into staff_projects (client_id, fase, is_demo)
  select c.id, 'brief', c.is_demo
   where not exists (select 1 from staff_projects where client_id = c.id);

  -- 2c. l'abbonamento, solo se è stato concordato
  if coalesce(d.abbonamento_mensile, 0) > 0 then
    if exists (select 1 from staff_subscriptions where client_id = c.id) then
      /* Ce n'è già uno: si riaccende se era stato spento, e basta. Scrivere
         sopra l'importo cancellerebbe una rinegoziazione fatta a mano. */
      update staff_subscriptions set attivo = true where client_id = c.id and attivo = false;
    else
      insert into staff_subscriptions
        (client_id, tipo, importo_mensile, data_inizio, data_rinnovo, attivo, is_demo)
      values
        (c.id, 'manutenzione', d.abbonamento_mensile, current_date,
         (current_date + interval '1 month')::date, true, c.is_demo);
    end if;
  end if;
end;
$$;

comment on function staff_applica_accettazione(uuid) is
  'Materializza trattativa chiusa, progetto in brief e abbonamento per un cliente accettato. Idempotente, salta i clienti demo.';

/* Nessuno deve poterla chiamare come RPC dal browser senza essere entrato. */
revoke execute on function staff_applica_accettazione(uuid) from public, anon;
grant  execute on function staff_applica_accettazione(uuid) to authenticated, service_role;

-- ── 3. Il trigger: vale per ogni scrittura, da qualunque strada ─────────────

create or replace function staff_dopo_stato_cliente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  /* Solo quando lo stato **diventa** accettato: un `after update of stato` scatta
     anche riscrivendo lo stesso valore, e senza questo controllo ogni salvataggio
     della scheda rifarebbe il giro per niente. */
  if new.stato = 'accettato'
     and (tg_op = 'INSERT' or old.stato is distinct from new.stato)
  then
    perform staff_applica_accettazione(new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists staff_clients_accettazione on staff_clients;
create trigger staff_clients_accettazione
  after insert or update of stato on staff_clients
  for each row execute function staff_dopo_stato_cliente();

-- ── 4. Recupero: chi era già accettato prima di oggi ────────────────────────

do $$
declare r record;
begin
  for r in select id from staff_clients where stato = 'accettato' and is_demo = false loop
    perform staff_applica_accettazione(r.id);
  end loop;
end;
$$;

-- Il controllo finale, in una riga sola: quanti accettati veri, e quanti di
-- loro hanno adesso trattativa chiusa e progetto.
select
  count(*)                                               as accettati_veri,
  count(*) filter (where d.id is not null)               as con_trattativa,
  count(*) filter (where d.data_chiusura is not null)    as con_chiusura,
  count(*) filter (where p.id is not null)               as con_progetto
from staff_clients c
left join lateral (select * from staff_deals    where client_id = c.id limit 1) d on true
left join lateral (select * from staff_projects where client_id = c.id limit 1) p on true
where c.stato = 'accettato' and c.is_demo = false;
