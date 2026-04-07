create extension if not exists pgcrypto;

create table if not exists public.kopie_zapasowe_aplikacji (
  id uuid primary key default gen_random_uuid(),
  utworzono_o timestamptz not null default now(),
  zaktualizowano_o timestamptz not null default now(),
  ostatnio_przywrocono_o timestamptz,
  skrot_kodu_odzyskiwania text not null unique,
  wersja_schematu integer not null,
  wersja_aplikacji text,
  dane jsonb not null
);

alter table public.kopie_zapasowe_aplikacji
  enable row level security;

revoke all on table public.kopie_zapasowe_aplikacji from public;
revoke all on table public.kopie_zapasowe_aplikacji from anon;
revoke all on table public.kopie_zapasowe_aplikacji from authenticated;

comment on table public.kopie_zapasowe_aplikacji is
  'Opcjonalne kopie zapasowe danych aplikacji przechowywane po stronie Supabase i odzyskiwane kodem przywracania.';

comment on column public.kopie_zapasowe_aplikacji.skrot_kodu_odzyskiwania is
  'SHA-256 kodu przywracania. Surowy kod nie jest przechowywany w bazie.';

comment on column public.kopie_zapasowe_aplikacji.dane is
  'Zaszyfrowana kopia zapasowa aplikacji zapisana jako jsonb.';

create or replace function public.zapisz_kopie_zapasowa_aplikacji(
  p_kod_odzyskiwania text,
  p_dane jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  znormalizowany_kod text := regexp_replace(upper(trim(coalesce(p_kod_odzyskiwania, ''))), '[^A-Z0-9]', '', 'g');
  skrot_kodu text := encode(digest(znormalizowany_kod, 'sha256'), 'hex');
  wersja_schematu_zapasu integer := nullif((p_dane ->> 'schemaVersion'), '')::integer;
  wersja_aplikacji_zapisu text := nullif(trim(coalesce(p_dane ->> 'appVersion', '')), '');
  rekord public.kopie_zapasowe_aplikacji%rowtype;
begin
  if length(znormalizowany_kod) < 16 or length(znormalizowany_kod) > 32 then
    raise exception 'Kod odzyskiwania musi miec od 16 do 32 znakow.';
  end if;

  if p_dane is null or jsonb_typeof(p_dane) <> 'object' then
    raise exception 'Brak poprawnych danych kopii zapasowej.';
  end if;

  if wersja_schematu_zapasu is null or wersja_schematu_zapasu < 1 then
    raise exception 'Kopia zapasowa nie zawiera poprawnej wersji schematu.';
  end if;

  if jsonb_typeof(p_dane -> 'encrypted') <> 'object' then
    raise exception 'Kopia zapasowa musi byc zaszyfrowana przed zapisem w chmurze.';
  end if;

  if coalesce(p_dane -> 'encrypted' ->> 'algorithm', '') <> 'AES-GCM' then
    raise exception 'Nieobslugiwany algorytm szyfrowania kopii zapasowej.';
  end if;

  if nullif(trim(coalesce(p_dane -> 'encrypted' ->> 'ciphertextB64', '')), '') is null then
    raise exception 'Brak zaszyfrowanej zawartosci kopii zapasowej.';
  end if;

  if octet_length(p_dane::text) > 2000000 then
    raise exception 'Kopia zapasowa jest zbyt duza.';
  end if;

  insert into public.kopie_zapasowe_aplikacji (
    skrot_kodu_odzyskiwania,
    wersja_schematu,
    wersja_aplikacji,
    dane,
    zaktualizowano_o
  )
  values (
    skrot_kodu,
    wersja_schematu_zapasu,
    wersja_aplikacji_zapisu,
    p_dane,
    now()
  )
  on conflict (skrot_kodu_odzyskiwania) do update
    set wersja_schematu = excluded.wersja_schematu,
        wersja_aplikacji = excluded.wersja_aplikacji,
        dane = excluded.dane,
        zaktualizowano_o = now()
  returning * into rekord;

  return jsonb_build_object(
    'utworzono_o', rekord.utworzono_o,
    'zaktualizowano_o', rekord.zaktualizowano_o
  );
end;
$$;

create or replace function public.pobierz_kopie_zapasowa_aplikacji(
  p_kod_odzyskiwania text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  znormalizowany_kod text := regexp_replace(upper(trim(coalesce(p_kod_odzyskiwania, ''))), '[^A-Z0-9]', '', 'g');
  skrot_kodu text := encode(digest(znormalizowany_kod, 'sha256'), 'hex');
  rekord public.kopie_zapasowe_aplikacji%rowtype;
begin
  if length(znormalizowany_kod) < 16 or length(znormalizowany_kod) > 32 then
    raise exception 'Kod odzyskiwania musi miec od 16 do 32 znakow.';
  end if;

  select *
  into rekord
  from public.kopie_zapasowe_aplikacji
  where skrot_kodu_odzyskiwania = skrot_kodu;

  if not found then
    raise exception 'Nie znaleziono kopii danych dla podanego kodu.';
  end if;

  update public.kopie_zapasowe_aplikacji
  set ostatnio_przywrocono_o = now()
  where id = rekord.id;

  return rekord.dane;
end;
$$;

grant execute on function public.zapisz_kopie_zapasowa_aplikacji(text, jsonb) to anon, authenticated;
grant execute on function public.pobierz_kopie_zapasowa_aplikacji(text) to anon, authenticated;
