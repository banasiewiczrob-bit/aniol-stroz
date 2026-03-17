alter table public.experience_submissions
  add column if not exists client_entry_id text;

create unique index if not exists experience_submissions_contributor_client_entry_uidx
  on public.experience_submissions (contributor_id, client_entry_id)
  where contributor_id is not null and client_entry_id is not null;

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
    and client_entry_id is not null
    and length(trim(client_entry_id)) between 1 and 120
    and length(trim(content)) between 3 and 600
  );

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

  delete from public.contributor_badges
  where contributor_id = normalized_contributor_id
    and (
      (badge_code = 'first_contribution' and approved_count < 1) or
      (badge_code = 'quiet_help' and approved_count < 3) or
      (badge_code = 'experience_co_creator' and approved_count < 5) or
      (badge_code = 'steady_contribution' and approved_count < 10) or
      (badge_code = 'support_space_builder' and approved_count < 20)
    );

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

create or replace function public.delete_contributor_experience_entry(
  p_contributor_id text,
  p_client_entry_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_contributor_id text := trim(coalesce(p_contributor_id, ''));
  normalized_client_entry_id text := trim(coalesce(p_client_entry_id, ''));
begin
  if normalized_contributor_id = '' or normalized_client_entry_id = '' then
    return;
  end if;

  delete from public.shared_experience_library
  where submission_id in (
    select id
    from public.experience_submissions
    where contributor_id = normalized_contributor_id
      and client_entry_id = normalized_client_entry_id
  );

  delete from public.experience_submissions
  where contributor_id = normalized_contributor_id
    and client_entry_id = normalized_client_entry_id;

  perform public.refresh_contributor_badges(normalized_contributor_id);
end;
$$;

grant execute on function public.delete_contributor_experience_entry(text, text) to anon, authenticated;
