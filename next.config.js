/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  experimental: {
    // Upload immagini: i file arrivano alle server action nel body (default 1MB) → alza a 10MB.
    serverActions: { bodySizeLimit: '10mb' },
    // sharp è un modulo nativo: non va impacchettato dal bundler delle server action.
    serverComponentsExternalPackages: ['sharp'],
  },
  async headers() {
    return [
      {
        /* Il service worker dell'area staff sta in radice per poter governare
           anche `/staff` (un worker governa solo la sua cartella, e
           `/staff/sw.js` non governerebbe la home della dashboard). Questa
           intestazione è l'unico modo di dargli un ambito diverso dal proprio,
           e senza di lei la registrazione con `{ scope: '/staff' }` fallisce. */
        source: '/staff-sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/staff' },
          /* Il file del worker non si mette mai in cache: è il pezzo che
             annuncia tutti gli altri, e una sua copia vecchia terrebbe ferma
             l'app a una versione che non c'è più. */
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        /* Icone e schermate d'avvio: non cambiano mai sotto lo stesso nome.
           Il filtro sull'estensione tiene fuori il manifest, che sta nella
           stessa cartella ma ha bisogno delle sue intestazioni: due regole che
           si sovrappongono qui non si sostituiscono, si sommano, e verrebbero
           fuori due `Cache-Control` sulla stessa risposta. */
        source: '/pwa/:file*.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        /* Il manifest del sito pubblico era `app/manifest.ts`, la convenzione
           di Next. Non va bene qui: quella convenzione scrive da sé
           `<link rel="manifest" href="/manifest.webmanifest">` in **ogni**
           pagina, e quel link vince su qualunque `metadata.manifest`
           dichiarato in un layout più interno. Finché era in piedi, installando
           dalla dashboard si installava il sito vetrina. Ora è un file statico
           e il link lo scrive il layout che lo vuole. */
        source: '/site.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/pwa/staff.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        // Un solo dominio canonico: con www. Senza questo reindirizzamento
        // bylumino.com e www.bylumino.com sono due siti distinti per i motori
        // di ricerca, e il valore dei link si divide fra i due.
        source: '/:path*',
        has: [{ type: 'host', value: 'bylumino.com' }],
        destination: 'https://www.bylumino.com/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
