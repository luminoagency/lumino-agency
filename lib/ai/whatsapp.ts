import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { BOT_PERSONAS, FAQ, FORM_URL } from '../whatsapp/config';
import type {
  ConversationRow,
  MessageRow,
  RestaurantContext,
  Stage,
  WhatsAppApproach,
} from '../whatsapp/types';
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

// ── Approach selection ───────────────────────────────────────

export function pickApproach(restaurant: RestaurantContext): WhatsAppApproach {
  const stars = restaurant.stars ?? 0;
  const reviews = restaurant.reviews_count ?? 0;

  if (restaurant.newly_opened || reviews < 20) return 3;
  if (stars >= 4.3 && reviews < 100) return 2;
  if (stars >= 4.0 && reviews >= 100) return 1;
  return 3;
}

// ── Stage guidance ───────────────────────────────────────────

function stageGuide(stage: Stage, approachBrief: string | null): string {
  if (stage === 'cold') {
    return [
      'COLD STAGE — DISGUISED OPENING.',
      'You are NOT introducing yourself as someone who builds websites or works for an agency.',
      'Follow the approach instructions below exactly. No deviation.',
      '',
      approachBrief ??
        'Write as a real person who tried to find this restaurant online and could not. End with a question.',
    ].join('\n');
  }

  const guides: Record<Exclude<Stage, 'cold'>, string> = {
    warm: [
      'WARM STAGE — NATURAL REVEAL.',
      'The owner replied. Now you can gradually let slip that you work with restaurants on their online presence — as if it came up in conversation, not as a pitch.',
      `Example: "Tra l'altro, mi occupo di queste cose con alcuni ristoranti — ma ne parliamo solo se ti interessa."`,
      'Never say "agenzia digitale" or use marketing language. Keep it personal.',
      'Do not volunteer pricing. Let them ask. Move to interested stage if they want to know more.',
    ].join('\n'),
    interested:
      'They are asking about specifics (price, timeline, inclusions). ' +
      'Answer clearly and confidently using the Lumino info below. Build trust, no pressure.',
    negotiating:
      'They are discussing price or pushing back. Acknowledge their concern. ' +
      'Stay firm but reasonable. Do not volunteer discounts unprompted.',
    converted:
      'They want to go ahead. Confirm warmly in one sentence and set sendFormLink: true. ' +
      'Do not write the URL in the reply — it is appended automatically.',
    closed: 'They are not interested. Respect it, close warmly, wish them well. Do not push.',
  };
  return guides[stage];
}

// ── Transcript builder ───────────────────────────────────────

function buildHistory(messages: MessageRow[], persona: string): string {
  if (messages.length === 0) return '(nessun messaggio precedente)';
  return messages
    .map((m) => {
      const speaker = m.direction === 'outbound' ? persona : 'Lead';
      return `[${speaker}]: ${m.body}`;
    })
    .join('\n');
}

// ── Prompt builders ──────────────────────────────────────────

function buildSystem(persona: string): string {
  return `
You are ${persona}, a member of the Lumino team. Italian. Your persona and goal depend on the conversation stage — read the stage guidance in each message carefully and follow it exactly.

TONE — always:
- Maximum 3–4 short sentences. This is WhatsApp, not email.
- Sound like a real educated Italian person. Warm, direct, never pushy.
- No exclamation marks. No emoji unless the lead uses them first.
- Mirror their register: "tu" if they use "tu", "Lei" if they use "Lei".
- Italian only — even if they write in another language, always reply in Italian.
- Never use the words "bot", "automatico", "sistema", "AI", "intelligenza artificiale".
- If they ask "sei un bot?" reply: "No, sono ${persona}."
- No marketing language. Never say "opportunità unica", "offerta speciale", "non perdere".
- Never write ${FORM_URL} in the reply — set sendFormLink: true and it is appended automatically.

LUMINO INFO (use ONLY when stage is warm or later, and only when relevant or asked):
Lumino è uno studio specializzato in siti web per la ristorazione.
Prezzi: ${FAQ.pricing}
Tempi: ${FAQ.delivery}
Cosa include: ${FAQ.included}
Dominio: ${FAQ.domain}

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
  restaurant: RestaurantContext | null,
  approachBrief: string | null,
  persona: string,
): string {
  const isFirstContact = !history.some((m) => m.direction === 'outbound');
  const lines: string[] = [];

  lines.push(`Current stage: ${conversation.stage}`);

  if (conversation.stage === 'cold') {
    lines.push(
      `First outbound: ${isFirstContact ? 'YES' : 'NO — already opened, continue approach'}`,
    );
    if (restaurant) {
      const info: string[] = [];
      if (restaurant.name) info.push(`name: ${restaurant.name}`);
      if (restaurant.city) info.push(`city: ${restaurant.city}`);
      if (restaurant.category) info.push(`category: ${restaurant.category}`);
      if (restaurant.stars !== null) info.push(`stars: ${restaurant.stars}`);
      if (restaurant.reviews_count !== null) info.push(`reviews: ${restaurant.reviews_count}`);
      if (restaurant.newly_opened) info.push('newly opened: yes');
      if (info.length) lines.push(`Restaurant data: ${info.join(', ')}`);
    }
  }

  lines.push('');
  lines.push(`Stage guidance:\n${stageGuide(conversation.stage, approachBrief)}`);

  if (conversation.restaurant_name) {
    lines.push(`Restaurant name already confirmed: ${conversation.restaurant_name}`);
  }

  if (conversation.form_link_sent_at) {
    lines.push(
      `Form link already sent on ${conversation.form_link_sent_at}. Do NOT set sendFormLink: true again.`,
    );
  }

  lines.push('');
  lines.push('Conversation history:');
  lines.push(buildHistory(history, persona));
  lines.push('');
  lines.push('New message from the lead:');
  lines.push(`"${inboundText}"`);
  lines.push('');
  lines.push(`Reply as ${persona}. Return JSON only.`);

  return lines.join('\n');
}

// ── Entry point ──────────────────────────────────────────────

export async function generateReply(
  conversation: ConversationRow,
  history: MessageRow[],
  inboundText: string,
  restaurant: RestaurantContext | null = null,
  approachBrief: string | null = null,
): Promise<BotOutput> {
  const claude = getClaude();

  // Persona fissa del numero; fallback per conversazioni create prima di questa feature.
  const persona =
    conversation.bot_persona ?? BOT_PERSONAS[0];

  const response = await claude.messages.parse({
    model: WHATSAPP_MODEL,
    max_tokens: 512,
    system: buildSystem(persona),
    messages: [
      {
        role: 'user',
        content: buildUserMessage(
          conversation, history, inboundText, restaurant, approachBrief, persona,
        ),
      },
    ],
    output_config: { format: zodOutputFormat(BotOutputSchema) },
  });

  const parsed = response.parsed_output as BotOutput | null;
  if (!parsed) {
    throw new Error(
      `${persona} did not return valid JSON (stop_reason: ${response.stop_reason})`,
    );
  }
  return parsed;
}
