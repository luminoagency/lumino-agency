import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { webhookSecret } from '@/lib/whatsapp/config';
import { handleInbound } from '@/lib/whatsapp/bot';
import type { WhapiWebhookPayload } from '@/lib/whatsapp/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Whapi.Cloud appends ?token=<secret> to the webhook URL you configure.
  const token = new URL(req.url).searchParams.get('token');
  if (!token || token !== webhookSecret()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: WhapiWebhookPayload;
  try {
    payload = (await req.json()) as WhapiWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const db = createAdminClient();

  for (const msg of payload.messages ?? []) {
    if (msg.from_me) continue;           // ignore our own echoed sends
    if (msg.type !== 'text') continue;   // ignore images, voice notes, etc.
    if (!msg.text?.body?.trim()) continue;
    if (msg.from.includes('@g.us')) continue; // ignore group chats

    const phone = msg.from.replace(/@.*$/, '');

    try {
      await handleInbound(db, phone, msg.text.body.trim(), msg.id, msg.chat_name);
    } catch (err) {
      // Log and continue. Always return 200 so Whapi does not retry — the
      // inbound was not logged on failure, so the next user message will carry
      // the full context and the conversation picks up where it left off.
      console.error(
        `WhatsApp handleInbound error [${phone}]:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
