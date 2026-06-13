# Apps Script Setup — Outreach Sender

One copy of `Outreach.gs` runs inside each of the 4 Gmail accounts
(`outlumino1`–`outlumino4`). Repeat steps 1–7 for every account.

---

## Prerequisites

- Vercel deployment live and `OUTREACH_SECRET` set in Vercel env vars
- All 4 Gmail accounts created and logged into Chrome (or separate browser profiles)
- `warmup_started_at` and `active = true` set in Supabase for each account
  when you're ready to begin sending

---

## Steps (repeat for each Gmail account)

### 1. Create a new Apps Script project

1. Sign in to Google as `outluminoN@gmail.com`
2. Go to [script.google.com](https://script.google.com) → **New project**
3. Rename the project to `Lumino Outreach – outluminoN`

### 2. Add the script

1. Delete the empty `Code.gs` file that appears by default
2. Click **+** → **Script file**, name it `Outreach`
3. Paste the full contents of `Outreach.gs` into the editor
4. Click **Save** (⌘S / Ctrl+S)

### 3. Set Script Properties

Go to **Project Settings** (gear icon, left sidebar) → **Script Properties** → **Add property**.

Add all three:

| Property | Value |
|---|---|
| `API_BASE` | `https://your-app.vercel.app` (no trailing slash) |
| `OUTREACH_SECRET` | *(the value from your `.env.local`)* |
| `ACCOUNT_NAME` | `outlumino1` (change for each account) |

### 4. Enable the Gmail API

1. Left sidebar → **Services** (+ icon)
2. Find **Gmail API** → **Add**

### 5. Authorize OAuth scopes

1. In the editor, select `runNightlyOutreach` from the function dropdown
2. Click **Run** — Google will ask for permissions
3. Click **Review permissions** → choose this Google account → **Allow**

   Required scopes (granted automatically):
   - `https://mail.google.com/` — send and read Gmail
   - `https://www.googleapis.com/auth/script.external_request` — call your API

### 6. Test manually

Run `runNightlyOutreach` once from the editor. Check **Execution log** (View → Logs).

Expected output when no leads are queued yet:
```
[outlumino1] No emails to send.
```

Expected output when leads exist:
```
[outlumino1] Sending 10 email(s).
[1/10] sent → restaurant@example.it
...
[outlumino1] Done.
```

### 7. Install triggers

1. Select `setupTriggers` from the function dropdown
2. Click **Run**
3. Verify in **Triggers** (clock icon, left sidebar): two triggers appear —
   `runNightlyOutreach` (daily, 7am) and `checkReplies` (daily, noon)

---

## Staggering send times across accounts (optional)

To spread sends across the morning rather than all firing at 07:00 UTC,
edit `setupTriggers()` in each account's copy of the script and change
`.atHour(7)` to a different hour per account:

| Account | `atHour` | Italian local time (CEST) |
|---|---|---|
| outlumino1 | 7 | 09:00 |
| outlumino2 | 8 | 10:00 |
| outlumino3 | 9 | 11:00 |
| outlumino4 | 10 | 12:00 |

---

## Warm-up schedule

The API enforces warm-up caps automatically based on `warmup_started_at`.
You do not need to change the script as caps increase.

| Days since start | Daily cap per account |
|---|---|
| 1–7 | 10 |
| 8–14 | 20 |
| 15–21 | 30 |
| 22–28 | 40 |
| 29+ | 50 (account's `daily_cap_target`) |

To start an account: set `warmup_started_at = today` and `active = true`
in Supabase `outreach_accounts`. The script picks it up on the next run.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `API error 401` | Check `OUTREACH_SECRET` in Script Properties matches Vercel |
| `API error 500` | Check Vercel function logs for the failing route |
| `Gmail API 403` | Re-run authorization (step 5) |
| `No emails to send` | Check `outreach_accounts.active` and `warmup_started_at` in Supabase |
| Emails sent but `markSent` fails | Token mismatch; stale claim will be released on the next run |
