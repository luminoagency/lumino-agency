import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Rate limit basico in-memory: 1 messaggio/minuto per IP (anti-spam).
const lastByIp = new Map<string, number>();

export async function POST(request: Request, { params }: { params: { projectId: string } }) {
  const projectId = params.projectId;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  if (now - (lastByIp.get(ip) || 0) < 60_000) {
    return NextResponse.json({ ok: false, error: 'Troppe richieste, riprova tra un minuto.' }, { status: 429 });
  }

  let body: any = {};
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Body non valido.' }, { status: 400 }); }

  // Validazione campi obbligatori.
  for (const key of ['from_email', 'message_body'] as const) {
    if (!body[key] || typeof body[key] !== 'string' || !String(body[key]).trim()) {
      return NextResponse.json({ ok: false, error: `Campo mancante: ${key}` }, { status: 400 });
    }
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(body.from_email))) {
    return NextResponse.json({ ok: false, error: 'Email non valida.' }, { status: 400 });
  }

  // Sanitizzazione: strip tag HTML + limiti di lunghezza.
  const clean = (v: unknown, max: number) => String(v ?? '').replace(/<[^>]*>/g, '').trim().slice(0, max);
  const type = ['contact', 'booking', 'quote', 'other'].includes(body.message_type) ? body.message_type : 'contact';

  const admin = createAdminClient();
  try {
    const { data: proj } = await admin.from('lab_projects').select('id').eq('id', projectId).maybeSingle();
    if (!proj) return NextResponse.json({ ok: false, error: 'Progetto non trovato.' }, { status: 404 });

    const { data, error } = await admin.from('lab_project_messages').insert({
      project_id: projectId, message_type: type, status: 'new',
      from_name: clean(body.from_name, 200) || null,
      from_email: clean(body.from_email, 255),
      from_phone: clean(body.from_phone, 50) || null,
      subject: clean(body.subject, 300) || 'Contatto dal sito',
      message_body: clean(body.message_body, 5000),
      extra_data: body.extra_data && typeof body.extra_data === 'object' ? body.extra_data : null,
      page_slug: clean(body.page_slug, 300) || '/',
    }).select('id').single();
    if (error) { console.error('Message insert failed:', error.message); return NextResponse.json({ ok: false, error: 'Salvataggio non riuscito.' }, { status: 500 }); }

    lastByIp.set(ip, now);
    // TODO: notifica email al cliente owner se notify_new_messages.
    return NextResponse.json({ ok: true, messageId: data?.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Errore.' }, { status: 500 });
  }
}
