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
