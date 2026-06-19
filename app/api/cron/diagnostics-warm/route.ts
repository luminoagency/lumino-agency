import { NextResponse } from 'next/server'
import { getEmailMetricsToday, getStrategyPerformanceToday, getWhatsAppMetricsToday, getAnomalies, getWinsToday } from '@/lib/diagnostics/daily'
import { generateDailySummary } from '@/lib/diagnostics/aiSummary'
import { cacheGet, cacheSet, AI_SUMMARY_TTL } from '@/lib/diagnostics/cache'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [email, strategies, whatsapp, wins] = await Promise.all([
      getEmailMetricsToday(),
      getStrategyPerformanceToday(),
      getWhatsAppMetricsToday(),
      getWinsToday(),
    ])

    const anomalies = await getAnomalies(whatsapp.avg_response_time)

    const today = new Date().toISOString().slice(0, 10)
    const cacheKey = `ai_summary_${today}`

    let aiSummary = cacheGet<string>(cacheKey)
    if (!aiSummary) {
      aiSummary = await generateDailySummary({ email, strategies, whatsapp, anomalies, wins })
      cacheSet(cacheKey, aiSummary, AI_SUMMARY_TTL)
    }

    return NextResponse.json({ ok: true, warmed: true, today })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Errore' }, { status: 500 })
  }
}
