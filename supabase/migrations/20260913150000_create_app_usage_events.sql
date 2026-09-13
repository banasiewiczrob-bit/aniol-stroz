create table if not exists public.app_usage_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  created_at timestamptz not null default now()
);

alter table public.app_usage_events enable row level security;

comment on table public.app_usage_events is
  'Anonimowe, zagregowane liczniki otwarć ekranów (event_name = znormalizowana trasa). Brak identyfikatora urządzenia/użytkownika — wyłącznie do wglądu przez dashboard Supabase.';

revoke all on public.app_usage_events from anon, authenticated;
grant insert on public.app_usage_events to anon, authenticated;

alter table public.app_usage_events force row level security;

drop policy if exists "Publiczny zapis zdarzeń użycia aplikacji" on public.app_usage_events;

create policy "Publiczny zapis zdarzeń użycia aplikacji"
on public.app_usage_events
for insert
to anon, authenticated
with check (
  event_name is not null
  and length(event_name) between 1 and 200
);
