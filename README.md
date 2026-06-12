# Lumino Agency

An automated AI agency that builds professional websites for Italian restaurants.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database / Auth / Storage:** Supabase
- **Styling:** Tailwind CSS
- **Hosting:** Vercel

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local   # then fill in real values

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
.
├── app/                  # Next.js App Router (routes, layouts, API)
│   ├── api/health/       # Example route handler
│   ├── dashboard/        # Agency operations dashboard
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/           # React components
│   └── ui/               # Reusable UI primitives
├── lib/                  # Utilities + service integrations
│   ├── supabase/         # Browser + server Supabase clients
│   ├── integrations/     # Third-party API wrappers (one per service)
│   ├── constants.ts
│   ├── types.ts
│   └── utils.ts
├── public/               # Static assets
├── .env.local.example    # Required environment variables
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

## Integrations

External services are wrapped in `lib/integrations/` (stubs for now):
Google Maps, Claude (Anthropic), Unsplash, Ideogram, Porkbun, and Vercel.

See `.env.local.example` for the full list of required credentials.
