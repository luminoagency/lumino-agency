import { whapiBaseUrl, whapiToken } from './config';
import type { WhapiSendResponse } from './types';

function toJid(phone: string): string {
  return phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${whapiBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${whapiToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whapi ${path} ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function sendText(
  phone: string,
  body: string,
): Promise<WhapiSendResponse> {
  return post<WhapiSendResponse>('/messages/text', {
    to: toJid(phone),
    body,
  });
}

export async function markRead(
  phone: string,
  messageId: string,
): Promise<void> {
  try {
    await post('/messages/read', {
      chat_id: toJid(phone),
      message_id: messageId,
    });
  } catch {
    // Best-effort — bot works fine even if read receipt fails.
  }
}
