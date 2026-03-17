create extension if not exists pgcrypto;

create table if not exists public.experience_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  content text not null check (length(trim(content)) > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  source text not null default 'app',
  is_anonymous boolean not null default true,
  notes_admin text
);

alter table public.experience_submissions enable row level security;

comment on table public.experience_submissions is 'Anonymous submissions from the app for the shared recovery experience library.';
comment on column public.experience_submissions.content is 'User-submitted experience text awaiting moderation or publication.';
