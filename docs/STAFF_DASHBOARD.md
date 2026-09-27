# Lumino Staff Dashboard — piano di progetto

Area interna su `bylumino.com/staff`. Stesso progetto Next.js App Router, stesso
Supabase (`xuxcpltbwvyozuprvbki`). Si lavora sul branch `staff-dashboard`, la PR
la apre il titolare: **niente merge su `main`**.

## Vincoli

- **Costo zero**: solo Supabase free, Vercel free. Nessun servizio a pagamento.
- **Risparmio token**: niente esplorazioni lunghe del repo. Si leggono solo i
  file di design (`app/globals.css`, `tailwind.config.ts`, i font in
  `app/layout.tsx`, `components/home/Wordmark.tsx`, `Cursor.tsx`,
  `SmoothScroll.tsx`, `useMotion.ts`) per riusare token e stile. Si procede per
  fasi, commit a fine fase, niente riepiloghi lunghi.
- **Solo Italia per ora**, ma `country` e `currency` (EUR/MAD) già nel DB, con
  filtro nascosto nell'interfaccia.

## Design

Stesso DNA di bylumino.com: moderno, professionale e divertente.

- Palette: `--void #171210`, `--cream #F4EEE4`, `--red #E5342A`,
  `--violet #8B5CF6`, gradiente firma `linear-gradient(100deg, #E5342A, #EC6A9C 46%, #8B5CF6)`.
- Tipografia: Fraunces (display) + Inter (interfaccia), **Anton solo per i
  numeri/KPI grandi**.
- Logo: wordmark `LUMINO` con la I nel gradiente (`components/home/Wordmark.tsx`).
- Motion con GSAP + Lenis già in dipendenza: transizioni tra pagine, KPI che
  contano, card del kanban con inerzia e drag fluido, micro-interazioni e
  cursore custom come sul sito.
- **Vietato**: look da template admin, griglie di card generiche, eyebrow con ✦,
  numerazioni 01/02/03, pill button ovunque, gradiente usato come maschera del
  testo. Deve sembrare un prodotto Lumino, non un pannello.
- **Mobile-first**: i venditori la usano per strada dal telefono.

## Auth e ruoli

Supabase Auth (email + password) su `/staff/login`. Tabella dei profili con
ruolo `admin | sales`. RLS su tutte le tabelle: `sales` vede solo i propri
clienti e non vede i margini, `admin` vede tutto.

Gli account si creano a mano dalla dashboard Supabase e si abbinano inserendo la
riga in `staff_profiles`: **nessun trigger su `auth.users`**, perché la stessa
istanza autentica anche i clienti dei siti generati — un trigger darebbe a
ognuno di loro un profilo staff.

## Database

Migration SQL in `supabase/migrations/`.

> **Prefisso `staff_`**: il repo ha già una tabella `clients` (usata dallo
> scraper/outreach) e nomi generici come `projects`, `activities`, `resources`
> sarebbero collisioni future. Tutte le tabelle di quest'area vivono quindi
> sotto `staff_*`, il nome logico del piano resta quello tra parentesi.

- `staff_clients` (clients): nome, settore (ristorante, bar, hotel, estetista,
  barbiere, altro), città, zona, indirizzo, lat/lng, referente, telefono, email,
  instagram, sito_attuale (nessuno | solo_social | vecchio | ok), note_sito,
  stato (da_contattare | contattato | in_trattativa | preventivo_inviato |
  accettato | rifiutato | in_pausa), motivo_rifiuto, assegnato_a, country,
  currency, created_at.
  Campi agent futuro, compilati a mano per ora: voto_sito,
  problemi_recensioni, prezzo_consigliato, fonte (manuale | agent).
- `staff_deals` (deals): client_id, pacchetto (basic | pro | premium),
  prezzo_proposto, prezzo_chiuso, sconto, acconto_30_pagato, saldo_70_pagato,
  date.
- `staff_deal_margins`: costo interno e margine, **solo admin**. Stanno in una
  tabella a parte perché una colonna non si può nascondere per ruolo con la RLS:
  admin e sales sono lo stesso ruolo Postgres (`authenticated`), quindi l'unico
  modo serio di non far vedere i margini a un venditore è non dargli le righe.
- `staff_subscriptions` (subscriptions): client_id, tipo, importo_mensile,
  data_inizio, data_rinnovo, attivo.
- `staff_projects` (projects): client_id, fase (brief | design | sviluppo |
  revisione | online), preview_url, dominio, scadenza_dominio,
  materiale_ricevuto (jsonb).
- `staff_extra_changes` (extra_changes): project_id, descrizione, prezzo (80, o
  120 per gli hotel), pagato.
- `staff_activities` (activities): client_id, user_id, tipo (visita | chiamata |
  messaggio | nota), testo, data.
- `staff_followups` (followups): client_id, user_id, data, nota, fatto.
- `staff_field_reports` (field_reports, raccolta dati): client_id, user_id,
  gestione_prenotazioni[], strumenti_usati[], commissioni_pagate,
  lingue_clienti[], turisti bool, problemi_dichiarati, reazione,
  obiezione_principale, frase_titolare, trascrizione_vocale, foto (Supabase
  Storage), lat/lng, created_at.
- `staff_ai_insights` (ai_insights): tipo (pattern | errore | segmento |
  idea_startup | report_mensile), titolo, contenuto, dati_supporto jsonb.
- `staff_resources` (resources): titolo, tipo, file_url, settore.

## Pagine (`/staff/...`)

1. **Home** — KPI animati (clienti per stato, chiusi del mese, incassato, da
   incassare, entrate ricorrenti mensili), follow-up di oggi, rinnovi in
   scadenza.
2. **Pipeline** — kanban drag & drop per stato. Passando un cliente a
   "rifiutato" si chiede il motivo, campo obbligatorio.
3. **Scheda cliente** — tutti i dati, deal, abbonamento, progetto, storico
   attività, report di campo.
4. **Campo** (priorità mobile) — nuova visita in meno di 2 minuti: campi a chip,
   nota vocale trascritta con Web Speech API del browser (gratis, `it-IT`),
   foto, GPS automatico.
5. **Soldi** — pagamenti 30/70, abbonamenti, extra da incassare.
6. **Progetti** — fasi, link preview, domini in scadenza.
7. **Statistiche** — tasso di chiusura per settore, zona e venditore, prezzo
   medio, tempo medio di chiusura, mappa delle zone coperte (Leaflet +
   OpenStreetMap, gratis).
8. **Team** (solo admin) — utenti, ruoli, obiettivi mensili, provvigioni.
9. **Risorse** — PDF prezzi, manuale, demo per settore.
10. **Lab AI** — chat sui dati e insight salvati. Gemini API free tier via
    `GEMINI_API_KEY` in una route server. Se la chiave manca, la sezione si
    mostra in stato "da attivare" senza rompere nulla.
11. **Ricerca Agent** — placeholder elegante "in arrivo", già nel menù.

## Fasi

| Fase | Contenuto | Stato |
| --- | --- | --- |
| F1 | schema + RLS + auth + layout/nav | fatta |
| F2 | pipeline + scheda cliente + import CSV dei lead | da fare |
| F3 | campo + follow-up | da fare |
| F4 | soldi + progetti + statistiche | da fare |
| F5 | lab AI + risorse + placeholder agent | da fare |

A fine di ogni fase: build pulita, commit, una riga su cosa si è fatto.

## Cosa è già in piedi (F1)

- `supabase/migrations/0030_staff_dashboard.sql` — tutte le tabelle, gli indici,
  le funzioni `staff_role()` / `is_staff_admin()` / `staff_owns_client()` e la
  RLS completa. **Da eseguire a mano** nell'SQL editor di Supabase.
- `lib/staff/types.ts` — enum, etichette italiane e tipi delle righe.
- `lib/staff/auth.ts` — `requireStaff()` per le pagine server.
- `lib/staff/nav.ts` — le voci del menù, unica fonte.
- `app/staff/login` — email + password, `app/staff/logout` — POST.
- `app/staff/(dash)/layout.tsx` — gate di autenticazione + shell (rail su
  desktop, barra in basso su mobile), `staff.css` con i token e il motion.
- Home con i KPI reali che contano, e le altre voci come pagine "in arrivo"
  con la fase in cui atterrano.

### Primo accesso

1. Supabase → Authentication → Add user (email + password, conferma automatica).
2. SQL editor:
   ```sql
   insert into staff_profiles (id, nome, email, role)
   values ('<uuid-utente>', 'Nome Cognome', 'email@…', 'admin');
   ```
3. `bylumino.com/staff` → login.
