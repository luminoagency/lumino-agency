# F6 — l'Archivio, e il bug dei piani

Continua `STAFF_DASHBOARD.md` (design, schema, ruoli) e `STAFF_DASHBOARD_F5.md`.
Qui c'è quello che la F6 ha aggiunto e il perché delle scelte che dal codice non
si leggono.

---

## Il bug che veniva prima di tutto: due piani che si confondevano

Il pannello bianco del contenuto passava **davanti** al rail nero. A barra
aperta comparivano due cose insieme: un rettangolo chiaro attraverso la colonna
nera, e la voce attiva che sembrava uscita dal rail e appoggiata sulla pagina.

La causa non era un margine. Né `.lm-staff-shell` né `.lm-glass` creavano uno
**stacking context**, quindi tutti gli `z-index` dell'area finivano nello stesso
mucchio, quello della radice del documento. In quel mucchio la fascia
appiccicosa del widget della preghiera (`.lm-shell-salat`, `z-index: 45`) stava
sopra il pannello nero della barra (`.lm-rail-inner`, `z-index: 30`) — e la
fascia è larga quanto la colonna del contenuto, quindi a barra aperta ci passava
sopra.

La correzione è strutturale e sta in cima a `staff.css`, sotto il titolo
**«I piani, e chi sta sopra chi»**. Quattro piani, dichiarati una volta:

```
shell      isola      ← niente di /staff litiga col sito pubblico
  vetro    isola      ← le due colonne, e niente esce da qui
    1  contenuto      ← la colonna bianca, e tutto ciò che disegna
    2  rail           ← la barra nera, sempre sopra il contenuto
    3  filo           ← l'avanzamento, sopra entrambi
  50 dock  60 sheet   ← telefono
body  ← modale e pannello della preghiera, gli unici sopra la shell
```

Il punto non sono i numeri: è che `.lm-staff-main` ha `isolation: isolate`.
Una card che domani si desse `z-index: 900` resterebbe **dentro il piano 1** e
non potrebbe salire sopra il rail. È la riga che impedisce a questo bug di
ripresentarsi in una forma diversa fra sei mesi.

### La conseguenza: le modali si spostano

Un antenato isolato intrappola anche ciò che vuole stare sopra tutto: una
modale `position: fixed; z-index: 70` dentro `.lm-staff-main` finisce sotto la
barra nera. Quindi `Modal` ora si disegna altrove, con un portale — ma **non nel
`<body>`**: le variabili dell'area (`--violet`, `--r-xl`, `--ease`) sono
dichiarate su `.lm-staff`, e un pannello attaccato al body le perde tutte.
L'ospite giusto è `.lm-staff`: dentro le variabili, fuori dai due isolamenti.
Sta in `lib/staff/portale.ts`, e ci passa anche il pannello della preghiera, che
era attaccato al body **e quelle variabili le stava già perdendo in silenzio** —
spigoli vivi al posto del raggio, animazione senza curva.

### Il passaggio a caccia di sovrapposizioni

Ogni rotta di `/staff` è stata caricata in un iframe a **390, 768, 1040, 1440 e
1920 px**, a barra chiusa e aperta, misurando: scorrimento orizzontale della
pagina, elementi che escono dal pannello di vetro, elementi che coprono il rail
(con `elementFromPoint` sui punti della barra), testo tagliato da un
`overflow: hidden`. Dopo la correzione dei piani restavano due cose vere:

- **Il fumetto del rail non si è mai visto.** Era posizionato fuori dal proprio
  link (`left: calc(100% + 10px)`) dentro tre antenati che ritagliano — il link,
  il corpo scorrevole della barra, il pannello nero. Undici fumetti disegnati e
  ritagliati via a ogni passaggio del mouse. Tolto, e il suo compito se lo
  dividono due cose che funzionano davvero: **la barra si apre anche col fuoco
  da tastiera** (chi naviga con Tab legge i nomi veri, non una parola in un
  riquadro) e il `title` nativo, che lo disegna il browser fuori dalla pagina e
  nessun `overflow` può tagliare.
- **Le etichette del lollipop erano puntini.** Sette fasi in una card da un
  terzo di riga fanno 25px a colonna, e in 25px non ci sta nessuna parola:
  «Contattati» diventava «C…». Sopra le cinque voci l'etichetta ora si gira e si
  legge dal basso, in 62px di altezza fissa uguale per tutte — le colonne devono
  restare allineate, o il grafico dice un numero che non è il suo.

---

## L'Archivio

### Perché non sono le Risorse

Le **Risorse** sono materiale da mostrare a un cliente — listino, manuale, demo
— e le aggiunge solo l'admin. L'**Archivio** è tutto il resto: il PDF che ha
mandato un fornitore, lo screenshot di una chat, la foto di un menù storto, la
nota scritta in macchina, la vocale detta uscendo da un locale. Materiale che
oggi resta nel telefono di chi l'ha preso e che nessuno rilegge mai.

Il cliente collegato è **facoltativo, ed è il punto**: tutte le altre tabelle
dell'area girano intorno a un cliente, e qui la maggior parte del materiale non
riguarda nessuno in particolare. Obbligare a sceglierne uno vorrebbe dire non
caricare niente.

### Quello che lo rende un archivio e non una cartella

La colonna `testo`. Il **browser** estrae il testo al caricamento — dai PDF con
`pdfjs`, dalle immagini con l'OCR di `tesseract.js`, dalle vocali col dettato
nativo — e da lì in poi quel materiale è cercabile e analizzabile come se fosse
stato scritto a mano. Una foto di un menù diventa una fonte di prezzi; una
vocale diventa un'obiezione citabile.

**Nel browser e non sul server**, e non è una scorciatoia: estrarre lato server
vorrebbe dire un runtime che sa leggere i PDF e far girare un OCR, cioè qualche
secondo e qualche centinaio di MB per ogni foto caricata, moltiplicato per nove
venditori che archiviano tutto il giorno. Su un piano gratuito è la via più
rapida per esaurirlo. Il browser ce l'ha già tutto, e l'estrazione succede mentre
la persona sta ancora scrivendo il titolo.

Il prezzo è che il testo è dichiarato dal client, quindi non è un dato di cui
fidarsi ciecamente: vale per la ricerca e per l'analisi, non per decidere niente.
Ed è per questo che `testo_stato` distingue **automatico** da **corretto** — chi
legge una citazione del Lab AI ha il diritto di sapere se quella frase l'ha
scritta una persona o un OCR.

Le due librerie si caricano **solo quando servono** (import dinamico): insieme
pesano più di tutto il resto dell'area, e importate in cima le pagherebbe
chiunque apra l'Archivio anche solo per cercare. `/staff/archivio` pesa 8,7 kB.

### Il worker di pdf.js sta in `public/`

Il modo idiomatico — `new URL('pdfjs-dist/build/pdf.worker.min.mjs',
import.meta.url)` — **ferma la build**: webpack lo emette come risorsa, Terser
prova a minificarlo come uno script classico, trova `import` ed `export` e si
arrende. `scripts/copia-pdf-worker.mjs` lo copia in `public/pdfjs/` da
`prebuild` e da `predev`, così la versione segue quella del pacchetto senza che
nessuno se ne ricordi, e il file resta fuori da git.

### La ricerca

`tsvector` generata e indicizzata GIN (migration 0035), non un `ilike '%q%'`.
Un `ilike` su una colonna che contiene trenta pagine di PDF scansionato legge
ogni riga di ogni documento a ogni tasto premuto, e non sa che «ristoranti» e
«ristorante» sono la stessa parola.

I pesi non sono decorativi: **A** al titolo, **B** ai tag e alla fonte, **C**
alla nota scritta a mano, **D** al testo estratto. Cercando «menù», una voce che
si *chiama* «Menù del Bacaro» esce prima di un PDF in cui la parola compare a
pagina dodici; e il testo automatico pesa meno perché è il pezzo che un OCR può
aver sbagliato.

Due dettagli che costano se si dimenticano:

- **Colonna generata, non trigger.** Con un trigger, un `update` fatto da
  un'altra strada lascerebbe l'indice a raccontare la versione vecchia — il tipo
  di bug che si scopre quando una ricerca non trova una cosa che c'è.
- **I tag passano da `array_to_tsvector`**, senza stemming, perché
  `array_to_string` è `stable` e non `immutable` e una colonna generata pretende
  funzioni immutabili: con quella, Postgres rifiuta la tabella intera. Il prezzo
  è che il tag `prezzi` non esce cercando «prezzo» — si paga volentieri, i tag
  hanno un filtro dedicato lì accanto. Per questo l'interfaccia salva i tag
  **già in minuscolo**: senza stemming, `Prezzi` e `prezzi` sarebbero due
  lessemi diversi e due voci nell'elenco dei filtri.

### I filtri stanno nell'indirizzo

`?q=…&kind=…&tag=…&autore=…&cliente=…&dal=…&al=…&voce=…`. Con i filtri nella
query si torna indietro col tasto del browser, si ricarica senza perdere niente,
si manda un link a un collega e la pagina si mette fra i preferiti così com'è.
Con uno `useState` niente di tutto questo esiste, e la ricerca diventa una cosa
che si fa una volta e si abbandona. Il campo di ricerca aspetta **300ms** prima
di navigare, e usa `replace` e non `push`: senza, dopo aver scritto
«prenotazioni» il tasto indietro andrebbe premuto dodici volte.

---

## Il Lab AI legge l'archivio

Un interruttore, non due pagine: la domanda che viene in mente è la stessa
(«perché non comprano?») e cambia solo dove si va a guardare.

- **i numeri** → i totali della dashboard. Regola: non calcolare niente.
- **l'archivio** → il materiale grezzo. Regola: non affermare niente senza dire
  dove l'hai letto.

Ogni voce entra nel foglio con un contrassegno `[#3]`, e le istruzioni
pretendono che ogni affermazione ne porti uno. Senza, la risposta è una pagina di
opinioni ben scritte che nessuno può verificare — ed è materiale su cui si decide
dove mandare un venditore. L'interfaccia trasforma `[#3]` in un link alla voce;
**un contrassegno che non corrisponde a niente resta testo** e non diventa un
link rotto, perché succede quando il modello se lo inventa, ed è proprio il caso
in cui non si vuole che sembri verificato.

Il numero è la **posizione** nell'elenco (ultime 400 per data, decrescente), non
l'ordine di arrivo nel foglio: così `fontiArchivio()` ricostruisce la
corrispondenza numero → voce leggendo due colonne, invece di rifare il foglio
intero e rileggere megabyte di testo estratto per disegnare dei link.

Il foglio ha un tetto di **60.000 caratteri**, riempito dalle voci più recenti, e
dice al modello quante sono rimaste fuori: una conclusione tratta su quaranta
voci su quattrocento va detta.

### Le due analisi con un bottone

`ANALISI` in `lib/staff/archivio-tipi.ts`: **«Problemi che tornano»** e **«Idee
che ne nascono»**. Sono domande scritte bene, non funzioni — si correggono
leggendo una risposta storta invece di riscrivere del codice. La seconda dipende
dalla prima per costruzione: un prodotto che non nasce da un problema visto è
un'idea, e di idee ne bastano poche.

I risultati si salvano in `staff_ai_insights` come le altre risposte, e il tipo
si propone da sé guardando **quale** analisi ha generato la risposta —
`problema_ricorrente` (nuovo) o `idea_startup`.

### Il Markdown si disegna, non si stampa

Il modello scrive `**grassetto**` e `* elenco` anche quando gli si dice di non
farlo, e finora quegli asterischi finivano sullo schermo così com'erano. Ora si
disegnano le **tre** cose che arrivano davvero — grassetto, punti elenco,
citazioni — e nient'altro. Non è un parser Markdown e non deve diventarlo: un
parser vero è una dipendenza, un rischio di HTML arbitrario dentro una risposta
generata, e cinque sintassi che qui non usa nessuno. Funziona anche a metà
stream: un `**` non ancora chiuso non corrisponde a niente e resta testo.

---

## Il modello Gemini

`GEMINI_MODEL`, un punto solo, `lib/staff/lab.ts`. Il default è passato da
`gemini-3.8-flash` a **`gemini-3.1-flash-lite`**: il primo (e il suo alias
`gemini-flash-latest`) risponde **503 «high demand»** in modo continuativo sul
piano gratuito, e un Lab che non risponde mai non è un Lab. Alternativa più
capace se serve, cambiando solo la variabile: `gemini-3-flash-preview`.

Gli errori del servizio dicono già cosa fare e non si confondono fra loro: 429
«hai fatto troppe domande», 503 «sovraccarico, riprova», **404 «il modello
configurato non esiste più: va cambiato `GEMINI_MODEL`»**. Il corpo della
risposta di Google finisce in `console.error` e non nel browser — contiene il
nome del modello, la quota e a volte un pezzo della richiesta.

---

## Migration e bucket

- **0035** `staff_archive` — tabella, `tsvector` generata, quattro indici, RLS.
  Eseguita il 29 settembre 2026 con `node scripts/supabase-sql.mjs`.
- **bucket `staff-archive`** — privato, 20 MB, PDF/immagini/testo. Niente audio:
  le vocali salvano la trascrizione, non il file. Dettagli in
  `supabase/storage-buckets.md`.

**RLS**: tutti leggono tutto, si scrive il proprio, l'admin scrive tutto. La
lettura aperta è voluta — un archivio in cui ognuno vede solo la roba sua è nove
cartelle separate, cioè la situazione da cui si parte. Il valore è che la nota
presa da un collega sei mesi fa esca da una ricerca fatta da un altro.

---

## ESLint

Il repo non aveva una configurazione, quindi `npm run lint` si fermava su una
domanda interattiva. Ora c'è `.eslintrc.json` (`next/core-web-vitals`), e il
progetto passa con **zero errori**. Quello che è stato sistemato per arrivarci:

- I custom hook con nome italiano (`usaPosizione`, `usaMontato`, `usaAncora`,
  `usaChiusura`) sono diventati `usePosizione`, `useMontato`, `useAncora`,
  `useChiusura`: `react-hooks/rules-of-hooks` riconosce solo il prefisso `use`, e
  la regola vale la pena di tenerla accesa. Il resto del file già faceva così
  (`useRail`, `useAttesa`).
- Ventiquattro virgolette dritte in testo italiano dei pannelli admin sono
  diventate `«…»` e `’`, che è quello che usa il resto del codice: non erano uno
  stile diverso, erano una disattenzione.
- `plugins: ["@typescript-eslint"]` perché i commenti `eslint-disable
  @typescript-eslint/…` sparsi nel codice abbiano una regola da disabilitare.
- `@next/next/no-page-custom-font` spenta: parla di `pages/_document.js`, che in
  un'app App Router non esiste.

Restano cinque avvisi `no-img-element`, tutti voluti e documentati sul posto:
sono URL firmati che scadono in sei ore, e passarli a `next/image` vuol dire
ri-scaricare e ri-comprimere la stessa foto a ogni firma.
