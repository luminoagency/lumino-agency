import { getClaude } from '../ai/claude';
import { outreachConfig } from './config';
import { renderSubject } from './strategies';
import { appendTracking, generateToken } from './tracking';
import type { ComposeInput, EmailDraft } from './types';

/**
 * Haiku for high-volume composition (200 emails/night).
 * Opus (CLAUDE_MODEL) is reserved for the weekly strategic learner.
 */
const COMPOSE_MODEL = 'claude-haiku-4-5-20251001';

const GUARDRAILS = `
You write cold outreach emails for a small Italian digital agency that builds websites for restaurants.

RULES — every rule applies to every email, no exceptions:
- Language: Italian only. No English words.
- Length: ${outreachConfig.targetLines.min}–${outreachConfig.targetLines.max} lines of body text. Not one line more.
- Tone: plain, personal, human. One person writing to another. No marketing language, no exclamation marks, no emoji.
- Every factual claim must be true for this specific restaurant based on the data provided. Never invent facts, testimonials, or statistics.
- Never impersonate a customer or fabricate a referral.
- Do NOT include a subject line, a salutation (e.g. "Gentile …"), or a closing sign-off.
- Return only the body text — nothing else.
`.trim();

export async function compose(input: ComposeInput): Promise<EmailDraft> {
  const { lead, strategy, step, priorSubject } = input;

  const subject =
    step === 'initial'
      ? renderSubject(strategy, { name: lead.name, city: lead.city })
      : (priorSubject ?? renderSubject(strategy, { name: lead.name, city: lead.city }));

  const leadContext = [
    `Nome: ${lead.name}`,
    `Città: ${lead.city ?? 'Italia'}`,
    lead.stars != null ? `Stelle Google: ${lead.stars}` : null,
    lead.reviews_count != null ? `Recensioni: ${lead.reviews_count}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const stepInstruction =
    step === 'initial'
      ? strategy.prompt_brief
      : step === 'followup_3'
        ? `Follow-up a 3 giorni. Il ristorante non ha risposto. Fai riferimento brevemente ` +
          `al fatto di aver scritto qualche giorno fa e chiedi se hanno avuto modo di vedere. ` +
          `Stesso angolo: ${strategy.angle_description}`
        : `Secondo e ultimo follow-up (7 giorni). Hai già scritto due volte. Sii molto breve ` +
          `e senza pressione — offri di non scrivere più se non sono interessati, ma lascia la porta aperta.`;

  const claude = getClaude();
  const message = await claude.messages.create({
    model: COMPOSE_MODEL,
    max_tokens: 400,
    system: GUARDRAILS,
    messages: [
      {
        role: 'user',
        content: `Dati lead:\n${leadContext}\n\nIstruzione:\n${stepInstruction}`,
      },
    ],
  });

  const body =
    message.content[0].type === 'text' ? message.content[0].text.trim() : '';

  const token = generateToken();

  return {
    subject,
    body: appendTracking(body, token),
    strategyNumber: strategy.strategy_number,
    token,
  };
}
