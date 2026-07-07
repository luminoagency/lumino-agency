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
