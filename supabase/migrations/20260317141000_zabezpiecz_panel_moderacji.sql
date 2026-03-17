alter table if exists public.panel_moderacji_wpisow
  enable row level security;

revoke all on table public.panel_moderacji_wpisow from public;
revoke all on table public.panel_moderacji_wpisow from anon;
revoke all on table public.panel_moderacji_wpisow from authenticated;

revoke all on table public.panel_moderacji_podsumowanie from public;
revoke all on table public.panel_moderacji_podsumowanie from anon;
revoke all on table public.panel_moderacji_podsumowanie from authenticated;

drop view if exists public.panel_moderacji_podsumowanie;

create view public.panel_moderacji_podsumowanie
with (security_invoker = true)
as
select
  count(*)::int as oczekujace_wpisy,
  count(*) filter (where nowe is true)::int as nowe_wpisy
from public.panel_moderacji_wpisow;

revoke all on table public.panel_moderacji_podsumowanie from public;
revoke all on table public.panel_moderacji_podsumowanie from anon;
revoke all on table public.panel_moderacji_podsumowanie from authenticated;

do $$
begin
  if to_regprocedure('public.zaakceptuj_wpis_do_bazy(uuid)') is not null then
    execute 'revoke all on function public.zaakceptuj_wpis_do_bazy(uuid) from public, anon, authenticated';
  end if;

  if to_regprocedure('public.odrzuc_wpis_do_bazy(uuid,text)') is not null then
    execute 'revoke all on function public.odrzuc_wpis_do_bazy(uuid, text) from public, anon, authenticated';
  end if;

  if to_regprocedure('public.oznacz_wpis_jako_zobaczony(uuid)') is not null then
    execute 'revoke all on function public.oznacz_wpis_jako_zobaczony(uuid) from public, anon, authenticated';
  end if;

  if to_regprocedure('public.odswiez_odznaki_wkladu(text)') is not null then
    execute 'revoke all on function public.odswiez_odznaki_wkladu(text) from public, anon, authenticated';
  end if;

  if to_regprocedure('public.zsynchronizuj_postep_wspolnej_bazy()') is not null then
    execute 'revoke all on function public.zsynchronizuj_postep_wspolnej_bazy() from public, anon, authenticated';
  end if;

  if to_regprocedure('public.dodaj_powiadomienie_moderacji()') is not null then
    execute 'revoke all on function public.dodaj_powiadomienie_moderacji() from public, anon, authenticated';
  end if;

  if to_regprocedure('public.zsynchronizuj_panel_moderacji_wpisow()') is not null then
    execute 'revoke all on function public.zsynchronizuj_panel_moderacji_wpisow() from public, anon, authenticated';
  end if;

  if to_regprocedure('public.obsluz_panel_moderacji_wpisow()') is not null then
    execute 'revoke all on function public.obsluz_panel_moderacji_wpisow() from public, anon, authenticated';
  end if;
end
$$;

comment on table public.panel_moderacji_wpisow is
  'Panel moderacji tylko dla administratora. Dostep z aplikacji uzytkownika jest zablokowany przez RLS i brak uprawnien.';

comment on view public.panel_moderacji_podsumowanie is
  'Podsumowanie panelu moderacji tylko dla administratora. Widok respektuje uprawnienia wywolujacego.';
