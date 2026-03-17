alter table public.experience_submissions
  add column if not exists contributor_id text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_at timestamptz;

create index if not exists experience_submissions_contributor_id_idx
  on public.experience_submissions (contributor_id);

create index if not exists experience_submissions_status_idx
  on public.experience_submissions (status);

drop policy if exists "public can insert pending anonymous experience submissions"
  on public.experience_submissions;

create policy "public can insert pending anonymous experience submissions"
  on public.experience_submissions
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and source = 'app'
    and is_anonymous is true
    and notes_admin is null
    and contributor_id is not null
    and length(trim(contributor_id)) between 8 and 120
    and length(trim(content)) between 3 and 600
  );

create table if not exists public.shared_experience_library (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid unique references public.experience_submissions(id) on delete set null,
  contributor_id text not null,
  content text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.shared_experience_library enable row level security;

create policy "public can read shared experience library"
  on public.shared_experience_library
  for select
  to anon, authenticated
  using (true);

create table if not exists public.contributor_badges (
  id uuid primary key default gen_random_uuid(),
  contributor_id text not null,
  badge_code text not null,
  awarded_at timestamptz not null default now(),
  approved_count_at_award integer not null,
  created_at timestamptz not null default now(),
  unique (contributor_id, badge_code)
);

alter table public.contributor_badges enable row level security;

create or replace function public.refresh_contributor_badges(p_contributor_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_contributor_id text := trim(coalesce(p_contributor_id, ''));
  approved_count integer := 0;
begin
  if normalized_contributor_id = '' then
    return;
  end if;

  select count(*)
  into approved_count
  from public.shared_experience_library
  where contributor_id = normalized_contributor_id;

  if approved_count >= 1 then
    insert into public.contributor_badges (contributor_id, badge_code, approved_count_at_award)
    values (normalized_contributor_id, 'first_contribution', approved_count)
    on conflict (contributor_id, badge_code) do nothing;
  end if;

  if approved_count >= 3 then
    insert into public.contributor_badges (contributor_id, badge_code, approved_count_at_award)
    values (normalized_contributor_id, 'quiet_help', approved_count)
    on conflict (contributor_id, badge_code) do nothing;
  end if;

  if approved_count >= 5 then
    insert into public.contributor_badges (contributor_id, badge_code, approved_count_at_award)
    values (normalized_contributor_id, 'experience_co_creator', approved_count)
    on conflict (contributor_id, badge_code) do nothing;
  end if;

  if approved_count >= 10 then
    insert into public.contributor_badges (contributor_id, badge_code, approved_count_at_award)
    values (normalized_contributor_id, 'steady_contribution', approved_count)
    on conflict (contributor_id, badge_code) do nothing;
  end if;

  if approved_count >= 20 then
    insert into public.contributor_badges (contributor_id, badge_code, approved_count_at_award)
    values (normalized_contributor_id, 'support_space_builder', approved_count)
    on conflict (contributor_id, badge_code) do nothing;
  end if;
end;
$$;

create or replace function public.sync_shared_experience_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.experience_submissions
  set
    status = 'approved',
    reviewed_at = coalesce(reviewed_at, now()),
    approved_at = coalesce(approved_at, new.published_at),
    contributor_id = coalesce(contributor_id, new.contributor_id)
  where id = new.submission_id;

  perform public.refresh_contributor_badges(new.contributor_id);

  return new;
end;
$$;

drop trigger if exists sync_shared_experience_progress_trigger
  on public.shared_experience_library;

create trigger sync_shared_experience_progress_trigger
after insert on public.shared_experience_library
for each row
execute function public.sync_shared_experience_progress();

create or replace function public.get_contributor_progress(p_contributor_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select trim(coalesce(p_contributor_id, '')) as contributor_id
  ),
  pending as (
    select count(*)::int as value
    from public.experience_submissions, normalized
    where public.experience_submissions.contributor_id = normalized.contributor_id
      and public.experience_submissions.status = 'pending'
  ),
  approved as (
    select count(*)::int as value
    from public.shared_experience_library, normalized
    where public.shared_experience_library.contributor_id = normalized.contributor_id
  ),
  badges as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'badge_code', badge_code,
          'awarded_at', awarded_at,
          'approved_count_at_award', approved_count_at_award
        )
        order by awarded_at desc
      ),
      '[]'::jsonb
    ) as value
    from public.contributor_badges, normalized
    where public.contributor_badges.contributor_id = normalized.contributor_id
  )
  select jsonb_build_object(
    'approved_count', approved.value,
    'pending_count', pending.value,
    'badges', badges.value
  )
  from approved, pending, badges;
$$;

grant execute on function public.get_contributor_progress(text) to anon, authenticated;
