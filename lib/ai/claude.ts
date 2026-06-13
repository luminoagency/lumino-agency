import Anthropic from '@anthropic-ai/sdk';

/**
 * Configured Anthropic client. Reads CLAUDE_API_KEY (our env var name) rather
 * than the SDK's default ANTHROPIC_API_KEY, so it's passed explicitly. Cached
 * across invocations within a warm serverless instance. Server-only.
 */
let cached: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY is not set');
  cached = new Anthropic({ apiKey });
  return cached;
}

/** Default model for the weekly learner. */
export const CLAUDE_MODEL = 'claude-opus-4-8';
