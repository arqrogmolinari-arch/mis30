-- Rocío 30 party hub schema. Laxa RLS: anon full access (one-night, friends-only).
-- NOTE: already applied to the live Supabase project. This file is the committed reference.

create extension if not exists "pgcrypto";

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  phase text not null default 'lobby',          -- lobby | playing | results
  active_game text,                              -- quiz | two_truths | most_likely | null
  game_state jsonb not null default '{}'::jsonb
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  slug text not null,
  name text not null,
  photo text not null,
  claimed_at timestamptz,
  score int not null default 0,
  unique (room_id, slug)
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  game text not null,
  round_key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  unique (player_id, round_key)
);

create table if not exists two_truths_entries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  statements jsonb not null,                     -- ["s1","s2","s3"]
  lie_index int not null,                        -- 0..2
  unique (player_id)
);

insert into rooms (code) values ('ROCIO30')
  on conflict (code) do nothing;

alter table rooms enable row level security;
alter table players enable row level security;
alter table answers enable row level security;
alter table two_truths_entries enable row level security;

create policy anon_all_rooms on rooms for all using (true) with check (true);
create policy anon_all_players on players for all using (true) with check (true);
create policy anon_all_answers on answers for all using (true) with check (true);
create policy anon_all_tt on two_truths_entries for all using (true) with check (true);

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table answers;
alter publication supabase_realtime add table two_truths_entries;
