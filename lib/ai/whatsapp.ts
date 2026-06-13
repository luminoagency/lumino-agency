import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { BOT_NAME, FAQ, FORM_URL } from '../whatsapp/config';
import type { ConversationRow, MessageRow, Stage } from '../whatsapp/types';
import { getClaude } from './claude';

const WHATSAPP_MODEL = 'claude-haiku-4-5-20251001';

// ── Structured output schema ─────────────────────────────────

const BotOutputSchema = z.object({
  reply: z.string(),
  newStage: z.enum(['cold', 'warm', 'interested', 'negotiating', 'converted', 'closed']),
  sendFormLink: z.boolean(),
  restaurantName: z.string().nullable(),
});

export type BotOutput = z.infer<typeof BotOutputSchema>;

// ── Stage guidance ───────────────────────────────────────────

function stageGuide(stage: Stage): string {
  const guides: Record<Stage, string> = {
    cold:
      'First interaction or still warming up. Be genuinely curious about their restaurant — ' +
      'ask one natural question. Do NOT mention pricing or pitch anything yet.',
    warm:
      'They are engaging. Keep the conversation going naturally. ' +
      'Understand their situation. You can mention what you do if it comes up naturally.',
    interested:
      'They are asking about specifics (price, timeline, inclusions). ' +
      'Answer clearly and confidently using the FAQ. Build trust, no pressure.',
    negotiating:
      'They are discussing price or pushing back on something. ' +
      'Acknowledge their concern. Stay firm but reasonable. Do not volunteer discounts unprompted.',
    converted:
      'They want to go ahead. Confirm warmly in one sentence, then set sendFormLink: true. ' +
      'Do not write the URL in the reply text — it is appended automatically.',
    closed:
      'They are not interested. Respect it, close warmly, wish them well. Do not push.',
  };
  return guides[stage];
}

// ── Transcript builder ───────────────────────────────────────

function buildHistory(messages: MessageRow[]): string {
  if (messages.length === 0) return '(nessun messaggio precedente)';
  return messages
    .map((m) => {
      const speaker = m.direction === 'outbound' ? BOT_NAME : 'Lead';
      return `[${speaker}]: ${m.body}`;
    })
    .join('\n');
}

// ── Prompt builders ──────────────────────────────────────────

function buildSystem(): string {
  return `
You are ${BOT_NAME}, a real person who works at Lumino — a small Italian digital agency that builds websites for restaurants and food businesses that have no online presence.

You are writing on WhatsApp to an Italian restaurant owner. Have a genuine human conversation: be curious about their business, answer their questions honestly, and when the moment is right guide them to fill a short form at ${FORM_URL}.

TONE — follow these without exception:
- Maximum 2–3 short sentences. This is WhatsApp, not email.
- Sound like a real educated Italian person. Warm, direct, never pushy.
- No exclamation marks. No emoji unless the lead uses them first.
- Mirror their register exactly: "tu" if they use "tu", "Lei" if they use "Lei".
- Italian only — even if they write in another language, always reply in Italian.
- Never use the words "bot", "automatico", "sistema", "AI", "intelligenza artificiale".
- If they ask directly "sei un bot?" reply: "No, sono ${BOT_NAME} del team di Lumino."
- No marketing language. Never say "opportunità unica", "offerta speciale", "non perdere".
- Never write ${FORM_URL} in the reply text — set sendFormLink: true and it is appended automatically.

WHAT YOU KNOW — use this only when asked, never volunteer it all at once:
Prezzi: ${FAQ.pricing}
Tempi: ${FAQ.delivery}
Cosa include: ${FAQ.included}

OUTPUT: return a JSON object with these four fields:
- reply: the Italian message to send (plain text, no URL)
- newStage: the updated stage (cold | warm | interested | negotiating | converted | closed)
- sendFormLink: true only when they said yes, asked for the link, or are clearly ready to proceed
- restaurantName: the restaurant name if you can extract it from the conversation, otherwise null
`.trim();
}

function buildUserMessage(
  conversation: ConversationRow,
  history: MessageRow[],
  inboundText: string,
): string {
  const lines: string[] = [];

  lines.push(`Current stage: ${conversation.stage}`);
  lines.push(`Stage guidance: ${stageGuide(conversation.stage)}`);

  if (conversation.restaurant_name) {
    lines.push(`Restaurant name already known: ${conversation.restaurant_name}`);
  }

  if (conversation.form_link_sent_at) {
    lines.push(
      `The form link was already sent on ${conversation.form_link_sent_at}. Do NOT set sendFormLink: true again.`,
    );
  }

  lines.push('');
  lines.push('Conversation history:');
  lines.push(buildHistory(history));
  lines.push('');
  lines.push('New message from the lead:');
  lines.push(`"${inboundText}"`);
  lines.push('');
  lines.push(`Reply as ${BOT_NAME}. Return JSON only.`);

  return lines.join('\n');
}

// ── Entry point ──────────────────────────────────────────────

export async function generateReply(
  conversation: ConversationRow,
  history: MessageRow[],
  inboundText: string,
): Promise<BotOutput> {
  const claude = getClaude();

  const response = await claude.messages.parse({
    model: WHATSAPP_MODEL,
    max_tokens: 512,
    system: buildSystem(),
    messages: [{ role: 'user', content: buildUserMessage(conversation, history, inboundText) }],
    output_config: { format: zodOutputFormat(BotOutputSchema) },
  });

  const parsed = response.parsed_output as BotOutput | null;
  if (!parsed) {
    throw new Error(
      `${BOT_NAME} did not return valid JSON (stop_reason: ${response.stop_reason})`,
    );
  }
  return parsed;
}
