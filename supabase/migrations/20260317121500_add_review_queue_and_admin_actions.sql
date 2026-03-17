create table if not exists public.admin_review_notifications (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.experience_submissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  status text not null default 'pending'
);

alter table public.admin_review_notifications enable row level security;

create or replace function public.queue_experience_review_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending' then
    insert into public.admin_review_notifications (submission_id, status)
    values (new.id, 'pending')
    on conflict (submission_id) do update
      set status = 'pending',
          read_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists queue_experience_review_notification_trigger
  on public.experience_submissions;

create trigger queue_experience_review_notification_trigger
after insert on public.experience_submissions
for each row
execute function public.queue_experience_review_notification();

create or replace view public.admin_pending_experience_review as
select
  es.id as submission_id,
  es.created_at,
  es.content,
  es.contributor_id,
  es.client_entry_id,
  es.source,
  es.notes_admin,
  arn.created_at as notification_created_at,
  arn.read_at is null as is_new
from public.experience_submissions es
left join public.admin_review_notifications arn
  on arn.submission_id = es.id
where es.status = 'pending'
order by es.created_at desc;

create or replace view public.admin_experience_review_summary as
select
  count(*) filter (where es.status = 'pending')::int as pending_count,
  count(*) filter (where es.status = 'pending' and arn.read_at is null)::int as unread_pending_count
from public.experience_submissions es
left join public.admin_review_notifications arn
  on arn.submission_id = es.id;

create or replace function public.mark_experience_review_seen(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admin_review_notifications
  set read_at = coalesce(read_at, now())
  where submission_id = p_submission_id;
end;
$$;

create or replace function public.approve_experience_submission(p_submission_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_row public.experience_submissions%rowtype;
  shared_id uuid;
begin
  select *
  into submission_row
  from public.experience_submissions
  where id = p_submission_id
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Pending submission not found: %', p_submission_id;
  end if;

  insert into public.shared_experience_library (
    submission_id,
    contributor_id,
    content
  )
  values (
    submission_row.id,
    submission_row.contributor_id,
    submission_row.content
  )
  on conflict (submission_id) do update
    set contributor_id = excluded.contributor_id,
        content = excluded.content
  returning id into shared_id;

  update public.admin_review_notifications
  set
    status = 'approved',
    read_at = coalesce(read_at, now())
  where submission_id = p_submission_id;

  return shared_id;
end;
$$;

create or replace function public.reject_experience_submission(
  p_submission_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.experience_submissions
  set
    status = 'rejected',
    reviewed_at = coalesce(reviewed_at, now()),
    notes_admin = case
      when p_notes is null or trim(p_notes) = '' then notes_admin
      else p_notes
    end
  where id = p_submission_id
    and status = 'pending';

  if not found then
    raise exception 'Pending submission not found: %', p_submission_id;
  end if;

  update public.admin_review_notifications
  set
    status = 'rejected',
    read_at = coalesce(read_at, now())
  where submission_id = p_submission_id;
end;
$$;
