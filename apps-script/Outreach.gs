/**
 * Lumino Agency — Outreach.gs
 *
 * One copy of this script runs inside each of the 4 Gmail accounts
 * (outlumino1–4). Configuration is stored in Script Properties so the
 * source stays identical across all four deployments.
 *
 * Entry points (set as time-based triggers via setupTriggers()):
 *   runNightlyOutreach() — fetches a batch, sends emails, reports results
 *   checkReplies()       — scans inbox for replies and reports them
 *
 * Run setupTriggers() once manually after pasting this script.
 */

// ── Configuration ─────────────────────────────────────────────
// Read from Script Properties (Extensions → Apps Script → Project Settings
// → Script Properties). Never hard-code these values in source.

function apiBase_()    { return PropertiesService.getScriptProperties().getProperty('API_BASE'); }
function secret_()     { return PropertiesService.getScriptProperties().getProperty('OUTREACH_SECRET'); }
function accountName_() { return PropertiesService.getScriptProperties().getProperty('ACCOUNT_NAME'); }
function myEmail_()    { return Session.getEffectiveUser().getEmail(); }

// ── Public entry points ───────────────────────────────────────

/**
 * Nightly outreach run. Fetches this account's send batch from the API,
 * sends each email via the Gmail REST API (so we get the messageId +
 * threadId back), and reports each result.
 */
function runNightlyOutreach() {
  var batch = fetchNextBatch_();
  if (!batch || batch.length === 0) {
    Logger.log('[' + accountName_() + '] No emails to send.');
    return;
  }
  Logger.log('[' + accountName_() + '] Sending ' + batch.length + ' email(s).');

  for (var i = 0; i < batch.length; i++) {
    var item = batch[i];
    try {
      var pixelUrl = apiBase_() + '/api/t/' + item.token;
      var html = buildHtml_(item.body, pixelUrl);
      var sent = gmailSend_(item.to, item.subject, item.body, html, item.threadId || null);
      reportResult_(item.token, true, sent.id, sent.threadId);
      Logger.log('[' + (i + 1) + '/' + batch.length + '] sent → ' + item.to);
    } catch (e) {
      Logger.log('[' + (i + 1) + '/' + batch.length + '] FAILED → ' + item.to + ': ' + e.message);
      reportResult_(item.token, false, null, null, e.message);
    }

    // 4-second pause between sends to stay within Gmail's rate limits
    // and avoid triggering spam filters on rapid-fire bursts.
    if (i < batch.length - 1) Utilities.sleep(4000);
  }

  Logger.log('[' + accountName_() + '] Done.');
}

/**
 * Daily reply check. Scans inbox for unread threads we started and reports
 * any inbound replies to /api/outreach/replies so the weekly learner can
 * measure per-strategy reply rates.
 */
function checkReplies() {
  var threads = GmailApp.search('in:inbox is:unread', 0, 50);
  var reported = 0;
  var me = myEmail_().toLowerCase();

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var messages = thread.getMessages();

    // We must have started the thread.
    if (messages.length < 2) continue;
    if (messages[0].getFrom().toLowerCase().indexOf(me) === -1) continue;

    // Find the first message not from us — that's the reply.
    var reply = null;
    for (var j = 1; j < messages.length; j++) {
      if (messages[j].getFrom().toLowerCase().indexOf(me) === -1) {
        reply = messages[j];
        break;
      }
    }
    if (!reply) continue;

    var threadId = thread.getId();
    var repliedAt = reply.getDate().toISOString();

    try {
      var res = apiCall_('POST', '/api/outreach/replies', { threadId: threadId, repliedAt: repliedAt });
      if (res && res.ok) {
        thread.markRead();
        reported++;
        Logger.log('Reply reported: thread ' + threadId);
      }
    } catch (e) {
      Logger.log('Reply report error [' + threadId + ']: ' + e.message);
    }
  }

  Logger.log('[' + accountName_() + '] Replies reported: ' + reported);
}

// ── One-time trigger setup ────────────────────────────────────

/**
 * Run this function once manually after deploying each account's script.
 * Removes any existing triggers first to avoid duplicates.
 *
 * Send window: 07:00–08:00 UTC = 09:00–10:00 CEST / 08:00–09:00 CET.
 * Stagger accounts by using a different atHour() per account if you want
 * to spread sends across the morning (see README).
 */
function setupTriggers() {
  // Remove all existing triggers.
  ScriptApp.getProjectTriggers().forEach(function(t) { ScriptApp.deleteTrigger(t); });

  // Nightly outreach at 07:00 UTC.
  ScriptApp.newTrigger('runNightlyOutreach')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  // Reply check daily at noon UTC.
  ScriptApp.newTrigger('checkReplies')
    .timeBased()
    .everyDays(1)
    .atHour(12)
    .create();

  Logger.log('Triggers installed for account: ' + accountName_());
}

// ── Private helpers ───────────────────────────────────────────

function fetchNextBatch_() {
  try {
    var res = apiCall_('GET', '/api/outreach/next-batch?account=' + accountName_(), null);
    return (res && res.ok) ? res.batch : [];
  } catch (e) {
    Logger.log('fetchNextBatch error: ' + e.message);
    return [];
  }
}

function reportResult_(token, ok, messageId, threadId, errorMsg) {
  var body = { token: token, ok: ok };
  if (messageId) body.messageId = messageId;
  if (threadId)  body.threadId  = threadId;
  if (errorMsg)  body.error     = errorMsg;
  try {
    apiCall_('POST', '/api/outreach/report', body);
  } catch (e) {
    Logger.log('reportResult error [' + token + ']: ' + e.message);
  }
}

/**
 * Generic API caller. Throws on HTTP 5xx; returns parsed JSON otherwise.
 * 4xx errors are returned as parsed JSON so callers can inspect the body.
 */
function apiCall_(method, path, body) {
  var options = {
    method: method.toLowerCase(),
    headers: {
      'Authorization': 'Bearer ' + secret_(),
      'Content-Type': 'application/json',
    },
    muteHttpExceptions: true,
  };
  if (body !== null && body !== undefined) {
    options.payload = JSON.stringify(body);
  }

  var response = UrlFetchApp.fetch(apiBase_() + path, options);
  var code = response.getResponseCode();

  if (code >= 500) {
    throw new Error('API error ' + code + ': ' + response.getContentText());
  }
  return JSON.parse(response.getContentText());
}

/**
 * Send an email via the Gmail REST API (not GmailApp.sendEmail) so we
 * receive the gmail message ID and thread ID in the response.
 * Returns { id, threadId } from the Gmail API.
 */
function gmailSend_(to, subject, plainText, htmlText, replyToThreadId) {
  var mime = buildMimeMessage_(to, subject, plainText, htmlText);
  var raw = Utilities.base64EncodeWebSafe(mime, Utilities.Charset.UTF_8);

  var payload = { raw: raw };
  if (replyToThreadId) payload.threadId = replyToThreadId;

  var response = UrlFetchApp.fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + ScriptApp.getOAuthToken(),
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    }
  );

  if (response.getResponseCode() !== 200) {
    throw new Error(
      'Gmail API ' + response.getResponseCode() + ': ' + response.getContentText()
    );
  }

  return JSON.parse(response.getContentText()); // { id, threadId, labelIds }
}

/**
 * Build a multipart/alternative MIME message (plain text + HTML).
 * Non-ASCII subject is RFC 2047 encoded so it renders correctly in
 * all mail clients.
 */
function buildMimeMessage_(to, subject, plainText, htmlText) {
  var boundary = 'lumino_' + Utilities.getUuid().replace(/-/g, '');
  var encodedSubject =
    '=?UTF-8?B?' +
    Utilities.base64Encode(subject, Utilities.Charset.UTF_8) +
    '?=';

  return [
    'MIME-Version: 1.0',
    'To: ' + to,
    'Subject: ' + encodedSubject,
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    plainText,
    '',
    '--' + boundary,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlText,
    '',
    '--' + boundary + '--',
  ].join('\r\n');
}

/**
 * Wrap the plain-text body in neutral HTML and append a 1×1 tracking pixel.
 * Styling is intentionally minimal so the email reads like a personal note,
 * not a marketing newsletter.
 */
function buildHtml_(plainBody, pixelUrl) {
  var escaped = plainBody
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>\n');

  return (
    '<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#222">' +
    escaped +
    '</div>' +
    '<img src="' + pixelUrl + '" width="1" height="1" alt="" style="display:none">'
  );
}
