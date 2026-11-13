-- Lista d'attesa della home italiana (Lumino per artigiani).
create table if not exists public.lista_attesa_artigiani (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text not null,
  mestiere text not null,
  citta text not null,
  whatsapp text not null,
  pagina text,
  user_agent text
);
alter table public.lista_attesa_artigiani enable row level security;
-- nessuna policy: scrive solo il server con la service role.
