# ROADMAP LUMINO

## FASE 1 — Fondamenta ✅ COMPLETATA
Allineamento codice, identità, pagamento 30/70, GDPR, modalità manuale.

## FASE 2 — Outreach intelligente
**Quando:** quando warmup è completato (4+ settimane) e hai dati sulle email che funzionano

- OAuth Gmail per lettura risposte automatica + classificazione
  (interested / question / not_interested / out_of_target / ambiguous)
- Audit profondo del locale (13+ campi: sito? mobile? booking? recensioni?
  menu? foto? social? ecc.)
- 6 hook email definitivi mappati a problemi audit:
  - no_website
  - only_social
  - listing_incomplete
  - sito_vecchio
  - no_booking
  - passaparola
- Logica selezione hook (match con problemi audit, no round-robin)
- Sequenza follow-up con voce coerente (D+0, D+3, D+7)
- Esempi seed per ogni hook + mittente
- Hook con nomi corti nella dashboard

## FASE 3 — Produzione automatica
**Quando:** quando i primi 10 clienti sono soddisfatti

- Pipeline auto-fill end-to-end
- Deploy Vercel automatico
- Porkbun acquisto/configurazione domini
- Integrazione payment provider (GoCardless, Revolut Business)
- Email transazionali avanzate

## FASE 4 — Dashboard cliente completa
**Quando:** quando il cliente vuole controllo del suo sito

- CRM clienti con storico
- Upload foto e logo custom
- Modifica testi del sito
- Cambio template/stile
- Personalizzazione colori e font
- Statistiche visite
- Export CSV
- Newsletter
- Moderazione recensioni

## FASE 5 — Lumino Lab (uso personale Ayman)
**Quando:** siti premium "fatti a mano" per clienti speciali

- Binario separato dai 5 template
- Componenti custom
- Librerie avanzate (Lenis smooth scroll)
- Pricing alto (€2.000+)

## Debito tecnico registrato
- Warning hydration su /pricing (style block)
- UI ottimistica AdminEditor.generateAI (1,5s disallineamento)
- Migration 0014 INSERT su colonne non create
- Tabelle gmail_oauth_tokens + email_replies create ma inutilizzate
  (attivare in FASE 2)

---
*Documento vivo — aggiornare quando si completa una fase o cambiano piani futuri.*
v1.0 — FASE 1
