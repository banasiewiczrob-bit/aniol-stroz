revoke all on public.experience_submissions from anon, authenticated;
grant insert on public.experience_submissions to anon, authenticated;

alter table public.experience_submissions force row level security;

drop policy if exists "public can insert pending anonymous experience submissions" on public.experience_submissions;

create policy "public can insert pending anonymous experience submissions"
on public.experience_submissions
for insert
to anon, authenticated
with check (
  status = 'pending'
  and source = 'app'
  and is_anonymous = true
  and notes_admin is null
  and length(trim(content)) >= 3
  and length(trim(content)) <= 600
);
