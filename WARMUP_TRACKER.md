# WARMUP TRACKER — Gmail cold outreach

Tracker della progressione warmup Gmail per cold outreach.

## Progressione settimanale

| Settimana | Limite email/giorno |
|---|---|
| 1 | 5 |
| 2 | 10 |
| 3 | 15 |
| 4 | 20 |
| dalla 5 in poi | 30 (max Gmail gratuita) |

## Quando si attiva PIANO B

Quando si passa alle caselle email pro su bylumino.com (vedi `PIANO_B_CHECKLIST.md`),
questi limiti vengono superati e il volume sale a 50-100/giorno automatico.

## Calcolo settimana attuale

Il sistema calcola la settimana corrente partendo dal `manually_sent_at` 
più vecchio in tabella `emails_sent`. Vedi `lib/warmup.ts`.

## Cosa NON fare durante il warmup

- ❌ Superare il limite del giorno
- ❌ Mandare tutte le email in 5 minuti
- ❌ Saltare giorni e recuperare in un colpo solo
- ❌ Mandare email "extra" a sconosciuti dalla stessa Gmail
- ❌ Allegati (PDF, immagini)
- ❌ Più di un link nelle prime 100 email

## Segnali di problema

- Email che bounciano con messaggi tipo "550 5.7.1 Spam content"
- Gmail chiede verifica identità
- Risposte calano improvvisamente
- Destinatari segnalano spam

Se vedi questi → STOP 48h, contatta Ayman.

---
*Documento vivo — aggiornare se cambia la strategia di warmup.*
v1.0 — FASE 1
