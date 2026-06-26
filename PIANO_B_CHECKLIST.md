# PIANO B — Checklist attivazione email professionali

Procedura per passare dalla Gmail provvisoria (studio.bylumino@gmail.com)
alle email professionali su dominio bylumino.com.

## Quando attivarlo
- Quando hai i soldi per Zoho Mail Lite (~12€/mese per casella)
- Quando vuoi superare il limite Gmail gratuita (30 email/giorno)
- Quando l'identità professionale è più importante della velocità

## Cosa creerai
4 caselle account commerciali:
- matteo@bylumino.com
- francesca@bylumino.com
- davide@bylumino.com
- sara@bylumino.com

Più: info@bylumino.com (contatti pubblici)

## Procedura

### 1. Crea l'account Zoho Mail Lite
- mail.zoho.com → "Add Custom Domain"
- Inserisci: bylumino.com
- Segui procedura DNS (record da mettere su Porkbun)
- Aspetta verifica (~30 min)

### 2. Crea le 5 caselle
- Pannello Zoho → Users → Add User
- 4 nomi + info@
- Password forti in password manager
- Forward info@ → tua Gmail personale

### 3. Genera password SMTP App-Specific
Per ogni casella:
- Profilo → Account Security → App Passwords → Generate
- Salva la password generata

### 4. Inserisci password SMTP cifrate nel DB
- Vanno cifrate con OUTREACH_SMTP_KEY (env Vercel)
- Inserisci via /lumino-admin (funzionalità credenziali)
- NON in .env diretto

### 5. Aggiorna in `lib/feature-flags.ts`
PRO_EMAIL_ACTIVE: true
MANUAL_SEND_MODE: false (se vuoi invio automatico)

E in `lib/company.ts`:
PUBLIC_CONTACT_EMAIL: 'info@bylumino.com'

### 6. Cambia account in DB
SQL su Supabase:
UPDATE outreach_accounts SET status = 'active';

### 7. Test
- 1 email test per ognuno dei 4 account
- Verifica arrivi, firme, risposte

### 8. Deploy
- Commit + push
- Vercel deploya
- Verifica bylumino.com

## Rollback
1. PRO_EMAIL_ACTIVE: false
2. PUBLIC_CONTACT_EMAIL: 'studio.bylumino@gmail.com'
3. Commit + push

---
*Documento vivo — aggiornare se cambiano provider o procedure.*
v1.0 — FASE 1
