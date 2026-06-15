import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { site_id, author_name, author_email, rating, text } = body
    if (!site_id || !author_name || !rating || !text) {
      return NextResponse.json({ error: 'Compila tutti i campi.' }, { status: 400 })
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Voto non valido.' }, { status: 400 })
    }

    const supabase = createClient()
    const { error } = await supabase.from('site_user_reviews').insert({
      site_id,
      author_name: String(author_name).slice(0, 100),
      author_email: author_email ? String(author_email).slice(0, 120) : null,
      rating: Math.round(rating),
      text: String(text).slice(0, 1500),
      approved: false,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Errore' }, { status: 500 })
  }
}
