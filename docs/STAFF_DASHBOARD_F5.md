# F5 — il laboratorio, il materiale, la squadra

Continua `STAFF_DASHBOARD.md`, che resta la fonte per design, schema, ruoli e
fasi precedenti. Qui c'è solo quello che la F5 ha aggiunto, e il perché delle
scelte che non si leggono dal codice.

---

## Le migration si eseguono da riga di comando

**Non è più vero che vanno incollate a mano nell'SQL editor.** In `.env.local` c'è
`SUPABASE_ACCESS_TOKEN` (un Personal Access Token del proprietario, `sbp_…`), e
con quello la Management API esegue DDL sul progetto senza bisogno della password
del database:

```
POST https://api.supabase.com/v1/projects/xuxcpltbwvyozuprvbki/database/query
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
{ "query": "<sql>" }
```

`.env.local` è in `.gitignore`: il token non è mai finito in un commit e non deve
finirci. Non sta su Vercel e non serve a runtime — è uno strumento di
manutenzione, non una dipendenza dell'applicazione.

**Stato al 29 settembre 2026:** dalla 0030 alla **0035 eseguite**. Da questa
sessione c’è anche `node scripts/supabase-sql.mjs <file.sql>`, che fa la stessa
chiamata senza doverla comporre a mano.

---

## Il profilo di Ratib, e cosa insegnava quel bug

Ratib entrava con email e password giuste e si vedeva rispondere «questo account
non è un account dello staff». Era vero e fuorviante insieme: l'utente esisteva
in `auth.users` (`e618caf3-36f2-4537-a1fa-631a839b0ed5`, ultimo accesso riuscito
il 28 settembre), la password funzionava, e **mancava soltanto la riga in
`staff_profiles`**. Il messaggio mandava a cercare credenziali diverse per un
problema che era un `insert`.

Da qui due cambiamenti.

**La pagina di login distingue tre esiti** e non due. Li ricava da sé dalla
sessione, senza `?motivo=` nell'indirizzo — un parametro nell'URL si riscrive a
mano, e il messaggio lo sceglierebbe chi passa il link:

| esito | quando | cosa dice |
| --- | --- | --- |
| `nessuna` | nessuna sessione | «Area interna.» |
| `non-staff` | sessione valida, nessuna riga in `staff_profiles` | «L'account esiste e la password è giusta: manca la riga nell'elenco dello staff.» |
| `sospeso` | riga presente con `attivo = false` | «L'accesso è stato sospeso.» |

Negli ultimi due compare anche **con quale indirizzo** si è entrati e un bottone
per uscire: senza, chi entra con l'account sbagliato resta in trappola, perché il
modulo lo rifà entrare con lo stesso utente e il cookie non si cancella da sé.

**L'email si normalizza prima di partire** (`trim().toLowerCase()`). Il
riempimento automatico del browser mandava `RATIB.LUMINO@gmail.com`: il lookup del
profilo passa dall'`id` e non ne risentiva, ma il confronto dell'**email** lo fa
il servizio di autenticazione, e la parte prima della `@` è per lo standard
sensibile alle maiuscole. Toglierlo di mezzo costa una riga.

---

## Lab AI

### Al modello vanno i totali, non le righe

È la decisione che regge tutto il resto. `lib/staff/lab.ts` costruisce un foglio
di testo di una cinquantina di righe — clienti per stato e settore, tasso di
chiusura, tagli per settore e zona, obiezioni, frasi dei titolari senza il nome
del locale, soldi, andamento per mese — e manda **quello**.

Tre ragioni, in ordine:

1. **Sono dati di persone.** Nomi di locali, titolari, telefoni, e le frasi dette
   in privato durante una visita. Mandarli a un servizio esterno perché qualcuno
   ha chiesto «come sta andando?» è una cosa che non si può disfare.
2. **I conti fatti da un modello linguistico sono opinioni.** Il tasso di
   chiusura lo calcola `caricaStatistiche`, con le sue regole documentate (il
   denominatore sono le trattative *decise*). Se il Lab ricontasse per conto suo
   direbbe un numero diverso da quello della pagina Statistiche, e quale sia
   giusto non lo saprebbe nessuno. **Il Lab legge la stessa funzione della
   pagina: non può contraddirla.**
3. Il piano gratuito ha un tetto di token e ventimila righe lo bruciano in una
   domanda.

Il taglio **per venditore** entra nel foglio solo per l'admin. Non è riservatezza
verso Google: è che a un venditore quel dato non appartiene, e il Lab non deve
diventare la porta di servizio da cui esce ciò che la pagina Statistiche non fa
vedere.

### Il foglio si mostra

La pagina lo stampa tale e quale dietro un `<details>` chiuso. Non è trasparenza
per bella figura: è l'unico modo perché qualcuno si accorga che il Lab sta
rispondendo sui **dati finti** (l'interruttore demo è acceso) o su dati vecchi. In
una dashboard su cui si prendono decisioni, quella è un'informazione.

### La conversazione non si salva

Chiudendo la pagina le domande spariscono. Una cronologia di chat che si accumula
diventa in tre mesi trecento domande, di cui nessuna si ritrova e tutte si
conservano. Quello che vale si salva a mano in `staff_ai_insights`, **con un
titolo scritto da chi ha capito la cosa** — e quel gesto in più è proprio ciò che
distingue una cosa che serve da una che è passata di lì.

### Streaming

`app/api/staff/lab/route.ts` chiama `streamGenerateContent?alt=sse` e converte
l'SSE di Gemini in testo semplice, così il client è un `while (read())` di dieci
righe invece di un parser. Il piano gratuito impiega fra due e sei secondi: una
risposta intera dopo sei secondi di schermata ferma è un pulsante che sembra
rotto, la stessa risposta che si scrive da sé è un'attesa che si sopporta — ed è
anche il momento in cui si capisce che la domanda era sbagliata e si può fermare.

Il foglio **lo costruisce il server**, non il browser: il client manda una
domanda e nient'altro. Se il contesto arrivasse dal client, chiunque sapesse
aprire la console potrebbe farsi restituire il taglio per venditore che la RLS non
gli mostra.

### Senza chiave la sezione è spenta, non rotta

`GEMINI_API_KEY` manca → la conversazione non si disegna a metà e non compare
nessun campo che poi risponde con un errore. Si vede una card che spiega in due
righe cosa manca, e **lo scaffale degli insight funziona lo stesso**, perché sono
righe di un database e non hanno niente a che fare con Gemini.

Per accenderlo: chiave gratuita su `aistudio.google.com` → `GEMINI_API_KEY` in
`.env.local` e nelle variabili d'ambiente di Vercel. `GEMINI_MODEL` cambia il
modello senza toccare il codice. Il default non è più `gemini-2.0-flash`:
vedi `STAFF_DASHBOARD_F6.md`, sezione «Il modello Gemini».

---

## Risorse

Non è un archivio: è quello che serve **avere in mano davanti a un titolare**,
cioè su un telefono, in piedi, in un bar rumoroso.

- **Un tocco solo per aprire**: la card intera è il link (uno pseudo-elemento che
  copre il riquadro). Il cestino ha un `z-index` sopra, altrimenti non si
  premerebbe — è il prezzo di quella scelta, e si paga lì.
- **Il peso accanto al nome**: un PDF da 8 MB su rete mobile davanti a un cliente
  che aspetta è quindici secondi di silenzio. Saperlo prima è la differenza fra
  aprirlo e mandarlo per messaggio.
- **File nostro o link esterno, mai tutti e due.** Il vincolo sta nel database
  (`staff_resources_ha_qualcosa`) e non solo nell'interfaccia: una riga senza né
  file né link è una voce in elenco che non si apre. Nel modulo i due campi si
  disabilitano a vicenda, così la regola si vede prima di violarla.
- Il filtro mostra **solo i settori presenti in elenco**: un filtro con sei
  bottoni di cui quattro danno zero risultati insegna a non usare i filtri.

Scrittura solo admin (policy della 0030, invariata): il listino e il manuale sono
documenti dell'azienda, e un elenco a cui tutti aggiungono diventa in un mese un
elenco in cui non si trova più il listino.

---

## Team

**Non è una rubrica.** Con nome, ruolo, obiettivo e provvigione sarebbe venuto
fuori un elenco di nomi con accanto due numeri fermi, cioè una pagina che si apre
una volta. Accanto a ogni persona ci sono **quanti clienti tiene, quante
trattative ha chiuso, quanto è entrato davvero e a che punto è dell'obiettivo del
mese**.

«Incassato» vuol dire *entrato*, non *firmato*: il 30% se l'acconto è pagato, il
resto col saldo — la stessa regola della pagina Soldi. Usarne una diversa qui
avrebbe prodotto due totali aziendali.

L'obiettivo è una barra e non una percentuale scritta, perché «68%» e una barra
piena per due terzi si leggono in tempi diversi e questa pagina la si guarda di
sfuggita. Oltre il 100% la barra resta piena e il numero accanto dice il vero.

**Non c'è un bottone «aggiungi persona»**, e non è una mancanza: creare un utente
vuol dire creare credenziali, cioè un'operazione su `auth.users` col service-role.
Una route che crea account è il primo posto che qualcuno proverebbe a spingere. Si
fa tre volte l'anno nella dashboard di Supabase, e la pagina lo scrive invece di
lasciare cercare.

I dati demo **non** si nascondono qui: è la pagina di chi amministra, e i numeri
accanto ai nomi devono corrispondere a quello che le altre pagine stanno mostrando
in quel momento, interruttore compreso. Nasconderli avrebbe reso questa l'unica
pagina che dice numeri diversi da tutte le altre.

---

## La 0034, e l'unica policy che è cambiata

Colonne aggiunte: `created_by` e `is_demo` su `staff_ai_insights`;
`descrizione`, `file_path`, `dimensione`, `created_by`, `is_demo` su
`staff_resources`, più il vincolo «file o link».

`created_by` usa `on delete set null` e non `cascade`: un venditore che lascia
l'azienda non deve portarsi via quello che ha capito. Resta l'insight, si perde il
nome.

**La policy degli insight passa da «solo admin» a «ognuno il suo».** La 0030 dava
`for all` al solo admin — coerente con l'idea che gli insight li generasse un
processo notturno, ma in F5 li salva chi sta parlando col Lab: con quella policy
un venditore poteva fare la domanda, leggere la risposta e non poterla tenere.
Cioè la funzione non esisteva per otto persone su nove.

Il `with check` sull'insert impedisce di intestare a un collega una frase che non
ha mai detto: la RLS controlla la riga che *entra*, non chi la manda, quindi senza
quello `created_by` sarebbe un campo libero. Per la stessa ragione **questa
scrittura passa dal client con i cookie e non dal service-role**: col service-role
il `with check` non verrebbe nemmeno valutato.

---

## Il lag, e perché era strutturale

Misurato prima di toccare niente: il prefetch di `/staff/soldi` tornava **170
byte**. In Next 14 una rotta `force-dynamic` **senza `loading.tsx` non è
prefetchabile** — il router non ha niente da mettere da parte — quindi al clic non
c'era nessuna schermata da mostrare finché il server non aveva finito con
Supabase. Due o tre secondi in cui la pagina è quella di prima: il clic sembra non
essere arrivato, e si riclicca.

E il server finiva tardi per conto suo: `requireStaff()` girava **due volte per
navigazione** — una nel layout di `(dash)`, una in ogni `page.tsx` — cioè due
`auth.getUser()` (che è una richiesta HTTP al servizio di autenticazione, non una
lettura di cookie) e due select su `staff_profiles`, in serie, prima del primo
byte. Sulla home anche due firme dello stesso avatar, cioè due URL diversi per la
stessa immagine.

Tre rimedi:

1. `cache()` di React su `requireStaff` e `firmaAvatar`: memoria **per singola
   richiesta**, che è esattamente la garanzia che serve su un dato che dice chi
   sei. La seconda chiamata nello stesso render è gratis.
2. Un `loading.tsx` per rotta, con `components/staff/Scheletro.tsx`: gli scheletri
   hanno **gli span del bento vero**, così quando i dati arrivano cambia il
   contenuto e non il rettangolo. Entrano con 90ms di ritardo — sotto la soglia in
   cui si nota un'attesa, sopra quella in cui una sagoma che lampeggia si legge
   come un difetto.
3. La voce del rail si accende **al clic** (`data-attesa`) e non all'arrivo della
   pagina, più un filo di avanzamento in cima al pannello. Senza, per tutta la
   durata della navigazione l'unica voce accesa è quella che si sta *lasciando*:
   lo schermo continua a dire di essere sulla pagina di prima.

**Risultato misurato: il prefetch è passato da 170 B a 13,3 KB** — cioè il guscio
arriva nel browser mentre il mouse passa sul link, e al clic si disegna nel
fotogramma successivo.

Il `prefetch` dei link resta quello automatico e **non** `prefetch={true}`: su
rotte `force-dynamic` il secondo scaricherebbe la pagina intera a ogni link
sfiorato, cioè un render completo con tutte le query per ogni passaggio del
mouse.

---

## Il widget della preghiera

**Prende la posizione da sé.** Al primo caricamento partono due cose in parallelo:

- il **ripiego dal server** (`/api/staff/geo?ip=1`), che legge le intestazioni
  `x-vercel-ip-latitude/longitude/city`. Non è una chiamata a un servizio di
  geolocalizzazione: l'IP l'ha già risolto il bordo della rete, la route legge
  un'intestazione. In locale quelle intestazioni non ci sono e si usa Venezia;
- la **richiesta del permesso vera**, con una riga di spiegazione sotto la pill
  mentre la finestra del browser è aperta.

Quando il GPS risponde sostituisce il ripiego; se il ripiego arriva dopo, non
sovrascrive. Lo decide il campo `fonte` (`gps` | `scelta` | `ip` | `ripiego`), che
governa anche l'etichetta «circa» accanto al nome della città: un orario con due
minuti di errore e un orario esatto si scrivono uguali, e se non si dice quale sia
quale si finisce per fidarsi di quello sbagliato.

La richiesta automatica si fa **una volta per dispositivo** (`lm_salat_negato`):
chiederla a ogni apertura è il modo più sicuro di farsi negare il permesso per
sempre — che era la ragione per cui prima non si chiedeva affatto. Il compromesso
non è «mai» ma «una volta, e poi si ricorda». Il bottone nelle impostazioni
continua a funzionare sempre: quello è un gesto, e a un gesto si risponde.

**Dov'è.** Era in posizione assoluta in alto a destra della shell: galleggiava
sopra il titolo della pagina e sopra i bottoni della testata, con uno `z-index`
che lo metteva davanti a tutto. Adesso è **la prima riga della colonna del
contenuto**, allineata a destra, `sticky` in cima su desktop, alta 40px come
`.lm-btn` e come gli altri controlli. Nera **solo nel quarto d'ora prima
dell'orario** — è l'unico momento in cui ha qualcosa di urgente da dire, e in
questa interfaccia il nero è l'accento.

Il pannello esce in un **portale sul `body`** con posizione fissa calcolata dalla
pill: la colonna del contenuto ha `overflow-y: auto`, e un elemento in posizione
assoluta dentro un contenitore che scorre viene tagliato dal suo bordo.

---

## Storage

Bucket nuovo `staff-resources` — privato, 10 MB, PDF/immagini/MP4/pptx/docx. È
documentato in `supabase/storage-buckets.md` come gli altri. Creato sul progetto
di produzione il 28 settembre 2026.
