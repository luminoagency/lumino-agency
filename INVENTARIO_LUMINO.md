# INVENTARIO LUMINO — Stato del codice

Mappa dei file/cartelle principali. Aggiornato post-FASE 1.

## Struttura top-level

app/                          # Pagine Next.js
  page.tsx                    # Home
  chi-siamo/                  # "Lo studio"
  faq/                        # FAQ pubblica
  pricing/                    # Prezzi
  inizia/                     # Form lead
  contatti/                   # Contatti
  cookie-policy/, privacy-policy/, gdpr/, termini-condizioni/,
  resi-rimborsi/, disclaimer/, come-funziona/
  preview/                    # Anteprima siti generati
  lumino-admin/               # Pannello super-admin
    page.tsx                  # Lista siti
    outreach-queue/           # Coda email manuale
    gmail-auth/               # OAuth (inerte, FASE 2)
  admin/                      # Pannello cliente
  register/                   # Onboarding nuovo cliente
  api/
    inizia/                   # Endpoint form lead
    outreach/next-batch/      # Cron generazione email
    cron/                     # Vari cron schedulati
    auth/gmail/callback/      # Inerte, FASE 2

lib/
  company.ts                  # PUBLIC_CONTACT_EMAIL + COMPANY data
  plans.ts                    # TIER_CAPS + SALES_TERMS (30/70)
  feature-flags.ts            # OUTREACH_ENABLED, PRO_EMAIL_ACTIVE,
                              # MANUAL_SEND_MODE
  warmup.ts                   # WARMUP_DAILY_LIMITS
  payments/status.ts          # getPaymentStatus, canStartWork, canGoLive
  cookies/consent.ts          # Modulo consenso GDPR
  outreach/
    compose.ts                # Voci dei 4 mittenti + guardrail
    types.ts                  # SendStatus, AccountName
  whatsapp/
    config.ts                 # BOT_PERSONAS + FAQ
    conversation.ts
  ai/whatsapp.ts              # Generazione risposta Claude API
  pipeline/generate.ts        # Pipeline costruzione sito
  email/transactional.ts      # Email conferma + notifica team
  integrations/gmail-oauth.ts # Inerte, FASE 2

components/
  cookie/CookieBanner.tsx     # Banner 3 bottoni
  cookie/ConsentGate.tsx      # Caricamento script condizionato
  site/SiteChrome.tsx         # Header + footer pubblico

templates/
  cinematico/, bento/, panoramico/, aurora/, mercato/
  _shared/                    # Condivisi dei 5 template
  shared/fonts.ts             # Font (solo app/preview)
  styles/luxury/, exotic/, modern/ (theme.css attivi)

supabase/migrations/
  0001-0017                   # Pre-FASE 1
  0018_rename_outreach_senders.sql
  0019_whatsapp_bot_persona.sql
  0020_remove_legacy_gmail_accounts.sql
  0021_inbound_leads.sql
  0022_payment_two_steps.sql
  0023_email_manual_queue.sql
  0024_gmail_oauth.sql        # Inerte, FASE 2

## File documentali
- IDENTITA_LUMINO.md          # Voce di brand
- PIANO_B_CHECKLIST.md        # Procedura attivazione pro
- FASE1_CHECKLIST.md          # Storico FASE 1
- ROADMAP.md                  # Fasi future
- INVENTARIO_LUMINO.md        # Questo file
- WARMUP_TRACKER.md           # Progressione warmup
- MANUALE_OPERATIVO_LUMINO.md # Per socio
- ADMIN_CONFIG.md             # Solo Ayman

## Cose deprecate/inerti
- `payment_confirmed` in `sites` → usare first/final_payment_confirmed
- `lib/integrations/gmail-oauth.ts` → inerte fino a FASE 2
- Cron `read-gmail-replies` rimosso da vercel.json

---
*Documento vivo — aggiornare quando si aggiungono/cancellano file importanti.*
v1.1 — Post-FASE 1
