export const HISTORY_WINDOW = 20;
export const FORM_URL = 'bylumino.com';

/**
 * Nomi del team usati come persona del bot. Al primo messaggio di un nuovo
 * numero se ne sceglie uno a caso e si salva in whatsapp_conversations.bot_persona,
 * così resta lo stesso per tutta la conversazione e nei messaggi futuri.
 */
export const BOT_PERSONAS = ['Matteo', 'Francesca', 'Davide', 'Sara'] as const;
export type BotPersona = (typeof BOT_PERSONAS)[number];

/** Sceglie a caso una persona del team per una nuova conversazione. */
export function pickBotPersona(): BotPersona {
  return BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)];
}

export const FAQ = {
  pricing:
    'I prezzi partono da €190 per il piano base, €390 per quello principale, €590 per quello completo. ' +
    'Il prezzo esatto dipende da cosa ti serve.',
  delivery: 'Di solito siamo online in pochi giorni dalla conferma.',
  included: 'Sito professionale, dominio incluso per il primo anno, mobile-friendly e pronto da subito.',
  domain:
    'Il dominio è incluso il primo anno. Dal secondo anno costa 12 euro all\'anno, ti arriva ' +
    'un\'email quando è in scadenza con il link per rinnovarlo.',
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
