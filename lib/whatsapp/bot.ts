import type { SupabaseClient } from '@supabase/supabase-js';
import { generateReply, pickApproach } from '../ai/whatsapp';
import { FORM_URL } from './config';
import { markRead, sendText } from './client';
import {
  appendMessage,
  getHistory,
  getOrCreateConversation,
  isDuplicate,
  updateConversation,
} from './conversation';
import type { RestaurantContext, Stage, WhatsAppApproach } from './types';

async function lookupRestaurant(
  db: SupabaseClient,
  phone: string,
): Promise<RestaurantContext | null> {
  const digits = phone.replace(/\D/g, '');
  const candidates = [
    digits,
    digits.replace(/^39/, '0'),       // 39021... → 021...
    '39' + digits.replace(/^0/, ''),  // 021... → 3921...
  ];
  const { data } = await db
    .from('restaurants')
    .select('id, name, category, city, stars, reviews_count, newly_opened')
    .in('phone', candidates)
    .limit(1);
  return (data?.[0] as RestaurantContext) ?? null;
}

async function getApproachBrief(
  db: SupabaseClient,
  approach: WhatsAppApproach,
): Promise<string | null> {
  const { data } = await db
    .from('whatsapp_approaches')
    .select('prompt_brief')
    .eq('approach_number', approach)
    .eq('active', true)
    .maybeSingle();
  return data?.prompt_brief ?? null;
}

export async function handleInbound(
  db: SupabaseClient,
  phone: string,
  text: string,
  whapiMessageId: string,
  contactName?: string,
): Promise<void> {
  if (await isDuplicate(db, whapiMessageId)) return;

  const restaurant = await lookupRestaurant(db, phone);
  const inferredApproach: WhatsAppApproach = restaurant ? pickApproach(restaurant) : 3;

  const conversation = await getOrCreateConversation(
    db, phone, contactName, restaurant?.id, inferredApproach,
  );

  // Use approach stored at conversation creation; fall back to inferred for rows
  // created before this feature was deployed.
  const approach = (conversation.approach ?? inferredApproach) as WhatsAppApproach;
  const history = await getHistory(db, conversation.id);
  const approachBrief =
    conversation.stage === 'cold' ? await getApproachBrief(db, approach) : null;

  const output = await generateReply(conversation, history, text, restaurant, approachBrief);

  const attachLink = output.sendFormLink && !conversation.form_link_sent_at;
  const finalReply = attachLink ? `${output.reply}\n\n${FORM_URL}` : output.reply;

  // Send first. Only log after a successful send so that on retry the message
  // is treated as unprocessed and we attempt again.
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
