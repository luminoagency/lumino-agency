/**
 * Google Apps Script — Lumino events tracker
 *
 * SETUP (5 min, una volta sola):
 * 1. Vai su https://script.google.com con bylumino06@gmail.com
 * 2. Nuovo progetto → rinomina "Lumino Events"
 * 3. Incolla TUTTO questo file in Code.gs (sostituendo il contenuto)
 * 4. Salva (Ctrl+S)
 * 5. Deploy → Nuovo deployment → Tipo: "App Web"
 *    - Descrizione: "Lumino sync"
 *    - Esegui come: Me (bylumino06@gmail.com)
 *    - Chi può accedere: "Chiunque" (è un endpoint pubblico ma autenticato dal payload)
 * 6. Copia l'URL del deployment (finisce in /exec)
 * 7. Mettilo in .env.local del progetto: GOOGLE_SHEETS_WEBHOOK_URL=https://...
 *
 * SHEET:
 * Crea (o lascia che lo crei lui al primo evento) un Google Sheet.
 * Lo script aggiunge fogli "Signups", "Logins", "Plan Changes", "Reservations", "Sites".
 * Apri lo sheet ID e mettilo qui sotto, OPPURE lascia che lo script crei il sheet la prima volta.
 */

// METTI QUI L'ID DEL TUO SHEET (lo trovi nell'URL: /spreadsheets/d/XXXX/edit)
// Lascialo vuoto al primo deploy → lo script ti dirà l'ID del nuovo sheet creato
const SHEET_ID = '';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var kind = body.kind || 'unknown';

    var ss = getSheet();
    var sheet = getOrCreateTab(ss, kind);

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
      case 'reservation':
        ensureHeader(sheet, ['Timestamp', 'Data IT', 'Email Owner', 'Ristorante', 'Cliente', 'Data prenotazione', 'Persone']);
        row = [body.timestamp, body.timestamp_it, body.email, body.restaurantName, body.guestName, body.date, body.persons];
        break;
      case 'site_published':
        ensureHeader(sheet, ['Timestamp', 'Data IT', 'Email', 'Ristorante', 'URL Sito']);
        row = [body.timestamp, body.timestamp_it, body.email, body.restaurantName, body.siteUrl];
        break;
      default:
        ensureHeader(sheet, ['Timestamp', 'Data IT', 'Payload']);
        row = [body.timestamp || new Date().toISOString(), body.timestamp_it || '', JSON.stringify(body)];
    }

    sheet.appendRow(row);
    return jsonResponse({ ok: true });

  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  return ContentService
    .createTextOutput('Lumino sync is alive 🚀')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getSheet() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  // First-time setup: create a new sheet and log its ID
  var ss = SpreadsheetApp.create('Lumino Events Tracker');
  Logger.log('Created new sheet: ' + ss.getId());
  return ss;
}

function getOrCreateTab(ss, name) {
  var tabName = name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
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

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
