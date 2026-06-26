import type { SupabaseClient } from '@supabase/supabase-js';
import { HISTORY_WINDOW, pickBotPersona } from './config';
import type { ConversationRow, MessageRow, Stage, WhatsAppApproach } from './types';

export async function getOrCreateConversation(
  db: SupabaseClient,
  phone: string,
  contactName?: string,
  restaurantId?: string,
  approach?: WhatsAppApproach,
): Promise<ConversationRow> {
  const { data: existing } = await db
    .from('whatsapp_conversations')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (existing) return existing as ConversationRow;

  // Primo messaggio da un nuovo numero: assegna una persona del team a caso.
  // Resta fissa per tutta la conversazione e nei messaggi futuri.
  const { data, error } = await db
    .from('whatsapp_conversations')
    .insert({
      phone,
      contact_name: contactName ?? null,
      restaurant_id: restaurantId ?? null,
      approach: approach ?? null,
      bot_persona: pickBotPersona(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as ConversationRow;
}

export async function getHistory(
  db: SupabaseClient,
  conversationId: string,
): Promise<MessageRow[]> {
  const { data, error } = await db
    .from('whatsapp_messages')
    .select('id, conversation_id, direction, body, whapi_message_id, sent_at')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: false })
    .limit(HISTORY_WINDOW);

  if (error) throw error;
  return ((data ?? []) as MessageRow[]).reverse();
}

export async function isDuplicate(
  db: SupabaseClient,
  whapiMessageId: string,
): Promise<boolean> {
  const { data } = await db
    .from('whatsapp_messages')
    .select('id')
    .eq('whapi_message_id', whapiMessageId)
    .maybeSingle();
  return data !== null;
}

export async function appendMessage(
  db: SupabaseClient,
  conversationId: string,
  direction: 'inbound' | 'outbound',
  body: string,
  whapiMessageId?: string,
): Promise<void> {
  const { error } = await db.from('whatsapp_messages').insert({
    conversation_id: conversationId,
    direction,
    body,
    whapi_message_id: whapiMessageId ?? null,
  });
  if (error) throw error;
}

export async function updateConversation(
  db: SupabaseClient,
  id: string,
  updates: {
    stage?: Stage;
    restaurantName?: string | null;
    formLinkSentAt?: string;
  },
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.stage !== undefined) patch.stage = updates.stage;
  if (updates.restaurantName !== undefined) patch.restaurant_name = updates.restaurantName;
  if (updates.formLinkSentAt !== undefined) patch.form_link_sent_at = updates.formLinkSentAt;

  if (Object.keys(patch).length === 0) return;

  const { error } = await db
    .from('whatsapp_conversations')
    .update(patch)
    .eq('id', id);
  if (error) throw error;
}
