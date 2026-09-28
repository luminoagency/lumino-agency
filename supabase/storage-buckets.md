# Supabase Storage — bucket

Risorse Storage non gestite dalle migration SQL. Da ricreare a mano (o via
script) se si ricostruisce il progetto Supabase da zero.

## `site-images`
- **Uso:** immagini caricate dai ristoratori — gallery del sito e foto dei piatti del menu.
- **Public:** sì (lettura pubblica: le foto si vedono sui siti pubblici).
- **Limite file:** 8MB in ingresso (le immagini vengono poi ottimizzate a WebP ~1600px lato server, vedi `lib/images/optimize.ts`).
- **Mime ammessi:** `image/jpeg`, `image/png`, `image/webp`.
- **Struttura path:** `{site_id}/gallery/{uuid}.webp` e `{site_id}/menu/{uuid}.webp`.
- **Scrittura:** solo via server action (`app/admin/actions/images.ts`) con service-role, dopo verifica owner + tier Pro/Premium in codice. Non servono policy RLS di scrittura sullo storage.

### Ricreazione (service-role)
```js
await supabase.storage.createBucket('site-images', {
  public: true,
  fileSizeLimit: '8MB',
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
})
```
Già creato sul progetto di produzione attuale.

## `staff-field`
- **Uso:** foto scattate durante le visite di campo (`staff_field_reports.foto`), area interna `/staff/campo`.
- **Public:** no. Sono vetrine, sale e a volte facce: materiale di lavoro, non contenuto pubblico. Si mostrano con URL firmati da `lib/staff/storage.ts` (validi un'ora).
- **Limite file:** 6MB in ingresso, ma il browser ridimensiona a 1600px/JPEG prima di inviare (`components/staff/PhotoPicker.tsx`): in pratica arrivano poche centinaia di KB.
- **Mime ammessi:** `image/jpeg`, `image/png`, `image/webp`.
- **Struttura path:** `{client_id}/{uuid}.jpg`.
- **Scrittura:** solo via server action (`caricaFoto` / `eliminaFoto` in `lib/staff/actions.ts`) con service-role, dopo aver riletto il cliente con la sessione dell'utente — cioè attraverso la RLS. Non servono policy sullo storage.

### Ricreazione (service-role)
```js
await supabase.storage.createBucket('staff-field', {
  public: false,
  fileSizeLimit: '6MB',
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
})
```
Già creato sul progetto di produzione attuale.

## `staff-avatars`
- **Uso:** foto profilo dei membri dello staff (`staff_profiles.foto_url`), area interna `/staff`.
- **Public:** no. Sono le facce di chi lavora qui: un bucket pubblico renderebbe ogni indirizzo indovinabile e valido per sempre, e la foto di una persona non è un logo. Si mostrano con URL firmati da `lib/staff/avatar.ts`, **validi sei ore** e non una — un avatar sta nel rail di ogni pagina, e una firma che scade a metà giornata farebbe diventare la propria faccia un'iniziale senza che nessuno abbia fatto niente.
- **Limite file:** 2MB, ma il browser ritaglia e ridimensiona a 512px/JPEG prima di inviare (`components/staff/AvatarUpload.tsx`): in pratica arrivano circa 40KB.
- **Mime ammessi:** `image/jpeg`, `image/png`, `image/webp`.
- **Struttura path:** `{staff_profile_id}/{uuid}.jpg`.
- **Scrittura:** solo via server action (`caricaAvatar` / `togliAvatar` in `lib/staff/actions.ts`) con service-role. L'id della cartella viene da `requireStaff()` e **non** dal chiamante, quindi una foto non può finire nella cartella di un collega. La precedente si cancella dopo che la nuova è stata scritta: un errore a metà lascia una foto in più, non zero.

### Ricreazione (service-role)
```js
await supabase.storage.createBucket('staff-avatars', {
  public: false,
  fileSizeLimit: '2MB',
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
})
```
Già creato sul progetto di produzione attuale (lo crea da sé `node scripts/staff-avatar.mjs`, se manca).

## `staff-resources`
- **Uso:** il materiale di vendita (`staff_resources.file_path`), area interna `/staff/risorse`: listino, manuale, demo per settore.
- **Public:** no. Sono i prezzi e il manuale di vendita: un bucket pubblico vorrebbe dire che il listino ha un indirizzo indovinabile e valido per sempre. Si aprono con URL firmati da `lib/staff/f5.ts`, **validi un giorno** — un listino si apre, si guarda e si rimanda a un titolare nel giro di una giornata di lavoro, e una firma più corta lo farebbe scadere fra il momento in cui lo si cerca e quello in cui lo si mostra.
- **Limite file:** 10MB. Oltre, si usa un link esterno: `staff_resources` accetta `file_path` **oppure** `file_url`, e il vincolo `staff_resources_ha_qualcosa` (migration 0034) impone che ce ne sia almeno uno.
- **Mime ammessi:** `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `…presentationml.presentation` (pptx), `…wordprocessingml.document` (docx). È un elenco di inclusione e non un controllo sull'estensione: l'estensione la sceglie chi carica, e senza un elenco chiuso questa sarebbe la via per mettere un eseguibile su un dominio nostro e mandarne il link in giro.
- **Struttura path:** `{uuid}.{est}` in radice. Niente cartella per persona come in `staff-avatars`: il materiale è dell'azienda, non di chi l'ha caricato, e una gerarchia per autore renderebbe più difficile trovarlo senza rendere niente più sicuro.
- **Scrittura:** solo via server action (`creaRisorsa` / `eliminaRisorsa` in `lib/staff/azioni-f5.ts`) con service-role, dopo il controllo `role === 'admin'`. La riga in tabella la scrive invece il client con i cookie, sotto la policy `staff_resources_write` della 0030. Se l'insert fallisce, il file appena caricato viene rimosso: senza quella pulizia resterebbe nel bucket senza nessuna riga che lo nomini, cioè invisibile e incancellabile dall'interfaccia.

### Ricreazione (service-role)
```js
await supabase.storage.createBucket('staff-resources', {
  public: false,
  fileSizeLimit: '10MB',
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
})
```
Già creato sul progetto di produzione attuale (28 settembre 2026).
