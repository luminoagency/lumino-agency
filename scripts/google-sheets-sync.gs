/**
 * Google Apps Script — Lumino events tracker + Reservations email lifecycle
 *
 * Multi-funzione (1 deployment, più endpoint logici via body.kind):
 *  - signup / login / plan_change / site_published / reservation_count → tracking
 *  - reservation_ack                → email "abbiamo ricevuto" al guest
 *  - owner_notify_reservation       → email al ristoratore "nuova prenotazione"
 *  - reservation_confirmed          → email "confermata" al guest
 *  - reservation_cancelled          → email "spiacenti" al guest
 *
 * SETUP (10 min, una volta sola):
 * 1. Vai su https://script.google.com con outlumino@gmail.com
 * 2. Nuovo progetto → rinomina "Lumino Sync"
 * 3. Incolla TUTTO questo file in Code.gs (sostituendo il contenuto)
 * 4. Imposta lo Script Property LUMINO_SHEET_SECRET (Project Settings → Script properties)
 *    Stesso valore in .env.local del progetto Next.js.
 * 5. Salva
 * 6. Deploy → Nuovo deployment → Tipo: "App Web"
 *    - Esegui come: Me (outlumino@gmail.com)
 *    - Chi può accedere: "Chiunque"
 * 7. Copia l'URL del deployment (finisce in /exec)
 * 8. Lo stesso URL va in più env del progetto Next.js:
 *      LUMINO_SHEET_WEBHOOK_URL           = <URL>
 *      LUMINO_RESERVATION_ACK_URL         = <URL>
 *      LUMINO_OWNER_NOTIFY_URL            = <URL>
 *      LUMINO_RESERVATION_OUTCOME_URL     = <URL>
 */

// Lascia vuoto al primo deploy: lo script crea il foglio e logga l'ID.
// Una volta creato, mettilo qui per riutilizzarlo.
const SHEET_ID = '';

// "Mittente" pubblico per le mail di prenotazione (deve essere un alias verificato
// sull'account che esegue lo script). NOTA: GmailApp non permette di settare un
// from completamente diverso; serve un alias verificato in Settings → Accounts.
const PRENOTAZIONI_DISPLAY_NAME_DEFAULT = 'Prenotazioni';

/* ─────────────────────────  ENTRY  ───────────────────────── */

function doGet() {
  return ContentService
    .createTextOutput('Lumino sync is alive')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var kind = body.kind || 'unknown';

    // Auth via secret nel payload
    var expected = PropertiesService.getScriptProperties().getProperty('LUMINO_SHEET_SECRET');
    if (expected && body.secret !== expected) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
    }

    switch (kind) {
      // ── Tracking events ──────────────────────────────────────────
      case 'signup':
      case 'login':
      case 'plan_change':
      case 'site_published':
      case 'reservation_count':
        return appendTrackingRow(kind, body);

      // ── Reservation email lifecycle ──────────────────────────────
      case 'reservation_ack':
        return handleReservationAck(body);
      case 'owner_notify_reservation':
        return handleOwnerNotify(body);
      case 'reservation_confirmed':
      case 'reservation_cancelled':
        return handleReservationOutcome(body, kind);

      default:
        return appendTrackingRow('unknown', body);
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
}

/* ─────────────────────────  TRACKING  ───────────────────────── */

function appendTrackingRow(kind, body) {
  var ss = getSheet();
  var sheet = getOrCreateTab(ss, kindToTabName(kind));
  var row;
  switch (kind) {
    case 'signup':
      ensureHeader(sheet, ['Timestamp', 'Data IT', 'Email', 'Ristorante', 'Piano', 'IP', 'User Agent', 'Referrer']);
      row = [body.timestamp, body.timestamp_it, body.email, body.restaurantName, body.plan || 'basic', body.ip || '', body.userAgent || '', body.referrer || ''];
      break;
    case 'login':
      ensureHeader(sheet, ['Timestamp', 'Data IT', 'Email', 'IP']);
      row = [body.timestamp, body.timestamp_it, body.email, body.ip || ''];
      break;
    case 'plan_change':
      ensureHeader(sheet, ['Timestamp', 'Data IT', 'Email', 'Da', 'A']);
      row = [body.timestamp, body.timestamp_it, body.email, body.from, body.to];
      break;
    case 'site_published':
      ensureHeader(sheet, ['Timestamp', 'Data IT', 'Email', 'Ristorante', 'URL Sito']);
      row = [body.timestamp, body.timestamp_it, body.email, body.restaurantName, body.siteUrl];
      break;
    case 'reservation_count':
      // SOLO dati aggregati. Mai email/telefono/nome del guest.
      ensureHeader(sheet, ['Timestamp', 'Data IT', 'Ristorante slug', 'Restaurant ID', 'Data prenotazione']);
      row = [body.timestamp, body.timestamp_it, body.slug || '', body.restaurant_id || '', body.date_only || ''];
      break;
    default:
      ensureHeader(sheet, ['Timestamp', 'Data IT', 'Kind', 'Payload']);
      row = [body.timestamp || new Date().toISOString(), body.timestamp_it || '', kind, JSON.stringify(body)];
  }
  sheet.appendRow(row);
  return jsonResponse({ ok: true });
}

/* ─────────────────────────  EMAIL: ACK GUEST  ───────────────────────── */

function handleReservationAck(body) {
  if (!body.guest_email) return jsonResponse({ ok: false, error: 'guest_email mancante' }, 400);
  var firstName = firstWord(body.guest_name);
  var dateNice  = formatDateIt(body.date);

  var subject = 'Abbiamo ricevuto la tua richiesta — ' + (body.restaurant_name || '');
  var bodyText =
    'Ciao ' + firstName + ',\n\n' +
    'abbiamo ricevuto la tua richiesta per ' + dateNice + ' alle ' + body.time +
    ' per ' + body.people + ' ' + (body.people === 1 ? 'persona' : 'persone') + '.\n' +
    'Ti confermiamo al più presto.\n\n' +
    '— ' + (body.restaurant_name || 'Il ristorante');

  sendGuestEmail({
    to: body.guest_email,
    subject: subject,
    body: bodyText,
    replyTo: body.restaurant_reply_to || '',
    restaurantName: body.restaurant_name || PRENOTAZIONI_DISPLAY_NAME_DEFAULT,
  });
  return jsonResponse({ ok: true });
}

/* ─────────────────────  EMAIL: NOTIFY OWNER  ───────────────────── */

function handleOwnerNotify(body) {
  if (!body.owner_email) return jsonResponse({ ok: false, error: 'owner_email mancante' }, 400);
  var dateNice = formatDateIt(body.date);

  var subject = 'Nuova prenotazione · ' + body.restaurant_name;
  var bodyText =
    'Hai una nuova prenotazione in attesa di conferma.\n\n' +
    'Cliente: ' + body.guest_name + '\n' +
    'Telefono: ' + body.guest_phone + '\n' +
    'Quando: ' + dateNice + ' · ' + body.time + '\n' +
    'Persone: ' + body.people + '\n' +
    (body.notes ? 'Note: ' + body.notes + '\n' : '') +
    '\n' +
    'Conferma o annulla dal pannello:\n' +
    (body.admin_url || 'https://bylumino.com/admin/prenotazioni');

  GmailApp.sendEmail(body.owner_email, subject, bodyText, {
    name: 'Lumino — ' + (body.restaurant_name || 'Prenotazioni'),
    noReply: false,
  });
  return jsonResponse({ ok: true });
}

/* ─────────────────────  EMAIL: OUTCOME GUEST  ───────────────────── */

function handleReservationOutcome(body, kind) {
  if (!body.guest_email) return jsonResponse({ ok: false, error: 'guest_email mancante' }, 400);
  var firstName = firstWord(body.guest_name);
  var dateNice  = formatDateIt(body.date);

  var subject, bodyText;
  if (kind === 'reservation_confirmed') {
    subject = 'Prenotazione confermata — ' + body.restaurant_name;
    bodyText =
      'Ciao ' + firstName + ',\n\n' +
      'confermiamo la tua prenotazione per ' + dateNice + ' alle ' + body.time +
      ' per ' + body.people + ' ' + (body.people === 1 ? 'persona' : 'persone') + '.\n' +
      (body.owner_note ? '\n' + body.owner_note + '\n' : '') +
      '\nTi aspettiamo!\n\n' +
      '— ' + body.restaurant_name;
  } else {
    subject = 'Spiacenti, non possiamo confermare — ' + body.restaurant_name;
    bodyText =
      'Ciao ' + firstName + ',\n\n' +
      'ci dispiace ma non possiamo confermare la tua prenotazione per ' +
      dateNice + ' alle ' + body.time + '.\n' +
      (body.owner_note ? '\n' + body.owner_note + '\n' : '') +
      '\nSe vuoi, prova con un altro orario o contattaci direttamente.\n\n' +
      '— ' + body.restaurant_name;
  }

  sendGuestEmail({
    to: body.guest_email,
    subject: subject,
    body: bodyText,
    replyTo: body.restaurant_reply_to || '',
    restaurantName: body.restaurant_name || PRENOTAZIONI_DISPLAY_NAME_DEFAULT,
  });
  return jsonResponse({ ok: true });
}

/* ─────────────────────────  HELPERS  ───────────────────────── */

function sendGuestEmail(opts) {
  GmailApp.sendEmail(opts.to, opts.subject, opts.body, {
    name: opts.restaurantName,             // display name visualizzato dal guest
    replyTo: opts.replyTo || undefined,    // risposte vanno direttamente al ristoratore
    noReply: false,
  });
}

function firstWord(s) {
  if (!s) return '';
  return String(s).trim().split(/\s+/)[0];
}

function formatDateIt(iso) {
  if (!iso) return '';
  try {
    var d = new Date(iso + 'T00:00:00');
    var giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    var mesi = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    return giorni[d.getDay()] + ' ' + d.getDate() + ' ' + mesi[d.getMonth()];
  } catch (e) {
    return iso;
  }
}

function kindToTabName(kind) {
  return kind.charAt(0).toUpperCase() + kind.slice(1).replace(/_/g, ' ');
}

function getSheet() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  var ss = SpreadsheetApp.create('Lumino Events Tracker');
  Logger.log('Created new sheet: ' + ss.getId());
  return ss;
}

function getOrCreateTab(ss, tabName) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) sheet = ss.insertSheet(tabName);
  return sheet;
}

function ensureHeader(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a1a1a');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}

function jsonResponse(obj, status) {
  // Apps Script non supporta status code custom in ContentService;
  // ritorniamo sempre ok: in caso di errore body.ok=false.
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
