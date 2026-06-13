alter table whatsapp_conversations
  add column restaurant_id uuid references restaurants(id),
  add column approach      smallint check (approach in (1, 2, 3));

create table whatsapp_approaches (
  id                  uuid primary key default gen_random_uuid(),
  approach_number     smallint not null check (approach_number in (1, 2, 3)),
  version             integer not null default 1,
  active              boolean not null default true,
  angle_name          text not null,
  trigger_logic       text not null,
  prompt_brief        text not null,
  reply_rate          numeric,
  conversations_count integer not null default 0,
  reasoning           text,
  created_at          timestamptz not null default now()
);

create unique index uniq_whatsapp_approach_active
  on whatsapp_approaches (approach_number)
  where active = true;

insert into whatsapp_approaches (approach_number, angle_name, trigger_logic, prompt_brief) values
(1,
 'Disappointed customer',
 'stars >= 4.0 AND reviews_count >= 100',
 'Write as a real person who tried to find this well-known, busy restaurant online before a special dinner and could not. Mention a specific large booking that fell through: 6 people, an anniversary dinner, or a group booking. Ask to speak with the owner or say you wanted to leave feedback. Never mention websites, agencies, or digital services. 3-4 lines, WhatsApp style, end with a direct question.'),
(2,
 'Genuine admirer',
 'stars >= 4.3 AND reviews_count < 100',
 'You came across the reviews and they genuinely impressed you — be specific about the quality and warmth. Say you tried to find the menu to recommend the place to friends but found nothing online. Ask who you can speak to. Warm and personal, 3-4 lines, end with a question.'),
(3,
 'Curious newcomer',
 'newly_opened = true OR reviews_count < 20',
 'You noticed the place or came across it recently. Ask casually how it is going — warm and supportive, like someone genuinely interested in a new spot in the area. No mention of websites, online presence, or agencies at all. 2-3 lines, casual, end with a question.');
