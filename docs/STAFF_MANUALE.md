# La dashboard Lumino — manuale

Questo è il manuale d'uso, non la documentazione tecnica. Se cerchi lo schema del
database o il perché di una scelta, sono in `STAFF_DASHBOARD.md` e
`STAFF_DASHBOARD_F5.md`.

L'indirizzo è **bylumino.com/staff**. Si entra con la propria email e la propria
password. Se ti risponde che l'account esiste ma non è nell'elenco dello staff,
non è la password sbagliata: manca la tua riga, e te la deve aggiungere un
amministratore.

---

## Le sezioni, in due righe ciascuna

La barra nera a sinistra (in basso sul telefono) ha tutte le sezioni. Passandoci
il mouse si apre e dice i nomi; il bottone in alto la tiene aperta.

| | Cosa ci trovi |
| --- | --- |
| **Oggi** | Il saluto, i numeri del mese, cosa ha fatto la squadra, i richiami e la settimana. È la pagina che si apre entrando. |
| **Pipeline** | Tutti i locali divisi per stato. Si trascina una scheda da una colonna all'altra per farla avanzare. |
| **Clienti** | L'elenco completo, con i filtri. Da qui si apre la scheda di ognuno. |
| **Campo** | Le visite fatte e i richiami della settimana. È la pagina del telefono. |
| **Soldi** | Acconti, saldi, abbonamenti e modifiche extra. |
| **Progetti** | A che punto è ogni sito, e quali domini stanno scadendo. |
| **Statistiche** | Quanto chiudi, dove, a che prezzo, e cosa ti dicono quelli che non comprano. |
| **Team** | Solo per gli amministratori: chi c'è e come sta andando. |
| **Archivio** | Dove butti dentro tutto il resto: PDF, foto, note, vocali, link. Cercabile, e il Lab AI lo sa leggere. |
| **Risorse** | Listino, manuale di vendita, demo per settore. |
| **Lab AI** | Domande in italiano sui numeri della dashboard, o sul materiale dell'Archivio. |

---

## Il giro normale di una giornata

1. **Apri Oggi.** La riga sotto il tuo nome dice cos'è successo ieri e cosa c'è
   adesso: «Ieri hai chiuso il tuo terzo locale a Treviso. Oggi tre persone ti
   aspettano.» Quelle tre persone sono i richiami più sotto nella stessa pagina.
2. **Fai i richiami.** Ogni riga porta alla scheda del cliente. Quando hai
   finito, segni il richiamo come fatto.
3. **Vai in giro.** Ogni locale in cui entri diventa una visita — vedi sotto.
4. **A fine giornata**, se qualcuno ha detto di sì, sposta la sua scheda in
   **Accettato** dalla Pipeline. Se ha detto di no, spostala in **Rifiutato**: ti
   chiederà il motivo, ed è obbligatorio. Quel motivo è quello che poi leggi in
   Statistiche sotto «obiezioni», ed è la cosa che fa migliorare il discorso di
   tutti.

---

## Il Campo, passo passo

È la parte da usare **in piedi, con una mano, davanti al locale**. Si fa in meno
di due minuti.

### Prima di entrare

Apri **Campo → Registra una visita** (il bottone c'è anche su Oggi).

### Passo 1 — Chi

Cerchi il locale per nome, via o zona e lo tocchi. Se non c'è ancora in archivio,
esci un attimo e crealo da **Clienti → Nuovo cliente**: bastano nome e città.

> È l'unico passo obbligatorio. Se ti interrompono adesso, puoi salvare e basta.

Tocca **Avanti**.

### Passo 2 — Come lavora

Qui si tocca, non si scrive. Sono tutte pastiglie: le tocchi e si accendono.

- **Come prendono le prenotazioni**: telefono, TheFork, Instagram, a voce…
- **Cosa usano già**: un sito, solo Facebook, un menu su PDF…
- **Quanto pagano di commissioni**, se te lo dicono.
- **Che lingue parlano i loro clienti**, e se hanno turisti.
- **Cosa non gli va** del come lavorano adesso.

Puoi saltare tutto quello che non hai chiesto. Non serve riempire.

### Passo 3 — Com'è andata

- **La reazione**: entusiasta, interessato, tiepido, diffidente, chiuso. Una
  sola.
- **L'obiezione principale**: la frase con cui ti hanno frenato.
- **La frase del titolare**: quella che ti è rimasta in testa, con le sue parole.
  Vale più di tutto il resto — è quella che finisce in Statistiche e nel Lab.
- **La nota vocale**: tocchi il microfono e parli, il telefono trascrive da solo.
  Funziona in italiano e non costa niente. Se sbaglia una parola, la correggi a
  mano.
- **Le foto**: la vetrina, la sala, il menu esposto. Si scattano dal telefono e
  si rimpiccioliscono da sole prima di partire.
- **La posizione** si prende da sola se hai dato il permesso al browser. Serve
  alla mappa delle zone in Statistiche.

Tocca **Salva visita**.

### Se qualcosa non va

- **Non hai campo**: aspetta di averlo e riprova. Quello che hai scritto resta
  nella schermata finché non la chiudi.
- **Una foto è troppo pesante**: te lo dice e non la carica. Rifalla più piccola
  o lasciala perdere: la visita si salva lo stesso.
- **Il telefono non dà la posizione**: la visita si salva senza. Non è
  obbligatoria.

### Prendere il richiamo

Sulla scheda del cliente, **Prendi un richiamo**: scegli il giorno e scrivi una
riga di promemoria. Comparirà su Oggi quel giorno. È la cosa che si dimentica di
più ed è quella che chiude le trattative.

---

## Aggiungere una persona al team

Serve un amministratore, e si fa in **due posti**: le credenziali stanno in
Supabase, il resto nella dashboard.

1. Vai su **supabase.com**, apri il progetto **Lumino** → **Authentication** →
   **Users** → **Add user**. Metti email e una password provvisoria e conferma.
2. Copia l'**id** (UUID) dell'utente appena creato.
3. Apri **SQL Editor** e lancia questo, cambiando i valori:

```sql
insert into staff_profiles (id, nome, email, role, attivo, obiettivo_mensile, provvigione_pct)
values (
  'INCOLLA-QUI-L-ID',
  'Nome Cognome',
  'email@bylumino.com',
  'sales',            -- 'sales' oppure 'admin'
  true,
  5000,               -- obiettivo del mese in euro, o null
  10                  -- provvigione in percentuale, o null
);
```

4. La persona entra su **bylumino.com/staff** con quella email e cambia la
   password dal proprio profilo.

**Cosa cambia fra `sales` e `admin`:** un `sales` vede solo i propri clienti e
non vede mai i margini; un `admin` vede tutto, la pagina Team e l'interruttore
dei dati demo. Non è una scelta di interfaccia: lo decide il database, e da
dentro la dashboard non si può cambiare.

**Per sospendere qualcuno** (se ne va, o va in aspettativa) non si cancella la
riga — si perderebbe lo storico delle sue visite. Si mette `attivo = false`:

```sql
update staff_profiles set attivo = false where email = 'email@bylumino.com';
```

Al prossimo accesso trova scritto che il suo accesso è sospeso.

---

## La foto profilo

Apri il tuo nome in fondo alla barra a sinistra → **Le mie cose**.

1. **Scegli una foto** dal computer o dal telefono.
2. Compare un riquadro per il **ritaglio**: trascini per spostare, la rotella o
   due dita per ingrandire. Il ritaglio è quadrato perché la foto si vede sempre
   dentro un cerchio.
3. **Salva**. La foto viene rimpicciolita a 512 pixel prima di partire, quindi
   anche una foto da 8 mega diventa una quarantina di kilobyte.

Da qui si cambiano anche il **ruolo scritto** («CCO», «Head of Sales» — è solo il
biglietto da visita, non tocca i permessi) e la **riga sotto il saluto**: se la
scrivi, sostituisce per sempre la frase automatica della home.

Per togliere la foto: **Togli la foto**. Tornano le tue iniziali.

---

## I dati demo

Servono a far vedere la dashboard piena — a un socio, a un candidato, in una
presentazione — senza mostrare clienti veri, e a guardare come sta una schermata
quando è carica.

**Solo gli amministratori li vedono.** L'interruttore è l'icona della **beuta**
in fondo alla barra a sinistra (sul telefono: **Altro → Dati demo**).

- **Acceso**: compaiono 25 locali veneti inventati, con le loro trattative,
  visite e incassi. Si mescolano ai dati veri in tutte le pagine.
- **Spento**: spariscono ovunque, anche dai totali.

I dati finti sono marcati nel database e **non si possono confondere** con quelli
veri: nessuna riga demo diventa mai una riga vera.

Per seminarli o toglierli dal database:

```bash
npm run staff:seed
npm run staff:seed:clean
```

`staff:seed:clean` cancella **solo** le righe finte. Quelle vere non le tocca.

---

## L'Archivio

È il posto dove butti dentro qualunque cosa, anche se non c'entra con nessun
cliente: il PDF che ti ha mandato un fornitore, lo screenshot di una chat, la
foto di un menù, la nota detta in macchina uscendo da un locale.

Non sono le Risorse. Le Risorse sono roba da **mostrare** a un titolare, e le
carica solo un amministratore. Qui dentro carichi tu, tutto quello che vuoi.

### Come si butta dentro

**Aggiungi**, e scegli cosa stai archiviando: un file, una nota scritta, una
vocale, un link. L'unica cosa obbligatoria è il **titolo** — scrivilo come lo
cercherai fra sei mesi, non come si chiama il file.

Tutto il resto è facoltativo e serve a ritrovarlo: i **tag** (separati da
virgola: `prezzi, menù, obiezioni`), **da dove arriva**, il **cliente** se ce
n'è uno, e **quand'è successo** — che non è quando lo carichi: la foto la carichi
la sera, la visita era la mattina.

### Il testo lo tira fuori da sé

Appena scegli un file, il testo dentro comincia a uscire da solo, mentre stai
ancora scrivendo il titolo:

- dai **PDF** legge il testo (se il PDF è una scansione non c'è niente da
  leggere, e te lo dice);
- dalle **foto e dagli screenshot** lo riconosce — la prima volta ci mette
  qualche secondo in più perché scarica di cosa ha bisogno;
- dalle **vocali** esce la trascrizione mentre parli. **L'audio non si salva da
  nessuna parte**: resta solo il testo.

Quel testo finisce in un campo che puoi correggere, adesso o dopo aprendo la
voce. **Correggilo**: il riconoscimento sbaglia i nomi propri e le cifre, che è
esattamente quello per cui avevi archiviato quella foto. Una voce corretta a
mano porta il bollino **riletto** invece di **estratto**, e quando il Lab AI la
cita si sa che dietro c'è una persona.

### Come si ritrova

La barra di ricerca in alto cerca **dentro tutto**: titoli, note e testo
estratto. Funziona come sei abituato altrove: `"frase esatta"` fra virgolette,
`-parola` per escludere. Sotto ci sono i filtri per tipo e per tag, con quanti
elementi ha ognuno; «chi, quale cliente, quando» apre gli altri.

Quello che cerchi finisce nell'indirizzo della pagina: puoi tornare indietro col
tasto del browser, ricaricare, o mandare il link a un collega.

### Cosa puoi cancellare

Le tue voci. Quelle caricate da altri si leggono e non si toccano — un
amministratore invece può cancellare tutto.

---

## Il Lab AI

Scrivi una domanda in italiano e risponde. In cima alla conversazione scegli
**su cosa**:

- **i numeri** — quelli che questa dashboard ha davvero: quali settori chiudono
  meglio, dove, a che prezzo, cosa dicono quelli che non comprano;
- **l'archivio** — le note, le trascrizioni e i documenti che avete caricato.

Cambiando fonte la conversazione riparte da zero: sono due materiali diversi e
mescolarli vorrebbe dire risposte che citano una cosa per dimostrarne un'altra.

### Le due analisi con un bottone

In modalità archivio trovi **«Problemi che tornano»** e **«Idee che ne
nascono»**. La prima legge tutto e dice cosa si lamentano di più i locali e su
quante voci l'ha visto; la seconda parte da quei problemi e propone cosa
potreste costruirci sopra. Come ogni altra risposta, si tengono da parte.

### Le citazioni si aprono

In modalità archivio ogni frase porta un numeretto viola tipo **#3**: è la voce
da cui l'ha presa, e cliccandolo ci vai sopra. Se un numeretto resta testo nero
invece di diventare cliccabile, vuol dire che non corrisponde a niente — e in
quel caso non fidarti di quella frase.

Tre cose da sapere:

- **Non inventa.** Se un dato non ce l'ha, lo dice. E ogni percentuale arriva
  sempre con «su quanti casi»: con nove trattative decise, un 78% non vuol dire
  niente e te lo scrive.
- **Non vede i clienti.** Al servizio esterno partono solo i totali — mai nomi,
  telefoni o indirizzi. Sotto la conversazione, **«Cosa legge il Lab»** apre
  esattamente il foglio che è stato mandato: puoi controllarlo tu.
- **Quello che vale si tiene.** Sotto una risposta c'è **«tieni questo»**: gli
  dai un titolo e resta nello scaffale a destra con il tuo nome e la data. La
  conversazione invece non si salva — chiudendo la pagina sparisce.

Se i dati demo sono accesi, il Lab lo scrive nel foglio: quei numeri e quel
materiale comprendono locali inventati.

---

## Domande veloci

**Ho spostato un cliente per sbaglio in Rifiutato.** Rispostalo dove stava: il
motivo del rifiuto si cancella da solo uscendo da quello stato.

**Non trovo un cliente.** Da Clienti, controlla i filtri in alto: se «Filtri
attivi» non è zero, azzerali.

**Gli orari della preghiera sono sbagliati.** La pill in alto a destra: aprila,
icona dell'ingranaggio, e scrivi la città a mano. Se accanto al nome della città
c'è scritto **circa**, vuol dire che la posizione è stata indovinata dalla rete e
non dal telefono.

**Ho cambiato la foto e nella barra c'è ancora quella vecchia.** Ricarica la
pagina una volta.

**Nell'Archivio ho caricato una foto e non esce cercando una parola che ci si
legge dentro.** Apri la voce: se sotto «Il testo che l'AI legge» il campo è
vuoto, il riconoscimento non ha trovato niente. Scrivi tu due righe lì dentro e
salva: da quel momento si cerca.

**Quanto vale «incassato».** Solo quello entrato davvero: il 30% se l'acconto è
segnato pagato, il restante 70% solo col saldo. Una trattativa firmata e non
pagata sta in «da incassare», non in «incassato».
