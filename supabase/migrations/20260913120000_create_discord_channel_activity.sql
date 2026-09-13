create table if not exists public.discord_channel_activity (
  channel_id text primary key,
  last_message_id text not null,
  last_message_at timestamptz not null,
  checked_at timestamptz not null default now()
);

alter table public.discord_channel_activity enable row level security;

comment on table public.discord_channel_activity is
  'Znacznik ostatniej wiadomości na monitorowanych kanałach Discord, aktualizowany cyklicznie przez edge function "discord-activity-check". Zapis wykonuje wyłącznie service_role (omija RLS).';

revoke all on public.discord_channel_activity from anon, authenticated;
grant select on public.discord_channel_activity to anon, authenticated;

alter table public.discord_channel_activity force row level security;

drop policy if exists "Publiczny odczyt aktywności kanału Discord" on public.discord_channel_activity;

create policy "Publiczny odczyt aktywności kanału Discord"
on public.discord_channel_activity
for select
to anon, authenticated
using (true);
