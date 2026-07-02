# LUMINO LAB — HANDOFF FINALE

## ✅ COMPLETATO AL 100%

### Pipeline Lab (Step 1-6)
1. Research — Opus analizza business da URL/nome
2. Layout — proposte multi-pagina (preset Hotel Boutique per ricettivi)
3. Builder — assemblaggio da libreria 103 certificati + custom intelligente
4. Editor — palette, testi, foto, sezioni, componenti, sostituzione, multi-device, multi-lingua
5. Publish — audit qualità + deploy Vercel + dominio custom + SSL + test mode
6. Subscription — abbonamenti hotel (manuale, provider da collegare)

### Libreria
- 103 componenti certificati safe:true
- Multi-business (ristorante/hotel/barbiere/dentista)
- Palette CSS vars dinamica
- Italiano/inglese/tedesco
- GDPR obbligatorio nei form
- Layout, size, tone configurabili

### Layer completati
- Layer 1: Multi-pagina + custom intelligente ✅
- Layer 2: Branding cliente (logo/palette/font/tono/social) ✅
- Layer 3: Asset management + Modalità Hotel ✅
- Layer 4: Publish Vercel + test mode ✅
- Layer 4.5: Multi-lingua IT/EN/DE opt-in ✅
- Layer 4.6: Subscription hotel (parte neutra) ✅
- Layer 4.7: Photo Import multi-fonte hotel ✅
- Layer 5: Dashboard cliente su dominio cliente (/portal) ✅
- Layer 6: Audit pre-publish + polish finale ✅

### Dashboard cliente (/portal)
- Login + reset password
- Edit contenuti semplificato (testi/foto/prezzi/camere)
- Draft/publish workflow (bottone Pubblica dedicato)
- Upload foto libero max 10MB
- Contatti ricevuti dai form (no prenotazioni per hotel)
- Vista abbonamento read-only
- Settings account
- Onboarding wizard

### Audit pre-publish (Layer 6)
- 29 check: SEO, content, legal, branding, struttura, accessibilità, performance, multi-lingua
- Score 0-100 + conteggio critici/warning/info
- canPublish=false se ci sono errori critici → publish BLOCCATO (server + UI)
- UI nello Step 5 con dettaglio per categoria e pagine affette

### Endpoint pubblici
- /api/messages/[projectId] — ricezione form (sanitization, rate limit, GDPR); i form della libreria (contact/contact-2) e lo static export postano qui

## 🔲 FOLLOW-UP FUTURI
1. Collegare provider pagamenti (Stripe/SEPA) al Layer 4.6
2. Email service per notifiche (Resend/SES) — nuovi messaggi + reminder rinnovo
3. Cron scheduler per subscription overdue/reminder (logica pronta in subscription-cron.ts)
4. bylumino.com restyling con libreria certificata
5. Restyle admin Lumino con branding coerente
6. Compressione immagini nell'upload/photo-import (TODO sharp)
7. Rendering runtime dei componenti custom (ora mostrati come codice in anteprima)

## 🚨 DECISIONI NON DISCUTIBILI
- Modello AI: claude-opus-4-7 (NON 4.8, NON Sonnet) · effort medium · thinking adaptive
- Builder produce SiteBuild { pages[], globalConfig, navigation } JSON, NON HTML
- Componenti SOLO dalla libreria certificata, custom on-the-fly (che PARTE da un base) se manca
- Regole Lumino: italiano · € · framer-motion · lucide-react · GDPR nei form · palette CSS vars
- Editor: sidebar destra + preview sinistra
- Dashboard cliente su /portal (NON /admin, già usato dall'admin ristorante) con auth propria (cookie lumino_client_session, no Supabase)
- Italiano = lingua base; EN/DE sono override in section.translations
- Publish bloccato dall'audit se ci sono errori critici

## 📁 FILE CHIAVE
- lib/lab/builder.ts — tipi (SiteBuild/SitePage/SiteSection/GlobalConfig/ProjectAsset/Locale) + normalizeBuild + generateSection/generatePage + updateSectionProps
- lib/lab/layout.ts — generateLayouts multi-pagina + preset Hotel Boutique + localesForBusiness
- lib/lab/render.tsx — RenderSite/RenderPage/RenderSection (100+ loader, projectId nei form)
- lib/lab/section-utils.ts — updateSectionProps (puro, client-safe)
- lib/lab/branding.ts — logo + palette (node-vibrant) + upload asset
- lib/lab/photo-import.ts — import foto multi-fonte + categorizzazione Opus Vision
- lib/lab/translate.ts — traduzione IT→EN/DE (Opus)
- lib/lab/vercel.ts — deploy API (fetch nativo)
- lib/lab/static-export.ts — HTML statico multi-lingua + form + script + sitemap
- lib/lab/subscriptions.ts + subscription-cron.ts — abbonamenti (tipi/helper + cron)
- lib/lab/audit.ts — audit pre-publish (29 check)
- lib/lab/client-auth.ts + domain-resolver.ts — auth cliente (pbkdf2) + risoluzione dominio
- app/lumino-admin/lab/[id]/page.tsx — routing Step 1-6
- app/lumino-admin/lab/actions.ts — tutte le server action admin
- app/lumino-admin/lab/Step4Editor.tsx / Step5Publish.tsx / Step6Subscription.tsx
- app/lumino-admin/lab/help/page.tsx — guida
- app/lumino-admin/subscriptions/ — dashboard abbonamenti globale
- app/(client-site)/portal/* — dashboard cliente (login, content, publish, messages, subscription, settings, reset-password)
- app/(client-site)/api/messages/[projectId]/route.ts — endpoint form
- components/ui/* — primitivi shadcn
- scripts/ — test-lab-smoke, test-photo-import, test-form-submission, setup-lab

## ⚠️ NOTE TECNICHE
- Migration 0018-0023 scritte, NON applicate — applicale a mano quando pronto (in ordine)
- tsc --noEmit: 0 errori
- Test mode Publish funziona offline (scrive in public/published/{projectId}/)
- CLAUDE_API_KEY richiesta per generazione siti / traduzioni / categorizzazione foto
- Diagnostica: npx tsx scripts/setup-lab.ts
- Env: CLAUDE_API_KEY, Supabase (URL + service role), VERCEL_TOKEN/TEAM_ID/PREFIX, GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_LUMINO_APP_URL
