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

Il linguaggio dell'area interna è fissato dai tre riferimenti in
`docs/design-refs/` (`ref1.png`, `ref2.png`, `ref3.png`). **Valgono per tutte le
fasi** e sostituiscono le regole di design precedenti di questo file: le pill e
le card bento qui sono volute, non un ripiego da template.

### Impianto

- **Bento**: griglia di card, raggio grande (24–32px), spaziature ampie.
  Gerarchia tipografica per contrasto di scala — numero molto grande, etichetta
  molto piccola in maiuscoletto (ref1).
- **Base scura, contrasto chiaro**: pagina `#0E0B0A`, card scure su `--void
  #171210` con bordo sottile semi-trasparente. Alcune card in `--cream #F4EEE4`
  per contrasto, come la colonna chiara di ref1/ref2. Il chiaro è un accento:
  una o due card per schermata, non metà.
- **Glow**: alone radiale sfumato viola/rosa fisso sullo sfondo (ref3), e un
  glow morbido dietro le card che contano. Il gradiente firma
  `linear-gradient(100deg, #E5342A, #EC6A9C 46%, #8B5CF6)` si usa **solo** per
  questi aloni, per la voce di menù attiva e per le evidenziazioni — mai come
  maschera sul testo (l'eccezione storica è la I del wordmark).

### Colore

- `--violet #8B5CF6` è il colore di selezione e dell'azione principale (ref3):
  bottone primario, pill attiva, riga selezionata, focus.
- `--red #E5342A` resta per il ritardo, l'errore e il rifiuto.
- `--cream #F4EEE4` per il testo, `--cream-dim #B9AEA1` per il secondario.
- Il **pannello di dettaglio** dell'elemento selezionato è in gradiente viola
  pieno, con sotto-card interne traslucide (ref3).

### Componenti

- **Pill**: tab, filtri e range di tempo sono pill — attiva piena in viola,
  inattive in outline (ref3). La barra dei filtri mostra un contatore
  "Filtri attivi · N" e un azzeramento.
- **Glass**: blur + trasparenza su navigazioni flottanti, modali e overlay
  (ref2).
- **Navigazione**: desktop = sidebar a sinistra, voce attiva in gradiente
  morbido (ref3); mobile = nav a pill flottante in basso, in glass (ref2).
- **Grafici**: area chart con linea morbida, tooltip e punto luminoso (ref3);
  anelli di progresso circolari con la percentuale al centro (ref1, ref2);
  barre lollipop o arrotondate (ref2); barre orizzontali di progresso (ref2).
- **Header di pagina**: titolo grande + sottotitolo piccolo + azione principale
  a destra. La home apre con "Ciao, [nome]" col nome in viola (ref3) e la barra
  "Chiedi a Lumino AI" (ref3), disabilitata finché manca la chiave.

### Tipografia

- **Manrope** (Google Fonts) per tutta l'interfaccia e per i numeri: i pesi
  700/800 reggono i numeri grandi senza bisogno di un secondo carattere.
- Il logo resta il wordmark `LUMINO` attuale, con la I nel gradiente
  (`components/home/Wordmark.tsx`).

### Movimento (GSAP)

- Card che entrano a cascata (stagger corto, 40–60ms).
- Numeri che contano.
- Hover: leggero lift + glow.
- Transizioni morbide tra pagine.
- Tutto si spegne con `prefers-reduced-motion`.

### Regole ferme

- **Mobile-first**: i venditori la usano per strada, con una mano.
- Vietato: eyebrow con ✦, numerazioni 01/02/03, gradiente come maschera del
  testo, card generiche senza gerarchia (una card è tale se ha un numero o un
  grafico, non se contiene solo una riga di testo).

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
| F2 | pipeline + scheda cliente + import CSV dei lead | fatta |
| F3 | campo + follow-up | fatta |
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

### Cosa è già in piedi (F2)

Stesso branch, stesso stile: la F1 è stata rifatta con il linguaggio dei
riferimenti (bento, viola, pill, glass) prima di aggiungere le pagine nuove.

- `components/staff/` — i pezzi del sistema, riusabili dalle fasi successive:
  `Cascade` (entrata a cascata GSAP), `Counter` (numeri che contano), `Ring`
  (anello con la percentuale), `Bars` (`Progress` e `Lollipop`), `AreaChart`
  (curva morbida con tooltip e punto luminoso), `Filters` (barra a pill con
  contatore), `Modal` (glass, Esc, fuoco restituito), `MotivoRifiuto`,
  `PageHead` + `StatoPill`, `ClienteCardBody`, `fonts.ts` (Manrope).
- `app/staff/staff.css` — riscritto: token, bento, pill, glass, kanban, split
  view, tabella di anteprima, campi.
- `app/staff/(dash)/pipeline` — KPI per stato (cliccabili come filtro), barra
  filtri (settore, zona, assegnato a, stato) con ricerca, kanban con drag &
  drop HTML5 nativo su desktop e tab a pill + lista su telefono. Lo spostamento
  è ottimista e torna indietro se la RLS rifiuta.
- `app/staff/(dash)/clienti` — vista a lista: elenco a sinistra (selezionato in
  viola), pannello di dettaglio a destra in gradiente con sotto-card
  traslucide.
- `app/staff/(dash)/clienti/[id]` — scheda cliente: anagrafica, trattativa con
  l'anello 30/70, abbonamento, progetto con la barra di fase, timeline delle
  attività.
- `app/staff/(dash)/clienti/nuovo` — modulo nuovo cliente (solo il nome è
  obbligatorio).
- `app/staff/(dash)/clienti/importa` + `lib/staff/csv.ts` — import CSV in tre
  passi: file, mappatura delle colonne indovinata dalle intestazioni e
  correggibile, anteprima delle righe già mappate.
- `lib/staff/actions.ts` — `cambiaStato`, `creaCliente`, `importaClienti`.
  Il motivo del rifiuto è obbligatorio qui e nel check constraint.
- `lib/staff/queries.ts` — `caricaClienti()`, la lettura condivisa fra pipeline
  e vista a lista.

### Cosa è già in piedi (F3)

Stesso branch, stesso linguaggio. La voce «Campo» smette di essere un
segnaposto: `lib/staff/nav.ts` esporta ora `FASE_VIVA`, e a fine di ogni fase
si alza quel numero invece di falsificare la fase delle voci appena costruite.

- `components/staff/Chips.tsx` — `Chips` (scelta multipla), `ChipsOne` (scelta
  singola, si spegne ritoccandola), `ChipsSiNo` (con il «non chiesto», perché
  esiste). Bersagli da 38px: si usano col pollice.
- `components/staff/VoiceNote.tsx` — dettatura con la Web Speech API del
  browser (`it-IT`, gratis). Riparte da sola quando Chrome chiude la sessione
  dopo un silenzio, e scrive dentro un campo modificabile: il riconoscimento
  sbaglia i nomi propri e i dialetti, e qui si parla di quelli. **Nessun audio
  viene salvato**, solo il testo. Dove l'API non c'è (Firefox) resta il campo.
- `components/staff/PhotoPicker.tsx` — `capture="environment"`, ridimensiona in
  canvas a 1600px/JPEG prima di inviare, carica subito una per una. Togliere
  una foto la cancella davvero dal bucket: si carica prima del salvataggio,
  quindi senza questo gli orfani si accumulerebbero.
- `lib/staff/storage.ts` — bucket **privato** `staff-field` e firma in blocco
  degli URL (un'ora). Sta a parte da `queries.ts` perché importa il
  service-role. Il bucket è già creato sul progetto di produzione ed è
  documentato in `supabase/storage-buckets.md`.
- `app/staff/(dash)/campo` — KPI (visite a 7 giorni, da richiamare oggi, in
  ritardo) e due tab a pill: **Visite** e **Follow-up**. Si apre sui follow-up
  quando ce n'è almeno uno scaduto. I richiami si chiudono, si riaprono e si
  rimandano di 3 o 7 giorni; il rinvio si conta da oggi e non dalla scadenza
  vecchia, altrimenti un arretrato rimandato resterebbe nel passato. La riga
  sparisce subito e torna se la scrittura fallisce.
- `app/staff/(dash)/campo/nuova` — la visita in tre passi: **Chi** (ricerca in
  memoria su nome, città, zona e indirizzo, più «Non è in elenco» che crea il
  cliente sul posto), **Come lavora** (prenotazioni, strumenti, lingue,
  turisti, commissioni pagate), **Com'è andata** (reazione, obiezione, frase
  del titolare, problemi, nota vocale, foto, GPS, nuovo stato, richiamo). Solo
  il cliente è obbligatorio e si può salvare da qualunque passo: una visita a
  metà vale più di una visita non registrata. La barra delle azioni sta in
  fondo allo schermo sul telefono.
- Il GPS si chiede **entrando nel terzo passo**, non all'apertura: il permesso
  del browser è una finestra che copre tutto, e chiederlo mentre si cerca il
  cliente vuol dire vederlo negare. Negato o assente, la visita si salva lo
  stesso con `lat`/`lng` a `null`.
- `app/staff/(dash)/clienti/[id]/SchedaAzioni.tsx` — dalla scheda: **Modifica**
  (anagrafica completa in una modale larga), **Attività** (chiamata, messaggio,
  nota; la visita no, quella si registra dal Campo) e **Richiamo**. Lo stato
  non si cambia da qui: si sposta dalla pipeline, dove il rifiuto chiede il
  motivo. Due porte sullo stesso dato sono due porte per dimenticarsene una.
- La scheda cliente mostra ora anche **Richiami** e **Report di campo**, con le
  foto firmate.
- `lib/staff/actions.ts` — `aggiornaCliente`, `salvaVisita`, `creaAttivita`,
  `creaFollowup`, `aggiornaFollowup`, `caricaFoto`, `eliminaFoto`.
  `salvaVisita` scrive il report **per primo** e poi attività, stato e
  richiamo: non è una transazione (PostgREST non ne offre), e se cade una
  scrittura successiva resta comunque il dato che costa raccogliere.
- `lib/staff/queries.ts` — `caricaCampo`, `clientiPerVisita`,
  `reportDiCliente`, `followupDiCliente`.
- `lib/staff/types.ts` — il vocabolario del campo (gestioni, strumenti, lingue,
  reazioni, obiezioni) e gli aiuti `etichetta`, `oggiISO`, `quando`. Le colonne
  di `staff_field_reports` non hanno check constraint: il vocabolario è una
  proposta, non un cancello, perché un insert rifiutato in mezzo a una visita
  costa più di un valore fuori elenco.

La F3 non ha aggiunto tabelle: `staff_field_reports`, `staff_followups` e
`staff_activities` erano già nella 0030. Ha aggiunto **un bucket Storage**.

Non c'è ancora: gestione delle trattative (deal, acconti, abbonamenti), che
arriva con la F4 insieme a Soldi e Progetti.
