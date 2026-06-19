import { getClaude } from '@/lib/ai/claude'
import type { EmailMetrics, StrategyPerformance, WhatsAppMetrics, Anomaly, Win } from './daily'

export interface SummaryInput {
  email: EmailMetrics
  strategies: StrategyPerformance[]
  whatsapp: WhatsAppMetrics
  anomalies: Anomaly[]
  wins: Win[]
}

export async function generateDailySummary(metrics: SummaryInput): Promise<string> {
  const claude = getClaude()

  const msg = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system:
      'Sei un assistente che scrive un riepilogo giornaliero in italiano colloquiale per il founder di Lumino, ' +
      "un'agenzia che fa siti per ristoranti.",
    messages: [
      {
        role: 'user',
        content:
          `Dati di oggi:\n${JSON.stringify(metrics, null, 2)}\n\n` +
          'Scrivi un riassunto in 4-6 frasi che:\n' +
          '1. Dice come è andata oggi vs media settimanale\n' +
          '2. Identifica la causa principale se sotto media\n' +
          '3. Suggerisce 1-2 azioni concrete da fare\n' +
          '4. Tono diretto, no inglese, no tecnicismi inutili\n' +
          '5. Usa nomi italiani delle strategie quando possibile\n\n' +
          "Esempio output:\n'Oggi è andata sotto media: solo 42 email mandate (target 60). " +
          'Possibile causa: rate limit Gmail su outlumino3, che sta ancora in warm-up. ' +
          'La strategia case study funziona 2x meglio delle altre questa settimana, ' +
          "conviene aumentare il suo peso. Suggerisco di pausare la strategia urgency e farla rivedere al weekly-learn martedì.'",
      },
    ],
  })

  const block = msg.content[0]
  return block.type === 'text' ? block.text.trim() : 'Riepilogo non disponibile.'
}
