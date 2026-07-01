import { randomUUID } from 'crypto';
import { outreachConfig } from './config';

/** Cryptographically random token — 32 hex chars, URL-safe. */
export function generateToken(): string {
  return randomUUID().replace(/-/g, '');
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://bylumino.com';
}

/** URL that marks the email as opened when the pixel is loaded. */
export function pixelUrl(token: string): string {
  return `${appUrl()}${outreachConfig.trackingPathPrefix}/${token}`;
}

/** URL that marks the lead as unsubscribed when clicked. */
export function unsubUrl(token: string): string {
  return `${appUrl()}${outreachConfig.unsubscribePathPrefix}/${token}`;
}

/**
 * Appends a plain-text unsubscribe footer to the composed body.
 * The Apps Script sender passes this as the plain-text part of a
 * multipart email; the open pixel (pixelUrl) goes in the HTML part
 * and is added by the Apps Script itself, not here.
 */
export function appendTracking(body: string, token: string): string {
  return [
    body.trimEnd(),
    '',
    '---',
    `Per non ricevere altri messaggi: ${unsubUrl(token)}`,
  ].join('\n');
}
