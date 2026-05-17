insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'app-audio',
  'app-audio',
  true,
  52428800,
  array[
    'audio/aac',
    'audio/mp4',
    'audio/mpeg',
    'audio/x-m4a'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Publiczny odczyt audio aplikacji" on storage.objects;

create policy "Publiczny odczyt audio aplikacji"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'app-audio');
