/**
 * Client PayPal server-side (Orders v2 REST).
 *
 * Usa SEMPRE le credenziali da process.env: nessun valore reale nel codice.
 *   - PAYPAL_MODE      → 'sandbox' | 'live' (default 'sandbox')
 *   - PAYPAL_CLIENT_ID → client id dell'app PayPal
 *   - PAYPAL_SECRET    → secret dell'app PayPal (NON esporre mai al browser)
 *
 * Da importare ESCLUSIVAMENTE in codice server (route handler / server action).
 */

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';
const LIVE_BASE = 'https://api-m.paypal.com';

/** Base URL dell'API PayPal, scelta in base a PAYPAL_MODE. */
export function paypalApiBase(): string {
  return process.env.PAYPAL_MODE === 'live' ? LIVE_BASE : SANDBOX_BASE;
}

function paypalCredentials(): { clientId: string; secret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    throw new Error(
      'PayPal non configurato: mancano PAYPAL_CLIENT_ID e/o PAYPAL_SECRET',
    );
  }
  return { clientId, secret };
}

/**
 * Ottiene un access token OAuth2 (client credentials).
 * Non lo mettiamo in cache di proposito: i token durano ~9h ma le invocazioni
 * serverless sono brevi; la semplicità qui vale più del micro-risparmio.
 */
async function getAccessToken(): Promise<string> {
  const { clientId, secret } = paypalCredentials();
  const basic = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`PayPal OAuth fallito (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error('PayPal OAuth: access_token mancante nella risposta');
  }
  return json.access_token;
}

export interface PayPalOrderResult {
  id: string;
  status: string;
}

/**
 * Crea un ordine PayPal (intent CAPTURE) in EUR.
 *
 * @param amount  Importo come stringa con 2 decimali (es. "123.45"). L'importo
 *                DEVE essere calcolato lato server dai dati in Supabase.
 * @param opts    reference (es. "order-id:deposit") e descrizione mostrata al cliente.
 */
export async function createPayPalOrder(
  amount: string,
  opts: { referenceId: string; description: string; customId?: string },
): Promise<PayPalOrderResult> {
  const token = await getAccessToken();

  const res = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: opts.referenceId,
          description: opts.description,
          custom_id: opts.customId,
          amount: {
            currency_code: 'EUR',
            value: amount,
          },
        },
      ],
    }),
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    status?: string;
    message?: string;
  };

  if (!res.ok || !json.id) {
    throw new Error(
      `PayPal create order fallito (${res.status}): ${json.message || 'errore sconosciuto'}`,
    );
  }
  return { id: json.id, status: json.status || 'CREATED' };
}

/**
 * Verifica la firma di una notifica webhook PayPal chiamando l'API ufficiale
 * verify-webhook-signature. Richiede PAYPAL_WEBHOOK_ID (dall'app PayPal).
 *
 * Ritorna true solo se PayPal conferma la firma (verification_status SUCCESS).
 * Un webhook non verificato NON deve mai aggiornare i pagamenti: chiunque
 * potrebbe altrimenti fingere un "pagamento completato".
 */
export async function verifyWebhookSignature(params: {
  authAlgo: string | null;
  certUrl: string | null;
  transmissionId: string | null;
  transmissionSig: string | null;
  transmissionTime: string | null;
  /** L'evento webhook come oggetto JSON (già parsato). */
  webhookEvent: unknown;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error('PAYPAL_WEBHOOK_ID non configurato');
  }
  if (
    !params.authAlgo ||
    !params.certUrl ||
    !params.transmissionId ||
    !params.transmissionSig ||
    !params.transmissionTime
  ) {
    // Header di firma mancanti → non è una richiesta PayPal valida.
    return false;
  }

  const token = await getAccessToken();
  const res = await fetch(
    `${paypalApiBase()}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: params.authAlgo,
        cert_url: params.certUrl,
        transmission_id: params.transmissionId,
        transmission_sig: params.transmissionSig,
        transmission_time: params.transmissionTime,
        webhook_id: webhookId,
        webhook_event: params.webhookEvent,
      }),
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error(`[verifyWebhookSignature] HTTP ${res.status}: ${detail}`);
    return false;
  }

  const json = (await res.json()) as { verification_status?: string };
  return json.verification_status === 'SUCCESS';
}

export interface PayPalCaptureResult {
  id: string;
  /** COMPLETED quando il pagamento è andato a buon fine. */
  status: string;
  raw: unknown;
}

/**
 * Cattura un ordine PayPal già approvato dal cliente.
 * @param paypalOrderId  ID ordine PayPal (Orders v2).
 */
export async function capturePayPalOrder(
  paypalOrderId: string,
): Promise<PayPalCaptureResult> {
  const token = await getAccessToken();

  const res = await fetch(
    `${paypalApiBase()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    },
  );

  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    status?: string;
    message?: string;
    details?: unknown;
  };

  // 422 con issue ORDER_ALREADY_CAPTURED va gestito dal chiamante come
  // "già catturato" (idempotenza), non come errore fatale.
  if (!res.ok) {
    const err = new Error(
      `PayPal capture fallito (${res.status}): ${json.message || 'errore sconosciuto'}`,
    ) as Error & { paypalStatus?: number; paypalBody?: unknown };
    err.paypalStatus = res.status;
    err.paypalBody = json;
    throw err;
  }

  return {
    id: json.id || paypalOrderId,
    status: json.status || 'UNKNOWN',
    raw: json,
  };
}
