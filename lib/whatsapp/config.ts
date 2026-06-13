export const HISTORY_WINDOW = 20;
export const FORM_URL = 'bylumino.com';
export const BOT_NAME = 'Ezio';

export const FAQ = {
  pricing:
    'I prezzi partono da €99 per un sito base. Il pacchetto più richiesto è tra €219 e €379. ' +
    'Per siti con funzioni avanzate siamo tra €449 e €749. Dipende da cosa ti serve esattamente.',
  delivery: 'Di solito siamo online in 48 ore dalla conferma.',
  included: 'Sito professionale, dominio incluso per il primo anno, mobile-friendly e pronto da subito.',
};

export function whapiToken(): string {
  const v = process.env.WHAPI_TOKEN;
  if (!v) throw new Error('WHAPI_TOKEN not set');
  return v;
}

export function whapiBaseUrl(): string {
  const v = process.env.WHAPI_BASE_URL;
  if (!v) throw new Error('WHAPI_BASE_URL not set');
  return v.replace(/\/$/, '');
}

export function whapiChannelId(): string {
  const v = process.env.WHAPI_CHANNEL_ID;
  if (!v) throw new Error('WHAPI_CHANNEL_ID not set');
  return v;
}

export function webhookSecret(): string {
  const v = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!v) throw new Error('WHATSAPP_WEBHOOK_SECRET not set');
  return v;
}
