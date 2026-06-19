# Setup DNS bylumino.com per Zoho Mail (SPF · DKIM · DMARC)

Setup completo per spedire da `@bylumino.com` con la migliore deliverability possibile.
Servono 5 record DNS su **Namecheap → Advanced DNS** del dominio `bylumino.com`.

⚠️ **Ordine consigliato**: prima crea gli account Zoho, poi imposta i record DNS, poi attendi 24-48h prima di iniziare il warm-up.

---

## 1. MX (Zoho Mail server)

Tipo: **MX Record**

| Type | Host | Value | Priority | TTL |
|------|------|-------|----------|-----|
| MX | `@` | `mx.zoho.eu` | 10 | Automatic |
| MX | `@` | `mx2.zoho.eu` | 20 | Automatic |
| MX | `@` | `mx3.zoho.eu` | 50 | Automatic |

> Su Namecheap: Sezione **Mail Settings** → **Custom MX** → Add Record.

---

## 2. SPF (autorizza Zoho a inviare per il dominio)

Tipo: **TXT Record**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| TXT | `@` | `v=spf1 include:zoho.eu ~all` | Automatic |

> Se hai già un altro SPF (es. da Apps Script Gmail), **fondi tutto in un solo record**:
> `v=spf1 include:zoho.eu include:_spf.google.com ~all`
> SPF non ammette più record TXT separati per il dominio.

---

## 3. DKIM (firma le email per autenticarle)

⚠️ DKIM è **per-account/dominio**. Devi prenderla dalla console Zoho.

**Step**:
1. Login Zoho Mail Admin → https://mailadmin.zoho.eu
2. Sidebar: **Domains** → seleziona `bylumino.com`
3. Tab **Email Configuration** → **DKIM**
4. Click **Add** → selector consigliato: `zmail`
5. Copia il valore generato (lunga stringa che inizia con `v=DKIM1; k=rsa; p=...`)

Crea su Namecheap:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| TXT | `zmail._domainkey` | `v=DKIM1; k=rsa; p=<COPIA DA ZOHO>` | Automatic |

Torna su Zoho → click **Verify**. Stato deve diventare **Verified ✓**.

---

## 4. DMARC (policy che dice ai destinatari cosa fare se SPF/DKIM falliscono)

Tipo: **TXT Record**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@bylumino.com; ruf=mailto:dmarc@bylumino.com; sp=quarantine; aspf=r; adkim=r; pct=100` | Automatic |

> `p=quarantine` mette le mail sospette in Spam (non scarta — meglio per la fase warm-up).
> Quando dopo 30+ giorni la deliverability è solida puoi passare a `p=reject`.

Crea anche l'alias `dmarc@bylumino.com` su Zoho per ricevere i report aggregati (settimanali).

---

## 5. Verifica completa

Dopo che i record si sono propagati (15 min — 2h):

- **SPF**: https://mxtoolbox.com/spf.aspx — controlla `bylumino.com`, deve mostrare verde
- **DKIM**: https://mxtoolbox.com/dkim.aspx — `bylumino.com` con selector `zmail`
- **DMARC**: https://mxtoolbox.com/dmarc.aspx — verifica record valido
- **Test invio**: manda un'email da `luca@bylumino.com` a `check-auth2@verifier.port25.com`. Ricevi un report con SPF/DKIM/DMARC tutti `pass`.

---

## 6. Setup degli account Zoho

Per ognuno dei 4 mittenti (Luca, Pietro, Giovanni, Gabriele):

1. **Zoho Mail Admin** → **Users** → **Add User**
2. Email: `luca@bylumino.com` (analogo per gli altri 3)
3. Password forte
4. Login a Zoho con l'account → **Settings** → **Mail Accounts** → genera **App Password** per SMTP (necessaria se hai 2FA attiva)
5. Annota la password (è quella che cifreremo per `outreach_accounts.smtp_password_encrypted`)

---

## 7. Setup account neutro per prenotazioni

Account dedicato per le mail di ack/conferma/annullo prenotazioni:

1. Crea `prenotazioni@bylumino.com` su Zoho
2. Password + App password
3. Mettila in `ZOHO_SMTP_PRENOTAZIONI_PASSWORD` su Vercel

---

## 8. Setup alias DMARC

Crea un alias (non un account separato):
- `dmarc@bylumino.com` → forward al tuo Gmail di gestione

Riceverai 1 report aggregato/giorno per le prime settimane: leggilo per controllare che SPF/DKIM siano sempre verdi.

---

## 9. Reverse DNS (PTR) — opzionale ma raccomandato

Solo se hai control sul PTR del tuo IP di invio: imposta PTR a `smtp.zoho.eu` o equivalente.
Zoho lo gestisce loro, normalmente non devi fare nulla.

---

## 10. Checklist finale

- [ ] MX configurato (3 record)
- [ ] SPF singolo, include `zoho.eu`
- [ ] DKIM `zmail._domainkey` verificato verde su Zoho
- [ ] DMARC `_dmarc` con `p=quarantine`
- [ ] 4 account Zoho creati con App Password
- [ ] Account `prenotazioni@bylumino.com` creato
- [ ] Alias `dmarc@bylumino.com` configurato
- [ ] mxtoolbox: tutti verdi
- [ ] port25 verifier: tutti `pass`
- [ ] 24-48h trascorse prima del primo invio
- [ ] Password cifrate con `OUTREACH_SMTP_KEY` e salvate in `outreach_accounts.smtp_password_encrypted`

Dopodichè il warm-up partirà automaticamente al primo tick di `/api/cron/warmup-tick`.
