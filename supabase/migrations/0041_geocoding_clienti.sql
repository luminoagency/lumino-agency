-- ═══════════════════════════════════════════════════════════════════════════
-- 0041 — Dove sta un cliente, e se lo sappiamo
--
-- `lat` e `lng` su `staff_clients` esistono dalla 0030: non servono colonne
-- nuove per le coordinate. Quello che mancava è **sapere perché mancano**, e
-- senza quello la mappa aveva un solo modo di comportarsi con un cliente senza
-- coordinate: non disegnarlo, in silenzio.
--
-- Tre stati diversi che `lat is null` non distingue:
--
--   · non c'è un indirizzo da cercare (un lead preso al telefono)      → assente
--   · c'è un indirizzo e nessuno l'ha ancora cercato (import CSV)      → da_fare
--   · c'è un indirizzo e Nominatim non l'ha trovato                    → non_trovato
--
-- Il terzo è l'unico che va **detto in faccia** a chi guarda la scheda: è un
-- indirizzo scritto male, e la correzione la può fare solo una persona. Gli
-- altri due non sono errori di nessuno e non meritano un avviso.
--
-- Il default è `da_fare` e non `assente`: su un database che ha già dei clienti
-- questa migration non sa quali hanno un indirizzo, e `da_fare` è l'unico
-- valore che fa sì che lo script di backfill li guardi tutti una volta. Dopo
-- quel giro ognuno ha lo stato vero.
--
-- **Niente policy nuove.** Sono due colonne su una tabella che ha già la sua
-- RLS: chi vede il cliente vede dove sta, e chi non lo vede non lo vede
-- comunque.
-- ═══════════════════════════════════════════════════════════════════════════

alter table staff_clients add column if not exists geo_stato text not null default 'da_fare';
alter table staff_clients add column if not exists geo_at    timestamptz;

alter table staff_clients drop constraint if exists staff_clients_geo_stato_valido;
alter table staff_clients add  constraint staff_clients_geo_stato_valido
  check (geo_stato in ('ok', 'non_trovato', 'assente', 'da_fare'));

comment on column staff_clients.geo_stato is
  'ok = lat/lng vengono dall''indirizzo. non_trovato = indirizzo cercato e non trovato (si avvisa nella scheda). assente = nessun indirizzo da cercare. da_fare = da geocodificare.';
comment on column staff_clients.geo_at is
  'Quando le coordinate sono state calcolate. Serve a non ripetere la ricerca di un indirizzo che non è cambiato.';

-- I clienti che hanno già delle coordinate si danno per buoni: potrebbero
-- venire dall'agent di ricerca o da un import con lat/lng dentro, e rifarle
-- tutte vorrebbe dire centinaia di chiamate a Nominatim per correggere forse
-- nessuno. Lo script di backfill ha `--tutti` per chi vuole rifarle davvero.
update staff_clients
   set geo_stato = 'ok',
       geo_at    = coalesce(geo_at, now())
 where lat is not null and lng is not null and geo_stato = 'da_fare';

-- Chi non ha niente da cercare non resta in coda per sempre.
update staff_clients
   set geo_stato = 'assente'
 where geo_stato = 'da_fare'
   and nullif(btrim(coalesce(indirizzo, '')), '') is null
   and nullif(btrim(coalesce(citta, '')), '')     is null;

-- Un indice parziale sulla coda: sono poche righe e lo script le cerca per
-- stato. Sull'intera colonna costerebbe come un indice vero per rispondere a
-- una domanda che riguarda l'1% delle righe — stessa logica della 0031.
create index if not exists idx_staff_clients_geo_coda
  on staff_clients (created_at) where geo_stato = 'da_fare';

select geo_stato, count(*) from staff_clients group by geo_stato order by geo_stato;
