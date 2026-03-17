comment on table public.experience_submissions is 'Kolejka wszystkich anonimowo przesłanych wpisów do wspólnej bazy doświadczeń.';
comment on column public.experience_submissions.content is 'Treść wpisu przesłanego przez użytkownika.';
comment on column public.experience_submissions.status is 'Status wpisu: pending, approved albo rejected.';
comment on column public.experience_submissions.source is 'Źródło wpisu, np. aplikacja.';
comment on column public.experience_submissions.is_anonymous is 'Informacja, czy wpis został przekazany anonimowo.';
comment on column public.experience_submissions.notes_admin is 'Notatka moderatora, np. powód odrzucenia.';
comment on column public.experience_submissions.contributor_id is 'Anonimowy identyfikator użytkownika, bez danych osobowych.';
comment on column public.experience_submissions.client_entry_id is 'Identyfikator wpisu po stronie aplikacji użytkownika.';
comment on column public.experience_submissions.reviewed_at is 'Data sprawdzenia wpisu przez moderatora.';
comment on column public.experience_submissions.approved_at is 'Data zaakceptowania wpisu do wspólnej bazy.';

comment on table public.shared_experience_library is 'Wspólna baza zaakceptowanych wpisów widocznych dla innych użytkowników.';
comment on column public.shared_experience_library.submission_id is 'Powiązanie z wpisem źródłowym z kolejki moderacji.';
comment on column public.shared_experience_library.contributor_id is 'Anonimowy identyfikator autora wpisu.';
comment on column public.shared_experience_library.content is 'Treść zaakceptowanego wpisu.';
comment on column public.shared_experience_library.published_at is 'Data publikacji wpisu we wspólnej bazie.';

comment on table public.contributor_badges is 'Odznaki przyznane anonimowym użytkownikom za zaakceptowane wpisy.';
comment on column public.contributor_badges.contributor_id is 'Anonimowy identyfikator użytkownika.';
comment on column public.contributor_badges.badge_code is 'Kod odznaki przyznanej użytkownikowi.';
comment on column public.contributor_badges.awarded_at is 'Data przyznania odznaki.';
comment on column public.contributor_badges.approved_count_at_award is 'Liczba zaakceptowanych wpisów w chwili przyznania odznaki.';

comment on table public.admin_review_notifications is 'Techniczna tabela nowych wpisów oczekujących na sprawdzenie.';
comment on column public.admin_review_notifications.submission_id is 'Id wpisu oczekującego na moderację.';
comment on column public.admin_review_notifications.read_at is 'Data oznaczenia wpisu jako zobaczonego.';
comment on column public.admin_review_notifications.status is 'Stan techniczny powiadomienia.';

comment on table public.panel_moderacji_wpisow is 'Prosta kolejka moderacji wpisów do sprawdzenia w Supabase.';
comment on column public.panel_moderacji_wpisow.submission_id is 'Id wpisu z kolejki moderacji.';
comment on column public.panel_moderacji_wpisow.dodano is 'Data dodania wpisu do sprawdzenia.';
comment on column public.panel_moderacji_wpisow.tresc is 'Treść wpisu przesłanego przez użytkownika.';
comment on column public.panel_moderacji_wpisow.decyzja is 'Decyzja moderatora: do_sprawdzenia, zaakceptowany albo odrzucony.';
comment on column public.panel_moderacji_wpisow.nowe is 'Czy wpis jest nowy i jeszcze nieprzejrzany.';
comment on column public.panel_moderacji_wpisow.uwagi is 'Uwagi moderatora, np. powód odrzucenia.';

comment on view public.panel_moderacji_podsumowanie is 'Podsumowanie liczby wpisów oczekujących i nowych w kolejce moderacji.';

comment on function public.approve_experience_submission(uuid) is 'Akceptuje wpis z kolejki i publikuje go we wspólnej bazie.';
comment on function public.reject_experience_submission(uuid, text) is 'Odrzuca wpis z kolejki i zapisuje opcjonalną uwagę moderatora.';
comment on function public.mark_experience_review_seen(uuid) is 'Oznacza wpis oczekujący jako zobaczony.';
comment on function public.delete_contributor_experience_entry(text, text) is 'Usuwa wpis użytkownika z kolejki i ze wspólnej bazy, jeśli był tam opublikowany.';
