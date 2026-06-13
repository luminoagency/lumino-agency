create table whatsapp_conversations (
  id                uuid primary key default gen_random_uuid(),
  phone             text not null unique,
  contact_name      text,
  restaurant_name   text,
  stage             text not null default 'cold'
                      check (stage in ('cold','warm','interested','negotiating','converted','closed')),
  form_link_sent_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table whatsapp_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references whatsapp_conversations(id) on delete cascade,
  direction        text not null check (direction in ('inbound','outbound')),
  body             text not null,
  whapi_message_id text unique,
  sent_at          timestamptz not null default now()
);

create index on whatsapp_messages(conversation_id, sent_at);

create or replace function touch_conversation_updated_at()
returns trigger language plpgsql as $$
begin
  update whatsapp_conversations
     set updated_at = now()
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger whatsapp_messages_touch_conversation
  after insert on whatsapp_messages
  for each row execute procedure touch_conversation_updated_at();
