do $$
begin
  create type public.decyzja_moderacji_wpisu as enum (
    'do_sprawdzenia',
    'zaakceptowany',
    'odrzucony'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.panel_moderacji_wpisow (
  submission_id uuid primary key references public.experience_submissions(id) on delete cascade,
  dodano timestamptz not null,
  tresc text not null,
  decyzja public.decyzja_moderacji_wpisu not null default 'do_sprawdzenia',
  nowe boolean not null default true,
  uwagi text
);

create or replace function public.sync_panel_moderacji_wpisow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending' then
    insert into public.panel_moderacji_wpisow (
      submission_id,
      dodano,
      tresc,
      decyzja,
      nowe,
      uwagi
    )
    values (
      new.id,
      new.created_at,
      new.content,
      'do_sprawdzenia',
      true,
      new.notes_admin
    )
    on conflict (submission_id) do update
      set dodano = excluded.dodano,
          tresc = excluded.tresc,
          uwagi = excluded.uwagi;
  else
    delete from public.panel_moderacji_wpisow
    where submission_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_panel_moderacji_wpisow_insert_trigger
  on public.experience_submissions;

create trigger sync_panel_moderacji_wpisow_insert_trigger
after insert on public.experience_submissions
for each row
execute function public.sync_panel_moderacji_wpisow();

drop trigger if exists sync_panel_moderacji_wpisow_update_trigger
  on public.experience_submissions;

create trigger sync_panel_moderacji_wpisow_update_trigger
after update of status, content, notes_admin on public.experience_submissions
for each row
execute function public.sync_panel_moderacji_wpisow();

create or replace function public.handle_panel_moderacji_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.nowe is false and old.nowe is true then
    update public.admin_review_notifications
    set read_at = coalesce(read_at, now())
    where submission_id = new.submission_id;
  end if;

  if new.decyzja = 'zaakceptowany' and old.decyzja <> 'zaakceptowany' then
    perform public.approve_experience_submission(new.submission_id);
  elsif new.decyzja = 'odrzucony' and old.decyzja <> 'odrzucony' then
    perform public.reject_experience_submission(new.submission_id, new.uwagi);
  end if;

  return new;
end;
$$;

drop trigger if exists handle_panel_moderacji_update_trigger
  on public.panel_moderacji_wpisow;

create trigger handle_panel_moderacji_update_trigger
after update on public.panel_moderacji_wpisow
for each row
execute function public.handle_panel_moderacji_update();

insert into public.panel_moderacji_wpisow (
  submission_id,
  dodano,
  tresc,
  decyzja,
  nowe,
  uwagi
)
select
  es.id,
  es.created_at,
  es.content,
  'do_sprawdzenia'::public.decyzja_moderacji_wpisu,
  coalesce(arn.read_at is null, true),
  es.notes_admin
from public.experience_submissions es
left join public.admin_review_notifications arn
  on arn.submission_id = es.id
where es.status = 'pending'
on conflict (submission_id) do update
  set dodano = excluded.dodano,
      tresc = excluded.tresc,
      uwagi = excluded.uwagi,
      nowe = excluded.nowe;

create or replace view public.panel_moderacji_podsumowanie as
select
  count(*)::int as oczekujace_wpisy,
  count(*) filter (where nowe is true)::int as nowe_wpisy
from public.panel_moderacji_wpisow;
