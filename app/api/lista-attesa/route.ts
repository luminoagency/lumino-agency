import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Iscrizioni alla lista d'attesa della home italiana.
 * 1. salva su Supabase (tabella lista_attesa_artigiani)
 * 2. manda una notifica a studio.bylumino@gmail.com via SMTP Zoho
 * Basta che uno dei due riesca perché l'iscrizione non vada persa.
 */
export const runtime = 'nodejs'

const TO = process.env.LISTA_ATTESA_TO || 'studio.bylumino@gmail.com'
const clean = (v: unknown, max = 120) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max)

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }

  const lead = {
    nome: clean(body.nome),
    mestiere: clean(body.mestiere),
    citta: clean(body.citta),
    whatsapp: clean(body.whatsapp, 40),
  }
  if (!lead.nome || !lead.mestiere || !lead.citta || !/\d{6,}/.test(lead.whatsapp.replace(/\D/g, ''))) {
    return NextResponse.json({ ok: false, error: 'campi' }, { status: 422 })
  }

  let saved = false
  let mailed = false

  try {
    const sb = createAdminClient()
    const { error } = await sb.from('lista_attesa_artigiani').insert({ ...lead, pagina: 'home-it', user_agent: clean(req.headers.get('user-agent'), 300) })
    if (error) console.error('[lista-attesa] supabase:', error.message)
    else saved = true
  } catch (e: any) { console.error('[lista-attesa] supabase:', e?.message) }

  const user = process.env.ZOHO_SMTP_PRENOTAZIONI_USER
  const pass = process.env.ZOHO_SMTP_PRENOTAZIONI_PASSWORD
  if (user && pass && pass !== 'PIANO_B_PENDING') {
    try {
      const t = nodemailer.createTransport({ host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.eu', port: Number(process.env.ZOHO_SMTP_PORT || 465), secure: true, auth: { user, pass } })
      await t.sendMail({
        from: `"Lumino · Lista d'attesa" <${user}>`,
        to: TO,
        subject: `Nuovo iscritto: ${lead.nome} · ${lead.mestiere} · ${lead.citta}`,
        text: `Nuova iscrizione alla lista d'attesa (bylumino.com)\n\nNome: ${lead.nome}\nMestiere: ${lead.mestiere}\nCittà: ${lead.citta}\nWhatsApp: ${lead.whatsapp}\n\nScrivigli: https://wa.me/${lead.whatsapp.replace(/\D/g, '')}\n`,
      })
      mailed = true
    } catch (e: any) { console.error('[lista-attesa] smtp:', e?.message) }
  }

  if (!saved && !mailed) return NextResponse.json({ ok: false }, { status: 500 })
  return NextResponse.json({ ok: true, saved, mailed })
}
