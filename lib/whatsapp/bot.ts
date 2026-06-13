import type { SupabaseClient } from '@supabase/supabase-js';
import { generateReply } from '../ai/whatsapp';
import { FORM_URL } from './config';
import { markRead, sendText } from './client';
import {
  appendMessage,
  getHistory,
  getOrCreateConversation,
  isDuplicate,
  updateConversation,
} from './conversation';
import type { Stage } from './types';

export async function handleInbound(
  db: SupabaseClient,
  phone: string,
  text: string,
  whapiMessageId: string,
  contactName?: string,
): Promise<void> {
  // Whapi.Cloud retries on non-2xx. We always return 200, but if a message
  // was somehow delivered twice we skip it here via the unique DB index.
  if (await isDuplicate(db, whapiMessageId)) return;

  const conversation = await getOrCreateConversation(db, phone, contactName);

  // Fetch history BEFORE logging this message so Claude sees only prior turns,
  // then receives the current inbound as the explicit "new message" argument.
  const history = await getHistory(db, conversation.id);

  const output = await generateReply(conversation, history, text);

  const attachLink = output.sendFormLink && !conversation.form_link_sent_at;
  const finalReply = attachLink ? `${output.reply}\n\n${FORM_URL}` : output.reply;

  // Send first. Only log after a successful send so that on retry (Whapi or
  // user) the message is treated as unprocessed and we attempt again.
  const sent = await sendText(phone, finalReply);

  await appendMessage(db, conversation.id, 'inbound', text, whapiMessageId);
  await appendMessage(db, conversation.id, 'outbound', finalReply, sent.id);

  const patch: { stage: Stage; restaurantName?: string | null; formLinkSentAt?: string } = {
    stage: output.newStage,
  };
  if (output.restaurantName !== null) patch.restaurantName = output.restaurantName;
  if (attachLink) patch.formLinkSentAt = new Date().toISOString();

  await updateConversation(db, conversation.id, patch);

  void markRead(phone, whapiMessageId);
}
