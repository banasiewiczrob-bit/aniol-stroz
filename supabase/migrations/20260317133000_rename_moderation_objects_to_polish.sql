do $$
begin
  if to_regclass('public.experience_submissions') is not null and to_regclass('public.wpisy_doswiadczen') is null then
    execute 'alter table public.experience_submissions rename to wpisy_doswiadczen';
  end if;

  if to_regclass('public.shared_experience_library') is not null and to_regclass('public.wspolna_baza_doswiadczen') is null then
    execute 'alter table public.shared_experience_library rename to wspolna_baza_doswiadczen';
  end if;

  if to_regclass('public.contributor_badges') is not null and to_regclass('public.odznaki_wkladu') is null then
    execute 'alter table public.contributor_badges rename to odznaki_wkladu';
  end if;

  if to_regclass('public.admin_review_notifications') is not null and to_regclass('public.powiadomienia_moderacji') is null then
    execute 'alter table public.admin_review_notifications rename to powiadomienia_moderacji';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wpisy_doswiadczen' and column_name = 'created_at'
  ) then
    execute 'alter table public.wpisy_doswiadczen rename column created_at to dodano_o';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wpisy_doswiadczen' and column_name = 'content'
  ) then
    execute 'alter table public.wpisy_doswiadczen rename column content to tresc';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wpisy_doswiadczen' and column_name = 'source'
  ) then
    execute 'alter table public.wpisy_doswiadczen rename column source to zrodlo';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wpisy_doswiadczen' and column_name = 'is_anonymous'
  ) then
    execute 'alter table public.wpisy_doswiadczen rename column is_anonymous to anonimowy';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wpisy_doswiadczen' and column_name = 'notes_admin'
  ) then
    execute 'alter table public.wpisy_doswiadczen rename column notes_admin to uwagi_moderatora';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wpisy_doswiadczen' and column_name = 'contributor_id'
  ) then
    execute 'alter table public.wpisy_doswiadczen rename column contributor_id to identyfikator_autora';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wpisy_doswiadczen' and column_name = 'client_entry_id'
  ) then
    execute 'alter table public.wpisy_doswiadczen rename column client_entry_id to identyfikator_wpisu';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wpisy_doswiadczen' and column_name = 'reviewed_at'
  ) then
    execute 'alter table public.wpisy_doswiadczen rename column reviewed_at to sprawdzono_o';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wpisy_doswiadczen' and column_name = 'approved_at'
  ) then
    execute 'alter table public.wpisy_doswiadczen rename column approved_at to zaakceptowano_o';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wspolna_baza_doswiadczen' and column_name = 'submission_id'
  ) then
    execute 'alter table public.wspolna_baza_doswiadczen rename column submission_id to id_wpisu_zrodlowego';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wspolna_baza_doswiadczen' and column_name = 'contributor_id'
  ) then
    execute 'alter table public.wspolna_baza_doswiadczen rename column contributor_id to identyfikator_autora';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wspolna_baza_doswiadczen' and column_name = 'content'
  ) then
    execute 'alter table public.wspolna_baza_doswiadczen rename column content to tresc';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wspolna_baza_doswiadczen' and column_name = 'published_at'
  ) then
    execute 'alter table public.wspolna_baza_doswiadczen rename column published_at to opublikowano_o';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wspolna_baza_doswiadczen' and column_name = 'created_at'
  ) then
    execute 'alter table public.wspolna_baza_doswiadczen rename column created_at to dodano_o';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'odznaki_wkladu' and column_name = 'contributor_id'
  ) then
    execute 'alter table public.odznaki_wkladu rename column contributor_id to identyfikator_autora';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'odznaki_wkladu' and column_name = 'badge_code'
  ) then
    execute 'alter table public.odznaki_wkladu rename column badge_code to kod_odznaki';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'odznaki_wkladu' and column_name = 'awarded_at'
  ) then
    execute 'alter table public.odznaki_wkladu rename column awarded_at to przyznano_o';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'odznaki_wkladu' and column_name = 'approved_count_at_award'
  ) then
    execute 'alter table public.odznaki_wkladu rename column approved_count_at_award to liczba_zaakceptowanych_przy_przyznaniu';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'odznaki_wkladu' and column_name = 'created_at'
  ) then
    execute 'alter table public.odznaki_wkladu rename column created_at to dodano_o';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'powiadomienia_moderacji' and column_name = 'submission_id'
  ) then
    execute 'alter table public.powiadomienia_moderacji rename column submission_id to id_wpisu';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'powiadomienia_moderacji' and column_name = 'created_at'
  ) then
    execute 'alter table public.powiadomienia_moderacji rename column created_at to dodano_o';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'powiadomienia_moderacji' and column_name = 'read_at'
  ) then
    execute 'alter table public.powiadomienia_moderacji rename column read_at to odczytano_o';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'panel_moderacji_wpisow' and column_name = 'submission_id'
  ) then
    execute 'alter table public.panel_moderacji_wpisow rename column submission_id to id_wpisu';
  end if;
end
$$;

drop trigger if exists sync_shared_experience_progress_trigger on public.wspolna_baza_doswiadczen;
drop trigger if exists queue_experience_review_notification_trigger on public.wpisy_doswiadczen;
drop trigger if exists sync_panel_moderacji_wpisow_insert_trigger on public.wpisy_doswiadczen;
drop trigger if exists sync_panel_moderacji_wpisow_update_trigger on public.wpisy_doswiadczen;
drop trigger if exists handle_panel_moderacji_update_trigger on public.panel_moderacji_wpisow;

alter table public.wpisy_doswiadczen drop constraint if exists experience_submissions_status_check;
alter table public.wpisy_doswiadczen drop constraint if exists wpisy_doswiadczen_status_check;

update public.wpisy_doswiadczen
set status = case status
  when 'pending' then 'oczekujacy'
  when 'approved' then 'zaakceptowany'
  when 'rejected' then 'odrzucony'
  else status
end
where status in ('pending', 'approved', 'rejected');

alter table public.wpisy_doswiadczen
  add constraint wpisy_doswiadczen_status_check
  check (status in ('oczekujacy', 'zaakceptowany', 'odrzucony'));

update public.wpisy_doswiadczen
set zrodlo = case zrodlo
  when 'app' then 'aplikacja'
  else zrodlo
end
where zrodlo = 'app';

update public.powiadomienia_moderacji
set status = case status
  when 'pending' then 'oczekujacy'
  when 'approved' then 'zaakceptowany'
  when 'rejected' then 'odrzucony'
  else status
end
where status in ('pending', 'approved', 'rejected');

update public.odznaki_wkladu
set kod_odznaki = case kod_odznaki
  when 'first_contribution' then 'pierwszy_wklad'
  when 'quiet_help' then 'cicha_pomoc'
  when 'experience_co_creator' then 'wspoltworca_bazy_doswiadczen'
  when 'steady_contribution' then 'staly_wklad'
  when 'support_space_builder' then 'tworze_przestrzen_wsparcia'
  else kod_odznaki
end
where kod_odznaki in (
  'first_contribution',
  'quiet_help',
  'experience_co_creator',
  'steady_contribution',
  'support_space_builder'
);

drop view if exists public.admin_pending_experience_review;
drop view if exists public.admin_experience_review_summary;

drop trigger if exists sync_shared_experience_progress_trigger on public.wspolna_baza_doswiadczen;
drop trigger if exists queue_experience_review_notification_trigger on public.wpisy_doswiadczen;
drop trigger if exists sync_panel_moderacji_wpisow_insert_trigger on public.wpisy_doswiadczen;
drop trigger if exists sync_panel_moderacji_wpisow_update_trigger on public.wpisy_doswiadczen;
drop trigger if exists handle_panel_moderacji_update_trigger on public.panel_moderacji_wpisow;

drop function if exists public.get_contributor_progress(text);
drop function if exists public.delete_contributor_experience_entry(text, text);
drop function if exists public.approve_experience_submission(uuid);
drop function if exists public.reject_experience_submission(uuid, text);
drop function if exists public.mark_experience_review_seen(uuid);
drop function if exists public.refresh_contributor_badges(text);
drop function if exists public.sync_shared_experience_progress();
drop function if exists public.queue_experience_review_notification();
drop function if exists public.sync_panel_moderacji_wpisow();
drop function if exists public.handle_panel_moderacji_update();

drop policy if exists "public can insert pending anonymous experience submissions" on public.wpisy_doswiadczen;
drop policy if exists "public can read shared experience library" on public.wspolna_baza_doswiadczen;

create policy "anonimowi moga dodawac oczekujace wpisy"
on public.wpisy_doswiadczen
for insert
to anon, authenticated
with check (
  status = 'oczekujacy'
  and zrodlo = 'aplikacja'
  and anonimowy is true
  and uwagi_moderatora is null
  and identyfikator_autora is not null
  and length(trim(identyfikator_autora)) between 8 and 120
  and identyfikator_wpisu is not null
  and length(trim(identyfikator_wpisu)) between 1 and 120
  and length(trim(tresc)) between 3 and 600
);

create policy "wszyscy moga czytac wspolna baze doswiadczen"
on public.wspolna_baza_doswiadczen
for select
to anon, authenticated
using (true);

create or replace function public.odswiez_odznaki_wkladu(p_identyfikator_autora text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  znormalizowany_id text := trim(coalesce(p_identyfikator_autora, ''));
  liczba_zaakceptowanych integer := 0;
begin
  if znormalizowany_id = '' then
    return;
  end if;

  select count(*)
  into liczba_zaakceptowanych
  from public.wspolna_baza_doswiadczen
  where identyfikator_autora = znormalizowany_id;

  delete from public.odznaki_wkladu
  where identyfikator_autora = znormalizowany_id
    and (
      (kod_odznaki = 'pierwszy_wklad' and liczba_zaakceptowanych < 1) or
      (kod_odznaki = 'cicha_pomoc' and liczba_zaakceptowanych < 3) or
      (kod_odznaki = 'wspoltworca_bazy_doswiadczen' and liczba_zaakceptowanych < 5) or
      (kod_odznaki = 'staly_wklad' and liczba_zaakceptowanych < 10) or
      (kod_odznaki = 'tworze_przestrzen_wsparcia' and liczba_zaakceptowanych < 20)
    );

  if liczba_zaakceptowanych >= 1 then
    insert into public.odznaki_wkladu (identyfikator_autora, kod_odznaki, liczba_zaakceptowanych_przy_przyznaniu)
    values (znormalizowany_id, 'pierwszy_wklad', liczba_zaakceptowanych)
    on conflict (identyfikator_autora, kod_odznaki) do nothing;
  end if;

  if liczba_zaakceptowanych >= 3 then
    insert into public.odznaki_wkladu (identyfikator_autora, kod_odznaki, liczba_zaakceptowanych_przy_przyznaniu)
    values (znormalizowany_id, 'cicha_pomoc', liczba_zaakceptowanych)
    on conflict (identyfikator_autora, kod_odznaki) do nothing;
  end if;

  if liczba_zaakceptowanych >= 5 then
    insert into public.odznaki_wkladu (identyfikator_autora, kod_odznaki, liczba_zaakceptowanych_przy_przyznaniu)
    values (znormalizowany_id, 'wspoltworca_bazy_doswiadczen', liczba_zaakceptowanych)
    on conflict (identyfikator_autora, kod_odznaki) do nothing;
  end if;

  if liczba_zaakceptowanych >= 10 then
    insert into public.odznaki_wkladu (identyfikator_autora, kod_odznaki, liczba_zaakceptowanych_przy_przyznaniu)
    values (znormalizowany_id, 'staly_wklad', liczba_zaakceptowanych)
    on conflict (identyfikator_autora, kod_odznaki) do nothing;
  end if;

  if liczba_zaakceptowanych >= 20 then
    insert into public.odznaki_wkladu (identyfikator_autora, kod_odznaki, liczba_zaakceptowanych_przy_przyznaniu)
    values (znormalizowany_id, 'tworze_przestrzen_wsparcia', liczba_zaakceptowanych)
    on conflict (identyfikator_autora, kod_odznaki) do nothing;
  end if;
end;
$$;

create or replace function public.zsynchronizuj_postep_wspolnej_bazy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.wpisy_doswiadczen
  set
    status = 'zaakceptowany',
    sprawdzono_o = coalesce(sprawdzono_o, now()),
    zaakceptowano_o = coalesce(zaakceptowano_o, new.opublikowano_o),
    identyfikator_autora = coalesce(identyfikator_autora, new.identyfikator_autora)
  where id = new.id_wpisu_zrodlowego;

  perform public.odswiez_odznaki_wkladu(new.identyfikator_autora);

  return new;
end;
$$;

create or replace function public.dodaj_powiadomienie_moderacji()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'oczekujacy' then
    insert into public.powiadomienia_moderacji (id_wpisu, status)
    values (new.id, 'oczekujacy')
    on conflict (id_wpisu) do update
      set status = 'oczekujacy',
          odczytano_o = null;
  end if;

  return new;
end;
$$;

create or replace function public.pobierz_postep_wkladu(p_identyfikator_autora text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with znormalizowany as (
    select trim(coalesce(p_identyfikator_autora, '')) as identyfikator_autora
  ),
  oczekujace as (
    select count(*)::int as wartosc
    from public.wpisy_doswiadczen, znormalizowany
    where public.wpisy_doswiadczen.identyfikator_autora = znormalizowany.identyfikator_autora
      and public.wpisy_doswiadczen.status = 'oczekujacy'
  ),
  zaakceptowane as (
    select count(*)::int as wartosc
    from public.wspolna_baza_doswiadczen, znormalizowany
    where public.wspolna_baza_doswiadczen.identyfikator_autora = znormalizowany.identyfikator_autora
  ),
  odznaki as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'kod_odznaki', kod_odznaki,
          'przyznano_o', przyznano_o,
          'liczba_zaakceptowanych_przy_przyznaniu', liczba_zaakceptowanych_przy_przyznaniu
        )
        order by przyznano_o desc
      ),
      '[]'::jsonb
    ) as wartosc
    from public.odznaki_wkladu, znormalizowany
    where public.odznaki_wkladu.identyfikator_autora = znormalizowany.identyfikator_autora
  )
  select jsonb_build_object(
    'liczba_zaakceptowanych', zaakceptowane.wartosc,
    'liczba_oczekujacych', oczekujace.wartosc,
    'odznaki', odznaki.wartosc
  )
  from zaakceptowane, oczekujace, odznaki;
$$;

create or replace function public.usun_wpis_uzytkownika_z_bazy(
  p_identyfikator_autora text,
  p_identyfikator_wpisu text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  znormalizowany_autor text := trim(coalesce(p_identyfikator_autora, ''));
  znormalizowany_wpis text := trim(coalesce(p_identyfikator_wpisu, ''));
begin
  if znormalizowany_autor = '' or znormalizowany_wpis = '' then
    return;
  end if;

  delete from public.wspolna_baza_doswiadczen
  where id_wpisu_zrodlowego in (
    select id
    from public.wpisy_doswiadczen
    where identyfikator_autora = znormalizowany_autor
      and identyfikator_wpisu = znormalizowany_wpis
  );

  delete from public.wpisy_doswiadczen
  where identyfikator_autora = znormalizowany_autor
    and identyfikator_wpisu = znormalizowany_wpis;

  perform public.odswiez_odznaki_wkladu(znormalizowany_autor);
end;
$$;

create or replace function public.oznacz_wpis_jako_zobaczony(p_id_wpisu uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.powiadomienia_moderacji
  set odczytano_o = coalesce(odczytano_o, now())
  where id_wpisu = p_id_wpisu;
end;
$$;

create or replace function public.zaakceptuj_wpis_do_bazy(p_id_wpisu uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  rekord public.wpisy_doswiadczen%rowtype;
  id_bazy uuid;
begin
  select *
  into rekord
  from public.wpisy_doswiadczen
  where id = p_id_wpisu
    and status = 'oczekujacy'
  for update;

  if not found then
    raise exception 'Nie znaleziono wpisu oczekującego: %', p_id_wpisu;
  end if;

  insert into public.wspolna_baza_doswiadczen (
    id_wpisu_zrodlowego,
    identyfikator_autora,
    tresc
  )
  values (
    rekord.id,
    rekord.identyfikator_autora,
    rekord.tresc
  )
  on conflict (id_wpisu_zrodlowego) do update
    set identyfikator_autora = excluded.identyfikator_autora,
        tresc = excluded.tresc
  returning id into id_bazy;

  update public.powiadomienia_moderacji
  set
    status = 'zaakceptowany',
    odczytano_o = coalesce(odczytano_o, now())
  where id_wpisu = p_id_wpisu;

  return id_bazy;
end;
$$;

create or replace function public.odrzuc_wpis_do_bazy(
  p_id_wpisu uuid,
  p_uwagi text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.wpisy_doswiadczen
  set
    status = 'odrzucony',
    sprawdzono_o = coalesce(sprawdzono_o, now()),
    uwagi_moderatora = case
      when p_uwagi is null or trim(p_uwagi) = '' then uwagi_moderatora
      else p_uwagi
    end
  where id = p_id_wpisu
    and status = 'oczekujacy';

  if not found then
    raise exception 'Nie znaleziono wpisu oczekującego: %', p_id_wpisu;
  end if;

  update public.powiadomienia_moderacji
  set
    status = 'odrzucony',
    odczytano_o = coalesce(odczytano_o, now())
  where id_wpisu = p_id_wpisu;
end;
$$;

create or replace function public.zsynchronizuj_panel_moderacji_wpisow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'oczekujacy' then
    insert into public.panel_moderacji_wpisow (
      id_wpisu,
      dodano,
      tresc,
      decyzja,
      nowe,
      uwagi
    )
    values (
      new.id,
      new.dodano_o,
      new.tresc,
      'do_sprawdzenia',
      true,
      new.uwagi_moderatora
    )
    on conflict (id_wpisu) do update
      set dodano = excluded.dodano,
          tresc = excluded.tresc,
          uwagi = excluded.uwagi;
  else
    delete from public.panel_moderacji_wpisow
    where id_wpisu = new.id;
  end if;

  return new;
end;
$$;

create or replace function public.obsluz_panel_moderacji_wpisow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.nowe is false and old.nowe is true then
    update public.powiadomienia_moderacji
    set odczytano_o = coalesce(odczytano_o, now())
    where id_wpisu = new.id_wpisu;
  end if;

  if new.decyzja = 'zaakceptowany' and old.decyzja <> 'zaakceptowany' then
    perform public.zaakceptuj_wpis_do_bazy(new.id_wpisu);
  elsif new.decyzja = 'odrzucony' and old.decyzja <> 'odrzucony' then
    perform public.odrzuc_wpis_do_bazy(new.id_wpisu, new.uwagi);
  end if;

  return new;
end;
$$;

create trigger zsynchronizuj_postep_wspolnej_bazy_trigger
after insert on public.wspolna_baza_doswiadczen
for each row
execute function public.zsynchronizuj_postep_wspolnej_bazy();

create trigger dodaj_powiadomienie_moderacji_trigger
after insert on public.wpisy_doswiadczen
for each row
execute function public.dodaj_powiadomienie_moderacji();

create trigger zsynchronizuj_panel_moderacji_wpisow_insert_trigger
after insert on public.wpisy_doswiadczen
for each row
execute function public.zsynchronizuj_panel_moderacji_wpisow();

create trigger zsynchronizuj_panel_moderacji_wpisow_update_trigger
after update of status, tresc, uwagi_moderatora on public.wpisy_doswiadczen
for each row
execute function public.zsynchronizuj_panel_moderacji_wpisow();

create trigger obsluz_panel_moderacji_wpisow_trigger
after update on public.panel_moderacji_wpisow
for each row
execute function public.obsluz_panel_moderacji_wpisow();

create or replace view public.panel_moderacji_podsumowanie as
select
  count(*)::int as oczekujace_wpisy,
  count(*) filter (where nowe is true)::int as nowe_wpisy
from public.panel_moderacji_wpisow;

grant execute on function public.pobierz_postep_wkladu(text) to anon, authenticated;
grant execute on function public.usun_wpis_uzytkownika_z_bazy(text, text) to anon, authenticated;

comment on table public.wpisy_doswiadczen is 'Kolejka wszystkich anonimowo przesłanych wpisów do wspólnej bazy doświadczeń.';
comment on column public.wpisy_doswiadczen.tresc is 'Treść wpisu przesłanego przez użytkownika.';
comment on column public.wpisy_doswiadczen.status is 'Status wpisu: oczekujacy, zaakceptowany albo odrzucony.';
comment on column public.wpisy_doswiadczen.zrodlo is 'Źródło wpisu, np. aplikacja.';
comment on column public.wpisy_doswiadczen.anonimowy is 'Informacja, czy wpis został przekazany anonimowo.';
comment on column public.wpisy_doswiadczen.uwagi_moderatora is 'Notatka moderatora, np. powód odrzucenia.';
comment on column public.wpisy_doswiadczen.identyfikator_autora is 'Anonimowy identyfikator użytkownika, bez danych osobowych.';
comment on column public.wpisy_doswiadczen.identyfikator_wpisu is 'Identyfikator wpisu po stronie aplikacji użytkownika.';
comment on column public.wpisy_doswiadczen.sprawdzono_o is 'Data sprawdzenia wpisu przez moderatora.';
comment on column public.wpisy_doswiadczen.zaakceptowano_o is 'Data zaakceptowania wpisu do wspólnej bazy.';

comment on table public.wspolna_baza_doswiadczen is 'Wspólna baza zaakceptowanych wpisów widocznych dla innych użytkowników.';
comment on column public.wspolna_baza_doswiadczen.id_wpisu_zrodlowego is 'Powiązanie z wpisem źródłowym z kolejki moderacji.';
comment on column public.wspolna_baza_doswiadczen.identyfikator_autora is 'Anonimowy identyfikator autora wpisu.';
comment on column public.wspolna_baza_doswiadczen.tresc is 'Treść zaakceptowanego wpisu.';
comment on column public.wspolna_baza_doswiadczen.opublikowano_o is 'Data publikacji wpisu we wspólnej bazie.';

comment on table public.odznaki_wkladu is 'Odznaki przyznane anonimowym użytkownikom za zaakceptowane wpisy.';
comment on column public.odznaki_wkladu.identyfikator_autora is 'Anonimowy identyfikator użytkownika.';
comment on column public.odznaki_wkladu.kod_odznaki is 'Kod odznaki przyznanej użytkownikowi.';
comment on column public.odznaki_wkladu.przyznano_o is 'Data przyznania odznaki.';
comment on column public.odznaki_wkladu.liczba_zaakceptowanych_przy_przyznaniu is 'Liczba zaakceptowanych wpisów w chwili przyznania odznaki.';

comment on table public.powiadomienia_moderacji is 'Techniczna tabela nowych wpisów oczekujących na sprawdzenie.';
comment on column public.powiadomienia_moderacji.id_wpisu is 'Id wpisu oczekującego na moderację.';
comment on column public.powiadomienia_moderacji.odczytano_o is 'Data oznaczenia wpisu jako zobaczonego.';
comment on column public.powiadomienia_moderacji.status is 'Stan techniczny powiadomienia.';

comment on function public.pobierz_postep_wkladu(text) is 'Pobiera liczbę wpisów oczekujących, zaakceptowanych i odznaki użytkownika.';
comment on function public.usun_wpis_uzytkownika_z_bazy(text, text) is 'Usuwa wpis użytkownika z kolejki i ze wspólnej bazy, jeśli był tam opublikowany.';
comment on function public.zaakceptuj_wpis_do_bazy(uuid) is 'Akceptuje wpis z kolejki i publikuje go we wspólnej bazie.';
comment on function public.odrzuc_wpis_do_bazy(uuid, text) is 'Odrzuca wpis z kolejki i zapisuje opcjonalną uwagę moderatora.';
comment on function public.oznacz_wpis_jako_zobaczony(uuid) is 'Oznacza wpis oczekujący jako zobaczony.';
comment on function public.odswiez_odznaki_wkladu(text) is 'Przelicza odznaki użytkownika na podstawie zaakceptowanych wpisów.';
