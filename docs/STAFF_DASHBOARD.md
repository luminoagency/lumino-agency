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

Il linguaggio dell'area interna è fissato da **`docs/design-refs/ref1.png`,
`ref3.png` e `ref4.png`**. Valgono per tutte le fasi e **sostituiscono per
intero** la sezione Design precedente: la dashboard scura con l'alone viola era
il classico pannello che sembra generato da un'AI, ed è stata buttata.
(`ref2.png` resta nella cartella ma non è più un riferimento.)

### L'idea

**La dashboard non è una pagina: è un oggetto di vetro appoggiato dentro una
stanza.** Dietro c'è un ambiente vero che si muove piano, davanti un pannello
smerigliato con dentro le card. È il modello di ref1 e ref4, ed è quello che
distingue un prodotto da un cruscotto.

Tre regole da cui discende tutto il resto:

1. **Base chiara.** Il fondo dell'interfaccia è la stanza, non un colore. Le
   card sono bianche o grigio perla traslucide; il **nero pieno** è un accento
   raro (ref4 «Living room», ref1 «Геометрия хаоса») e il viola è riservato a
   due cose sole — l'azione principale e la selezione.
2. **Gerarchia per scala, non per colore.** Il titolo di pagina è enorme e
   sottile come il «Dashboard» di ref1. Tutto il resto parla a voce bassa
   proprio perché il titolo grida.
3. **Densità vera.** Ogni card porta qualcosa da guardare — un grafico, un
   calendario, una mappa, un oggetto. Una card con dentro solo un numero grosso
   è il segno che manca il contenuto, non che il design è pulito.

### La scena

**Niente video.** C'era `bg.mp4` (1.8MB), ed è stato tolto: un `<video>` sotto un
`backdrop-filter` costringe il compositore a rifare la sfocatura a ogni
fotogramma del filmato, venticinque volte al secondo su tutta la larghezza del
pannello. Era la voce più cara della pagina, per una cosa che non si deve
nemmeno notare.

Al suo posto `components/staff/Sfondo.tsx`: **quattro macchie di colore che si
muovono piano e non si fermano mai**, nei toni Lumino — perla, crema, un filo di
rosa e uno di viola. Sono `radial-gradient` su quattro livelli, con durate
(48s, 61s, 73s, 89s) senza divisori in comune, così la composizione non torna mai
identica a sé stessa.

- Si anima **solo `transform`**. Ogni livello diventa una texture sulla GPU una
  volta sola e poi viene spostato: costa come far scorrere la pagina. Un blur
  animato o un gradiente che cambia colore obbligherebbero a rasterizzare mezzo
  schermo a ogni frame.
- La sfumatura la fa la **forma** del gradiente (`transparent 70%`), non un
  filtro: quattro `blur(80px)` grandi come la finestra sarebbero la cosa più
  costosa della pagina, e si vedrebbero uguali.
- È un Server Component: nessun JS, nessuna idratazione. Con
  `prefers-reduced-motion` resta il solo fondo fermo, che da solo deve già stare
  in piedi — e sta in piedi.
- Sopra, un velo appena accennato che scurisce gli angoli: dà un bordo alla
  stanza, senza il quale quattro macchie su fondo chiaro sembrano una texture.

### Colore e superfici

| Ruolo | Valore |
| --- | --- |
| Inchiostro | `#17130F`, secondario `rgba(23,19,15,.58)` |
| Card bianca | `rgba(255,255,255,.82)` |
| Card perla | `rgba(244,242,238,.58)` |
| Card nera | `#14120F` — una o due per schermata |
| Viola | `#8B5CF6` (azione, selezione), `#6D3FE0` per i testi su chiaro |
| Rosso | `#E5342A` — ritardo, errore, rifiuto |
| Verde | `#1F9D63` — chiuso, in linea |

Il pannello di vetro: `rgba(255,255,255,.5)`, `blur(22px) saturate(1.22)`, un
solo bordo chiaro sottile, raggio 34px, e un'ombra lunga e morbida. Si stacca
dalla stanza per l'ombra, non per il contorno.

**Il blur vive solo da 1040px in su.** Sotto quella soglia il pannello occupa
tutta la finestra, quindi sfocare il suo sfondo vuol dire ricalcolare una
sfocatura grande come lo schermo di un telefono a ogni fotogramma, sul
dispositivo che ha meno memoria per farlo: lì resta un bianco più coprente,
indistinguibile a vedersi e gratis. Il raggio è sceso da 34 a 22px per la stessa
ragione — sopra i venti pixel l'occhio non distingue più *quanto* è sfocato, ma
il tempo di calcolo continua a crescere.

**Il blur sta sul pannello e sugli strati che coprono** (dock, sheet, modale,
barra della visita, card di login) e **su nient'altro**: mai su una card, mai su
un callout. Due strati sfocati uno sopra l'altro si pagano due volte e si vedono
una.

### Tipografia

- **Manrope**, pesi 200–700. Titolo di pagina `clamp(2.5rem, 6.4vw, 4.6rem)` a
  **peso 200**, interlinea 0.96, `letter-spacing -0.045em`. I numeri grandi a
  peso 300.
- **Etichette in tondo minuscolo.** Il maiuscoletto spaziato è vietato ovunque:
  è la firma del pannello generico.
- Il logo resta il wordmark `LUMINO` con la I nel gradiente.

### Navigazione

- **Desktop:** rail nero stretto (74px) **dentro** il pannello, sole icone, con
  il nome al passaggio. La voce attiva è bianca piena.
- **Le sezioni non ancora costruite non fanno una lista.** Stanno dietro
  un'unica icona in fondo che le elenca in un tooltip. `lib/staff/nav.ts`
  esporta `FASE_VIVA`: a fine fase si alza di uno.
- **Mobile:** pill flottante in basso, in vetro (ref1), dove arriva il pollice.

### Componenti

- **Card bento** con `data-span` su 12 colonne, `data-tone` (`pearl` / `black` /
  `violet`) e `data-hover` per il riflesso.
- **Controlli veri** (ref4): `Toggle`, `Slider`, `Stepper`, `Segmented` con la
  pill che scivola. Tutti costruiti su elementi nativi travestiti dal CSS.
- **Chip** per le risposte a tocco (38px di altezza).
- **Lista + dettaglio** (ref3): colonna scura con le **iniziali** di ogni
  cliente e la riga selezionata in viola, pannello di dettaglio in gradiente
  viola con sotto-card traslucide.
- **Callout** con la linea che punta al dettaglio (ref4, l'aspirapolvere).

### Visualizzazioni

Sottili e in bianco/nero come ref1: **il colore lo porta il dato, non il
grafico**. Il viola compare solo su ciò che è selezionato o in corso.

- `Ring` — anello sottile, percentuale al centro.
- `Progress` — barra orizzontale con il valore a destra.
- `Lollipop` — gambo di 2px e pallino in cima, numero sopra.
- `AreaChart` — curva morbida, righello e punto luminoso, tooltip nero.
- `Spark` — il mini grafico dentro ogni card KPI: è ciò che impedisce alle
  caselle di essere numeri nudi.
- `Settimana` — i prossimi sette giorni con gli impegni in **pill nere**, lo
  scaduto in rosso appoggiato su oggi (ref1, il calendario).
- `Mappa` — **Leaflet vero**, con clustering. Era un piano cartesiano con dei
  cerchi disegnati a mano: con i dati veri i punti di Jesolo, Cavallino e Caorle
  si sovrapponevano e le etichette si coprivano fra loro, cioè proprio dove
  serviva leggere. Dettagli sotto.
- `FlussoTeam` — le ultime attività del team, dentro la card nera. Ha preso il
  posto della sfera cromata che girava: quella era un ornamento nel punto più
  guardato della schermata, ed era un errore di priorità, non di gusto. La card
  nera è l'accento che tiene in piedi una composizione tutta chiara e va spesa
  per qualcosa su cui si può agire.

### La mappa

`components/staff/Mappa.tsx` (l'involucro) + `MappaLeaflet.tsx` (il pezzo vero).
La usano la home e le Statistiche, e useranno il Lab AI: **un componente solo**.

- **Leaflet entra solo nel browser e solo dove serve.** `next/dynamic` con
  `ssr: false` e `import('leaflet')` dentro l'effetto: Leaflet tocca `window`
  mentre si carica, e comunque sono ~180KB che una pagina senza mappa non deve
  pagare. La cornice con la sua altezza esiste dal primo dipinto, così la card
  non salta quando la mappa arriva.
- **Le tile sono quelle standard di OpenStreetMap**, schiarite e desaturate dal
  CSS (`filter: saturate(.08) brightness(1.08) contrast(.92)` sul tile pane): il
  risultato è il grigio perla di Positron. Il filtro è statico, si applica una
  volta per tile.
- **Perché non CartoDB Positron**, che nasce già grigio: oggi vuole una chiave.
  `basemaps.cartocdn.com` risponde con una tile segnaposto da 2KB con scritto
  «API KEY REQUIRED» — e lo fa con uno `200 OK`, quindi Leaflet la disegna senza
  lamentarsi e la mappa sembra funzionare finché non la si guarda. Stadia Maps
  fa di peggio: senza account funziona in locale e smette di funzionare sul
  dominio vero, cioè si rompe dopo il deploy. OSM non chiede chiavi e la sua
  policy d'uso copre un'applicazione interna come questa; il giorno che non
  bastasse, qui si cambia una stringa.
- **L'attribuzione è obbligatoria** (licenza ODbL) e sta in basso a destra. È
  rivestita come il resto, non nascosta.
- **I punti vicini si sommano** (`leaflet.markercluster`): a livello di regione
  un disco con «12» dice più di dodici pallini sovrapposti. Il numero del cluster
  è la somma dei clienti, non dei marker. Il raggio cresce con la **radice
  quadrata**: l'occhio confronta le aree.
- **Il nome sta nel popup, non sulla mappa.** Le etichette fisse erano il difetto
  peggiore della versione precedente.
- Lo scroll della pagina **non** zooma la mappa: su una dashboard che si scorre è
  il modo più rapido di perdere il segno.

### Movimento

**Si animano solo `transform` e `opacity`.** Sono le due proprietà che il
compositore sa muovere senza ridisegnare: tutto il resto — `filter`, `height`,
`background` — obbliga a rasterizzare di nuovo l'elemento a ogni fotogramma.

- Card in cascata (stagger 50ms), numeri che contano, barre e archi che si
  disegnano. Il **blur-in** che c'era in entrata è stato tolto: l'idea era bella
  ma costava una rasterizzazione di dodici card per ogni fotogramma di mezzo
  secondo, sopra un pannello già sfocato — ed era il mezzo secondo in cui si
  guarda.
- Il gambo del `Lollipop` cresce in `scaleY` e non in `height`, che rimetteva in
  coda il layout di tutta la colonna sette volte per fotogramma.
- `Tilt` — inclinazione di 4 gradi al massimo e riflesso che segue il puntatore,
  scrivendo `--mx/--my`. Solo dove c'è un puntatore fine. **Misura i rettangoli
  una volta** e li rimisura solo su scroll, resize o cambio del DOM; lavora una
  volta per fotogramma (`requestAnimationFrame`) e tocca la sola card sotto il
  puntatore. La prima versione faceva una `querySelectorAll` e un
  `getBoundingClientRect()` per ogni card a **ogni** `pointermove`: misurato in
  pagina, 1.42ms per evento contro 0.01ms, cioè 135 volte tanto, e ogni misura
  era un layout forzato. Era la causa principale dello scatto della home.
- Le macchie dello sfondo si muovono lente e continue; il punto «live» pulsa.
- Trascinamento del kanban con la card che si inclina e sbiadisce.
- **Tutto si spegne con `prefers-reduced-motion`**, e anche in una scheda in
  secondo piano: lì `requestAnimationFrame` non gira e GSAP resterebbe
  congelato a metà dissolvenza.

### Vietato

Sono le cose che facevano sembrare la versione precedente un pannello generato:

- fondo quasi nero con alone viola;
- card vuote con dentro solo un numero gigante;
- etichette in MAIUSCOLO spaziato;
- card tutte uguali con bordo scuro;
- blocco viola pieno usato come decorazione;
- sidebar con l'elenco delle sezioni «in arrivo»;
- eyebrow con ✦ e numerazioni 01/02/03;
- gradiente come maschera del testo (l'eccezione storica è la I del wordmark).

Pill e card bento restano: qui sono volute.

### Dati demo

Un'interfaccia vuota non si può giudicare. `lib/staff/demo.ts` contiene
**25 locali veneti** con storie diverse (chi ha detto di no, chi ha pagato
l'acconto, chi ha un rinnovo la settimana prossima), date sempre relative a
oggi e nessun `Math.random()` — server e browser devono disegnare gli stessi
numeri.

- Nel database vivono con `is_demo = true` (migration **0031**) e si vedono solo
  se un **admin** accende l'interruttore nel rail. Il filtro è applicato in
  memoria, non nella query: così su un database senza la colonna non si rompe
  niente.
- `npm run staff:seed` li inserisce, `npm run staff:seed:clean` li cancella.
- **Anteprima di sviluppo:** con `STAFF_DEV_PREVIEW=1` in `.env.local` le pagine
  di /staff si aprono in locale **senza login e senza toccare Supabase**, su
  `/staff/anteprima`. Due lucchetti (`NODE_ENV !== 'production'` più la
  variabile) e sola lettura. Fuori da lì la route non esiste.

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
| F4 | soldi + progetti + statistiche | fatta |
| F5 | lab AI + risorse + team + placeholder agent | da fare |

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

### Cosa è già in piedi (F4)

`FASE_VIVA` passa a **4**. La voce **Team** dichiarava `fase: 4` ma non è nella
F4 del piano: è stata spostata a 5, altrimenti alzando `FASE_VIVA` sarebbe
comparsa nel rail un'icona che porta a una pagina «in arrivo».

Le letture stanno in `lib/staff/f4.ts` e non in `queries.ts` per una ragione
precisa: quello importa `storage.ts`, che importa la service-role per firmare le
foto del Campo. Tre pagine che non mostrano una foto non devono avere quella
chiave nel grafo dei propri import.

Tutte le somme si fanno **in memoria e non in SQL**: con centinaia di righe la
differenza è irrilevante, e in cambio il filtro dei dati demo resta applicabile
dopo la lettura (vedi `demo.ts`) e la RLS resta l'unica regola su chi vede cosa,
senza viste o funzioni da tenere in pari.

- **`app/staff/(dash)/soldi`** — acconti al 30 e saldi al 70, abbonamenti,
  modifiche extra, e per il solo admin il margine. Incassato e residuo si
  ricavano dalle due spunte, mai da un campo «pagato» aggiornato a mano. Nella
  card **nera** ci sono i solleciti, ordinati dal credito più vecchio: è la sola
  cosa della pagina su cui si può agire oggi, e il nero è dove l'occhio va per
  primo. Il grafico mette ogni incasso nel mese in cui è **entrato**, non in
  quello della firma.
  I margini si leggono solo per l'admin, e non per una `if` di cortesia: la RLS
  di `staff_deal_margins` non dà le righe a un venditore. La richiesta si evita
  perché sarebbe a vuoto — la protezione sta nel database.
- **`app/staff/(dash)/progetti`** — la fase di ogni sito (cinque tacche, non una
  barra continua: un sito non è «al 62% del design», è in design), il link
  all'anteprima, il dominio. Nella card **nera** i domini in scadenza, con i già
  scaduti in cima: un dominio scaduto è un sito offline, cioè un cliente che
  telefona, ed è l'unica urgenza della sezione.
- **`app/staff/(dash)/statistiche`** — tasso di chiusura, prezzo medio, giorni
  medi dalla proposta alla firma, i tre tagli (settore, zona, venditore), la
  mappa Leaflet grande e, nella card **nera**, le obiezioni sentite in campo con
  le frasi testuali dei titolari.
  **Il tasso si calcola sulle trattative decise** (`accettato` + `rifiutato`),
  non su tutti i clienti in archivio: contare anche chi è ancora «da contattare»
  farebbe scendere il numero a ogni import di lead, cioè peggiorerebbe il
  risultato proprio mentre si lavora di più. Un tasso che punisce il lavoro non
  lo guarda nessuno due volte. Il rovescio è che con pochi dati balla, e ogni
  percentuale porta accanto il suo denominatore («3/4», «su 7 decise») — un
  numero grosso senza denominatore è la cosa più vicina a una bugia che una
  dashboard possa dire.

La F4 **non ha aggiunto tabelle**: `staff_deals`, `staff_deal_margins`,
`staff_subscriptions`, `staff_projects` e `staff_extra_changes` erano già nella
0030. Ha aggiunto la migration **0032**, che mette `is_demo` su
`staff_extra_changes` — la 0031 l'aveva saltata perché fino alla F3 nessuno
leggeva quella tabella, e senza la colonna gli extra finti finirebbero nei totali
veri a interruttore spento. La stessa migration porta tre indici di lettura per
le pagine nuove.
