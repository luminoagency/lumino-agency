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
