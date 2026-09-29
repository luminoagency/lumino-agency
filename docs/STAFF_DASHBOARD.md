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

**Una fotografia.** `public/staff/stanza.webp`, 45 KB: un interno luminoso con
vetrate a tutta altezza, una lama di sole che taglia la parete e cade sul
pavimento, il legno in primo piano. Viene da Pexels, licenza libera, nessuna
attribuzione dovuta.

Qui prima ci sono stati un video (`bg.mp4`, 1.8 MB — troppo caro: un `<video>`
sotto un `backdrop-filter` fa rifare la sfocatura venticinque volte al secondo)
e poi una stanza disegnata coi gradienti — due vetrate, un orizzonte, una pozza
di luce. Il secondo tentativo costava zero byte ed è stato buttato lo stesso: una
stanza fatta di campiture non ha prospettiva, ha strati. Sembrava un muro dipinto
bene, e il pannello non ci galleggiava davanti, ci era appoggiato sopra.

L'obiezione al ritorno della fotografia era il peso, 150-250 KB. Non è successo:
**la sfocatura è cotta nel file**, e una foto senza dettaglio fine non ha quasi
niente da codificare. Cinque pixel di sfocatura su 1920 e il file crolla a 45 KB
— meno di una foto profilo, per una stanza intera. Cotta e non lasciata a
`filter: blur()` anche per il secondo motivo: quello che il browser sfoca, il
browser può decidere di ridisegnarlo a ogni fotogramma; una texture no.

**Per cambiare stanza:** `node scripts/sfondo-staff.mjs <foto.jpg>`. Lo script
ridimensiona a 1920, desatura un filo, sfoca e riscrive il webp. Non c'è
nient'altro da toccare, né nel CSS né in `components/staff/Sfondo.tsx`.

- Si anima **solo `transform` e `opacity`**, su due livelli soli — la stanza
  (zoom lentissimo, 96s) e un alone di luce che le passa davanti (137s). Durate
  senza divisori in comune: la composizione non torna mai identica. Ogni livello
  è una texture sulla GPU che viene spostata, non ridisegnata.
- Sopra, un **velo chiarissimo nei toni Lumino** — bianco caldo al centro, un
  soffio di viola in basso — più una vignettatura. La schiarita sta qui e non nel
  file: un file schiarito perde la struttura di toni, e senza quella la stanza
  vista attraverso il vetro torna a essere una foschia bianca.
- È un Server Component: nessun JS, nessuna idratazione. Con
  `prefers-reduced-motion` resta la stessa stanza, ferma.

### Colore e superfici

| Ruolo | Valore |
| --- | --- |
| Inchiostro | `#17130F`, secondario `rgba(23,19,15,.58)` |
| Card bianca | `rgba(255,255,255,.84)` |
| Card perla | `rgba(244,242,238,.70)` |
| Card nera | `#14120F` — una o due per schermata |
| Viola | `#8B5CF6` (azione, selezione), `#6D3FE0` per i testi su chiaro |
| Rosso | `#E5342A` — ritardo, errore, rifiuto |
| Verde | `#1F9D63` — chiuso, in linea |

Il pannello di vetro: `rgba(255,255,255,.34)`, `blur(12px) saturate(1.3)
brightness(1.04)`, un bordo chiaro sottile, un riflesso morbido sul quarto alto,
raggio 32px, e un'ombra lunga. Si stacca dalla stanza per l'ombra, non per il
contorno.

Bianco e sfocatura sono scesi insieme quando dietro è arrivata la fotografia:
metà bianco più venti pixel di sfocatura sopra una stanza chiara **danno
bianco**, cioè carta invece di vetro. La stanza è già sfocata nel file, quindi
qui non serve rifare quel lavoro — bastano dodici pixel per ammorbidire il bordo
della lastra, e quello che resta si vede *attraverso*, che è il punto. Per la
stessa ragione le card sono salite di opacità: dove sotto capita il camino o il
legno, un grafico sottile in bianco e nero non si leggeva più.

**Il blur vive solo da 1040px in su.** Sotto quella soglia il pannello occupa
tutta la finestra, quindi sfocare il suo sfondo vuol dire ricalcolare una
sfocatura grande come lo schermo di un telefono a ogni fotogramma, sul
dispositivo che ha meno memoria per farlo: lì resta un bianco più coprente
(`.82`, perché senza sfocatura la fotografia arriva quasi intera sotto il testo),
indistinguibile a vedersi e gratis.

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
- **Niente sotto i 13px.** Tutta la scala è stata alzata di un decimo, con un
  pavimento a `0.82rem`: le etichette secondarie stavano a `0.62–0.72rem`, cioè
  dieci-undici pixel, ed erano decorazione più che testo. Dove l'aumento ha
  fatto saltare un ingranaggio è stato l'ingranaggio a cedere — il rail aperto è
  passato da 214 a 236px e ha stretto gli interstizi, perché dodici voci più il
  piede tornassero dentro uno schermo da 1080.

### La misura del pannello

Il pannello **occupa quasi tutto lo schermo**: `--bordo` (1.15rem) di stanza
intorno, `--vetro` (0.5rem) di gioco dentro la lastra, `--dentro` per il respiro
della colonna. Tre numeri, dichiarati una volta in cima a `staff.css`, perché
tre cose diverse ci si appoggiano: il margine, lo `sticky` del rail e quello del
conto alla rovescia. La loro somma è `--sopra`, cioè dove comincia il vetro
contando dal bordo alto della finestra.

**Nessun tetto alla larghezza.** C'era `max-width: 1660px`: su uno schermo da
1920 restavano centotrenta pixel di stanza per lato, e un pannello che — tolte
tre cornici annidate — dava milleduecento pixel al contenuto. Un numero più
grande non risolve, sposta il buco più in là. Qui dentro non c'è prosa da
leggere per righe, c'è una griglia a dodici colonne, e una griglia più larga è
una griglia migliore.

**Scorre la pagina, non la colonna.** C'era `max-height: calc(100dvh - 8rem)` e
`overflow-y: auto` sul contenuto: una barra interna che si prendeva i suoi pixel
alla colonna invece che alla finestra, e che faceva fare alla rotellina due cose
diverse a seconda di dove stava il puntatore. Il prezzo del cambio è che il rail
e il conto alla rovescia se lo devono fare da soli, con `position: sticky`
agganciato a `--sopra`. E che `<body>` non può più avere `overflow-x: hidden`,
che lo rendeva un contenitore di scorrimento e spegneva ogni `sticky` dentro:
in `globals.css` ora c'è `overflow-x: clip`, che taglia uguale senza creare il
contenitore.

### Navigazione

- **Desktop:** rail nero **dentro** il pannello, che **si apre al passaggio del
  mouse** (74 → 214px) e mostra le etichette accanto alle icone. Chi la vuole
  sempre aperta la blocca col bottone in alto, e la scelta resta in
  `localStorage` (è del dispositivo: sul portatile da 13" la si tiene chiusa,
  sul monitor grande aperta). La voce attiva è bianca piena.
- **L'apertura non sposta il contenuto.** Il pannello nero è assoluto dentro un
  segnaposto da 74px: allargandosi passa *sopra* la pagina. Due guadagni in uno
  — il testo che si sta leggendo non scappa da sotto gli occhi mentre il
  puntatore attraversa la barra, e la larghezza che cresce non rimette in coda
  il layout delle dodici card accanto a ogni fotogramma. `width` non si anima
  gratis: l'unica difesa è limitare cosa c'è dentro il rettangolo che cambia.
  Solo il caso «bloccata» allarga il segnaposto per davvero, e succede al clic.
- **Undici voci in tre blocchi**, separati da un filo sottile e, a barra aperta,
  da un titolino. La divisione non è per argomento ma per momento della
  giornata: *ogni giorno* (Oggi, Pipeline, Clienti, Campo) è quello che si apre
  entrando e si usa in strada, *gestione* (Soldi, Progetti, Statistiche, Team)
  è quello che si guarda una volta la settimana stando fermi, *risorse*
  (Risorse, Lab AI, Ricerca Agent) è quello che si apre quando serve qualcosa.
  Sta in `GRUPPI` / `navPerGruppi()` in `lib/staff/nav.ts`, e i blocchi vuoti
  non disegnano un separatore con niente sotto.
- **Un'icona per voce, tutte diverse.** Erano doppie in tre punti — Clienti e
  Team avevano la stessa `Users`, Lab AI e Ricerca Agent lo stesso `Bot`, e
  «Oggi» era un sole, che vuol dire «giorno» e non «cosa devo fare». Due icone
  uguali in una barra di undici rendono inutili tutte e undici.
- **Il tooltip resta**, e ha ancora un compito: l'apertura ha 150ms di ritardo,
  quindi puntando un'icona il nome compare *prima* che la barra si apra e tace
  quando l'etichetta vera prende il suo posto. Fuori da quella finestra serve
  dove l'apertura al passaggio non c'è — sotto le dita e da tastiera.
- **Le sezioni non ancora costruite non fanno una lista.** Stanno dietro
  un'unica icona in fondo che le elenca in un tooltip. `lib/staff/nav.ts`
  esporta `FASE_VIVA`: a fine fase si alza di uno.
- **Mobile:** pill flottante in basso, in vetro (ref1), dove arriva il pollice,
  con **l'etichetta sotto l'icona** e non accanto. Di fianco, cinque voci su uno
  schermo da 375px stavano solo perché la barra scorreva in orizzontale: la
  quinta esisteva e non si vedeva. In colonna ci stanno tutte, e su un telefono
  non c'è un passaggio del mouse a cui chiedere cosa vuol dire un'icona.
- `/staff/io` (le proprie impostazioni) **non è nel rail**: si apre dal proprio
  nome in fondo alla barra, che è dove tutti la cercano. `activeHref()` fa
  combaciare `/staff` solo in modo esatto — come prefisso è il prefisso di tutta
  l'area, e su una pagina fuori elenco accenderebbe «Oggi», cioè indicherebbe
  una pagina su cui non si è.

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
- gradiente come maschera del testo. Le eccezioni sono **due e sole due**: la I
  del wordmark, e il **nome nel saluto della home** — è il nome della persona
  appena entrata, compare una volta per schermata e si spegne nella versione
  compatta di tutti i giorni. Su un'etichetta qualsiasi resta vietato.

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
- `staff_profiles`: dalla **0033** anche `ruolo_titolo` (il biglietto da visita
  — «CCO» — che **non** ha effetti sui permessi: quelli stanno in `role`),
  `saluto_custom` (la riga sotto il saluto della home) e `foto_url` (un
  percorso dentro il bucket privato `staff-avatars`, non un URL).

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
| F5 | lab AI + risorse + team + placeholder agent | fatta |

A fine di ogni fase: build pulita, commit, una riga su cosa si è fatto.

Quello che la F5 ha aggiunto — Lab AI, Risorse, Team, la 0034, il rimedio al lag
e il widget della preghiera che si trova da sé — sta in
[`STAFF_DASHBOARD_F5.md`](./STAFF_DASHBOARD_F5.md), insieme al motivo per cui
**le migration non si incollano più a mano**.

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

### Cosa è già in piedi (F5-bis · la persona e la preghiera)

Non è una fase del piano: è il giro che rende l'area *di qualcuno*. Prima
funzionava e non diceva con quale account fosse aperta, e il rail era una
colonna di undici pittogrammi.

Ha aggiunto la migration **0033** — tre colonne su `staff_profiles` — e un
secondo bucket Storage. Niente tabelle nuove.

#### Il rail che si apre

Vedi la sezione **Navigazione**: barra che si allarga al passaggio, blocco
salvato in `localStorage`, tre gruppi separati, un'icona diversa per voce,
etichette sotto le icone sul telefono.

#### Il profilo è una persona

- `staff_profiles` guadagna `ruolo_titolo`, `saluto_custom` e `foto_url`
  (migration **0033**).
- **`ruolo_titolo` non è `role`, ed è il motivo per cui sono due colonne.**
  `role` vale `admin | sales`, lo legge la RLS e decide *cosa si vede*;
  `ruolo_titolo` è il biglietto da visita («CCO», «Head of Sales») e non decide
  niente. Con una colonna sola, rinominare un ruolo in azienda toglierebbe a
  qualcuno l'accesso ai margini.
- `foto_url` è un **percorso dentro il bucket**, non un URL: `staff-avatars` è
  privato e l'indirizzo guardabile è una firma che scade. Il nome resta
  `foto_url` per coerenza con `staff_field_reports.foto`, che contiene percorsi
  per la stessa ragione.
- **Nessuna policy di scrittura in più**, ed è la parte che conta. La 0030 dà
  l'update su `staff_profiles` al solo admin; aprirla a «ognuno può modificare
  la propria riga» sembra naturale ed è un buco, perché la RLS decide per
  *righe* e non per colonne: quella stessa policy darebbe a un venditore anche
  `role`, `attivo` e `obiettivo_mensile`, cioè il modo di promuoversi ad admin.
  Le tre colonne le scrive `aggiornaProfilo()` con il service-role su un elenco
  fisso di campi, con l'id preso da `requireStaff()` e mai dal chiamante. È
  l'unico modo di limitare una scrittura a una colonna.
- `requireStaff()` legge ora con `select('*')`: nominare le colonne nuove
  farebbe fallire *ogni* pagina di /staff su un database dove la 0033 non è
  passata — cioè chiuderebbe l'area invece di mostrarla senza foto. È la stessa
  scelta della home per `is_demo`. Le tre colonne si normalizzano a `null`
  all'uscita, perché `undefined` in un attributo React stampa la stringa vuota
  invece di far scattare il fallback delle iniziali.

#### La foto

- Bucket privato **`staff-avatars`**, firme da **sei ore** (non una, come le foto
  di campo: un avatar sta nel rail di *tutte* le pagine, e una firma scaduta a
  metà giornata farebbe diventare la propria faccia un'iniziale senza che
  nessuno abbia fatto niente). `lib/staff/avatar.ts`, documentato in
  `supabase/storage-buckets.md`.
- `components/staff/AvatarUpload.tsx` — **il ritaglio è vero, non un
  `object-fit: cover`.** La scorciatoia sarebbe lasciar tagliare al cerchio, ma
  il taglio automatico prende il centro geometrico dell'immagine, e in una foto
  di una persona il centro geometrico è quasi sempre il petto: il risultato è
  una galleria di avatar decapitati. Qui si trascina e si stringe, e quel che si
  vede nel cerchio è quel che viene salvato. Il canvas esporta 512px JPEG prima
  di inviare: allo Storage gratuito arrivano ~40KB invece di tre mega, e sul
  server non c'è niente da ridimensionare.
- La maschera dell'anteprima è un **anello** e non un cerchio pieno: si vede
  anche quello che resta fuori dal taglio, ed è l'unico modo di capire dove si
  sta trascinando.
- La foto precedente si cancella **dopo** che la nuova è stata scritta: un
  errore a metà lascia una foto in più, non zero. Se la riga non si aggiorna, la
  foto appena caricata se ne va subito invece di restare orfana.
- `scripts/staff-avatar.mjs` — carica la foto di un collega dal terminale, prima
  che abbia fatto il primo login: crea il bucket se manca, risolve l'id
  dall'email in `auth.users`, taglia al centro con sharp, carica e scrive
  `foto_url`. Il taglio al centro è il meglio che si possa fare senza qualcuno
  che trascini; se viene male si rifà da `/staff/io` in dieci secondi.

#### Il saluto

`components/staff/Saluto.tsx`, al posto del «Ciao, Marco» a corpo di titolo.
Faccia grande, ruolo davanti al nome, lettere che salgono.

- **Il saluto lungo vale una volta al giorno.** Un'animazione che si rifà a ogni
  navigazione sulla home diventa un pedaggio: la prima volta è bella, la
  quindicesima è un ritardo fra sé e il lavoro. Dal secondo passaggio resta la
  stessa intestazione, in scala ridotta e ferma.
- **La decisione sta in una variabile di modulo, non dentro l'effetto.** Dentro
  l'effetto era «leggo il registro e subito lo firmo», cioè una funzione che
  cambia ciò che sta misurando: in sviluppo React monta ogni componente due
  volte di proposito, quindi la prima esecuzione firmava e la seconda trovava la
  firma — il saluto lungo non compariva **mai**, e lo stesso sarebbe successo a
  ogni Fast Refresh o rimontaggio.
- **Le parole sono le stesse nelle due versioni**, cambia la scala e cosa è
  visibile: è così che il server disegna un markup valido per entrambe senza
  errori di idratazione. La riga in base all'ora si scrive dopo il montaggio (il
  server sta su UTC e direbbe l'ora sbagliata) e il suo spazio è riservato, così
  la riga sotto non salta.
- **Le lettere salgono in due tempi, e non per gusto.** Mentre una lettera ha
  una `transform` addosso esce dal livello di disegno del genitore, e il
  genitore è l'`em` che porta il gradiente in `background-clip: text`: il
  gradiente non raggiunge più quei glifi e il nome resta **trasparente su fondo
  chiaro, cioè invisibile**. Vale per `will-change: transform` allo stesso modo,
  che infatti è stato tolto. Quindi: durante la salita ogni lettera porta il
  proprio inchiostro, e a 1.25s — atterrata l'ultima — l'inchiostro sfuma verso
  `transparent` e sotto compare il gradiente. Il nome **atterra e poi si
  accende**, che è meglio di quel che si voleva all'inizio. Il riempimento
  dell'animazione è `backwards` e non `both`: `both` lascerebbe applicata la
  trasformazione finale, e con lei la promozione a livello.

#### Il promemoria della preghiera

Widget nella shell, quindi visibile da ogni pagina. Chiuso è una pill (preghiera
prossima, quanto manca, a che ora); aperto è un pannello con i cinque orari, la
città, un'ayah e le impostazioni.

- **Montato una volta sola e spostato dal CSS** — in alto a destra sul pannello,
  pill in cima sul telefono. Due istanze nascoste a vicenda da un media query
  sembrerebbero la strada ovvia e sarebbero due conti alla rovescia che battono
  insieme e **due notifiche per ogni orario**.
- **`adhan`, non un'API.** Sono formule astronomiche, non dati: il calcolo è
  offline, istantaneo, senza chiavi e senza un servizio che possa spegnersi.
  Un'API degli orari vorrebbe dire una chiamata di rete per aprire una
  dashboard e un widget che si rompe in viaggio, cioè proprio quando serve.
  Metodo e madhab si scelgono, default Muslim World League.
- **Si calcolano tre giorni, non uno.** Fra Isha e il Fajr del giorno dopo,
  «attuale» è Isha di *ieri* e «prossima» è Fajr di *domani*: col solo giorno
  corrente si otterrebbe un conto alla rovescia negativo di venti ore, che è il
  bug classico di questi widget.
- **Non chiede il GPS all'apertura della pagina.** Stessa decisione della nuova
  visita in F3 e per la stessa ragione: il permesso è una finestra che copre
  tutto, e chiederlo mentre qualcuno apre la pipeline vuol dire vederlo negare
  per sempre. Al primo avvio il widget chiede *dove siamo* con un bottone e un
  campo città, e il permesso arriva dopo che lo si è premuto. Se il permesso c'è
  già, la posizione si rinfresca in silenzio — è così che la città cambia da
  sola cambiando posto.
- **Il nome della città passa da una route nostra** (`/api/staff/geo`) e non da
  Nominatim diretto, per tre ragioni in ordine di importanza: (1) la policy
  d'uso chiede un `User-Agent` che identifichi l'applicazione, e `User-Agent` è
  un *forbidden header name* che `fetch` nel browser non può impostare — una
  chiamata diretta violerebbe la policy senza modo di rimediare; (2) dal browser
  ogni dispositivo comparirebbe nei log di Nominatim col proprio IP e la propria
  posizione, da qui compare un server solo; (3) la cache, con le coordinate
  arrotondate al chilometro e la risposta tenuta un giorno. La route è dietro
  `requireStaff()`: un proxy di geocoding aperto è un proxy di geocoding di
  qualcun altro.
- Il nome si pesca da `city || town || village || municipality`: Jesolo è
  `town` e Cavallino-Treporti è `village`, quindi guardare solo `city` vorrebbe
  dire non sapere dove si sta proprio dove lavoriamo.
- **Il timer batte solo quando serve**: si spegne col widget spento, senza
  posizione, e quando la scheda va in secondo piano. Legge l'orologio e non un
  contatore, quindi al ritorno si rimette a posto da sé.
- **Notifica all'entrata dell'orario, nessun suono.** Il permesso si chiede una
  volta, da un bottone nel pannello. La memoria di «già avvisato» sta in
  `localStorage` con l'istante esatto della preghiera come chiave: un
  ricaricamento due minuti dopo Dhuhr non riavvisa, e oltre dieci minuti
  dall'entrata non si notifica affatto — aprendo la dashboard alle quattro non
  deve arrivare la notifica di Dhuhr.
- **Le preferenze stanno in `localStorage`, non nel database**: sono del
  dispositivo (posizione, metodo, notifiche), e una colonna in più su
  `staff_profiles` per l'intervallo delle ayat sarebbe una query a ogni apertura
  per un numero che si cambia una volta nella vita. In lettura sono validate
  contro l'elenco vero: un `metodo` che non esiste più farebbe lanciare
  `CalculationMethod[...]` e porterebbe giù tutto il widget.

#### Le ayat

`lib/staff/ayat.ts` — venticinque versetti sulla preghiera e sul ricordo di
Allah, **in un file del repo**. Niente API: sarebbero tre righe di codice e
metterebbero una chiamata di rete fra l'apertura della dashboard e la comparsa
del testo, più un giorno di downtime del servizio dentro il widget.

- **Il riferimento è esatto o il versetto non c'è.** Qualche ayah molto
  pertinente è rimasta fuori — Al-A'raf 7:205 fra le altre — perché non si era
  certi di una parola della vocalizzazione: un versetto storto in un'area
  interna resta storto per anni, e nessuno lo va a controllare.
- Dove il testo è una parte di un versetto più lungo, `parziale` è vero e
  l'interfaccia lo segna con un'ellissi: citare mezzo versetto senza dirlo è un
  errore anche quando la metà è esatta.
- Arabo in **Noto Naskh** via `next/font`, cioè servito dal nostro dominio:
  nessuna richiesta a Google a runtime e nessun mezzo secondo di testo
  invisibile. Interlinea a 2.05 perché l'arabo vocalizzato ha i segni sopra e
  sotto la linea di base, e a interlinea normale si toccano.
- La rotazione è **deterministica** (indice dal numero del giro, niente
  `Math.random()`): server e browser devono disegnare la stessa ayah al primo
  dipinto, o React segnala un errore di idratazione e il testo lampeggia.
- L'ayah della home sta **in fondo** alla pagina e non in cima: chi entra qui
  entra per i numeri, e mettere un testo da leggere davanti a quello che si è
  venuti a vedere è il modo di far chiudere entrambi. In fondo la trova chi
  scorre, cioè chi ha finito.
- La dissolvenza cambia il testo **a metà**, quando è del tutto invisibile:
  cambiare stringa e trasparenza nello stesso fotogramma si vede come un lampo,
  non come una dissolvenza.

#### `/staff/io`

Le proprie impostazioni: foto, ruolo, saluto, promemoria. Si chiama così e non
«impostazioni» perché qui non c'è niente dell'applicazione — non c'è nulla che
riguardi clienti, prezzi o permessi. Ci sono la propria faccia e i propri
promemoria; chiamarla «impostazioni» farebbe cercare qui, un giorno, la
configurazione di qualcosa.

Le due metà della pagina vivono in due posti diversi ed è voluto: foto, ruolo e
saluto nel database perché li vedono gli altri; orari e ayat in `localStorage`
perché sono di *questo* dispositivo. **L'interruttore generale del widget sta
qui e non nel widget**: un pannello che contiene il bottone per farlo sparire è
un bottone che si preme per errore e poi non si ritrova più.

Il nome non si modifica da qui: è la stessa colonna che firma lo storico
attività di ogni cliente e le statistiche per venditore. Lo cambia un admin dalla
pagina Team.
