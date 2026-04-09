create or replace function public.opublikuj_wpis_uzytkownika_do_bazy(
  p_tresc text,
  p_identyfikator_autora text,
  p_identyfikator_wpisu text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  znormalizowana_tresc text := trim(coalesce(p_tresc, ''));
  znormalizowany_autor text := trim(coalesce(p_identyfikator_autora, ''));
  znormalizowany_wpis text := trim(coalesce(p_identyfikator_wpisu, ''));
  rekord public.wpisy_doswiadczen%rowtype;
  id_bazy uuid;
begin
  if length(znormalizowana_tresc) < 3 or length(znormalizowana_tresc) > 600 then
    raise exception 'Treść wpisu musi mieć od 3 do 600 znaków.';
  end if;

  if length(znormalizowany_autor) < 8 or length(znormalizowany_autor) > 120 then
    raise exception 'Nieprawidłowy identyfikator anonimowego autora.';
  end if;

  if length(znormalizowany_wpis) < 1 or length(znormalizowany_wpis) > 120 then
    raise exception 'Nieprawidłowy identyfikator wpisu.';
  end if;

  select *
  into rekord
  from public.wpisy_doswiadczen
  where identyfikator_autora = znormalizowany_autor
    and identyfikator_wpisu = znormalizowany_wpis
  order by dodano_o desc
  limit 1
  for update;

  if not found then
    insert into public.wpisy_doswiadczen (
      tresc,
      identyfikator_autora,
      identyfikator_wpisu,
      status,
      zrodlo,
      anonimowy
    )
    values (
      znormalizowana_tresc,
      znormalizowany_autor,
      znormalizowany_wpis,
      'oczekujacy',
      'aplikacja',
      true
    )
    returning * into rekord;

    return public.zaakceptuj_wpis_do_bazy(rekord.id);
  end if;

  if rekord.status = 'zaakceptowany' then
    update public.wpisy_doswiadczen
    set
      tresc = znormalizowana_tresc,
      status = 'zaakceptowany',
      zrodlo = 'aplikacja',
      anonimowy = true,
      uwagi_moderatora = null,
      sprawdzono_o = coalesce(sprawdzono_o, now()),
      zaakceptowano_o = coalesce(zaakceptowano_o, now())
    where id = rekord.id;

    insert into public.wspolna_baza_doswiadczen (
      id_wpisu_zrodlowego,
      identyfikator_autora,
      tresc
    )
    values (
      rekord.id,
      znormalizowany_autor,
      znormalizowana_tresc
    )
    on conflict (id_wpisu_zrodlowego) do update
      set identyfikator_autora = excluded.identyfikator_autora,
          tresc = excluded.tresc
    returning id into id_bazy;

    update public.powiadomienia_moderacji
    set
      status = 'zaakceptowany',
      odczytano_o = coalesce(odczytano_o, now())
    where id_wpisu = rekord.id;

    perform public.odswiez_odznaki_wkladu(znormalizowany_autor);
    return id_bazy;
  end if;

  update public.wpisy_doswiadczen
  set
    tresc = znormalizowana_tresc,
    status = 'oczekujacy',
    zrodlo = 'aplikacja',
    anonimowy = true,
    uwagi_moderatora = null,
    sprawdzono_o = null,
    zaakceptowano_o = null
  where id = rekord.id
  returning * into rekord;

  return public.zaakceptuj_wpis_do_bazy(rekord.id);
end;
$$;

grant execute on function public.opublikuj_wpis_uzytkownika_do_bazy(text, text, text) to anon, authenticated;

comment on function public.opublikuj_wpis_uzytkownika_do_bazy(text, text, text) is
  'Publikuje anonimowy wpis użytkownika od razu we wspólnej bazie i zachowuje powiązanie z wpisem źródłowym.';

do $$
declare
  rekord record;
begin
  for rekord in
    select id
    from public.wpisy_doswiadczen
    where status = 'oczekujacy'
      and zrodlo = 'aplikacja'
      and anonimowy is true
      and identyfikator_autora is not null
      and trim(identyfikator_autora) <> ''
      and identyfikator_wpisu is not null
      and trim(identyfikator_wpisu) <> ''
      and tresc is not null
      and trim(tresc) <> ''
    order by dodano_o asc
  loop
    perform public.zaakceptuj_wpis_do_bazy(rekord.id);
  end loop;
end
$$;
