export type Stage =
  | 'cold'
  | 'warm'
  | 'interested'
  | 'negotiating'
  | 'converted'
  | 'closed';

// ── Whapi.Cloud inbound webhook ──────────────────────────────

export interface WhapiTextContent {
  body: string;
}

export interface WhapiInboundMessage {
  id: string;
  from: string;        // "393331234567@s.whatsapp.net"
  from_me: boolean;
  type: string;        // "text" | "image" | "audio" | ...
  text?: WhapiTextContent;
  timestamp: number;
  chat_id: string;
  chat_name?: string;  // contact display name from WhatsApp profile
}

export interface WhapiWebhookPayload {
  messages?: WhapiInboundMessage[];
}

// ── Whapi.Cloud send response ────────────────────────────────

export interface WhapiSendResponse {
  id: string;
  sent: boolean;
}

// ── Supabase row shapes ──────────────────────────────────────

export interface ConversationRow {
  id: string;
  phone: string;
  contact_name: string | null;
  restaurant_name: string | null;
  stage: Stage;
  form_link_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  whapi_message_id: string | null;
  sent_at: string;
}

// ── Claude bot output ────────────────────────────────────────

export interface BotResponse {
  reply: string;
  newStage: Stage;
  sendFormLink: boolean;
  restaurantName: string | null;
}
