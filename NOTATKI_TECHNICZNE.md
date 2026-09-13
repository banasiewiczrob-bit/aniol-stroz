# Notatki techniczne

## Cel
To jest roboczy dokument techniczny projektu `aniol-stroz`.
Trzymamy tu:
- rzeczy do zrobienia,
- decyzje techniczne,
- krótkie notatki po zmianach.

## TODO (najbliższe)
- [ ] Deep links / App Links / Universal Links: kolejność działań na 2026-05-04.
  - Zakres:
    - Android: zbudować nową wersję aplikacji z obsługą `https://aniolstroz.com.pl/app/*` i wrzucić ją do Google Play.
    - Android: przetestować na urządzeniu linki `https://aniolstroz.com.pl/app/wsparcie` i `https://aniolstroz.com.pl/app/plan-dnia`.
    - WWW: dodać fallbacki dla wybranych ścieżek `/app/*` w WordPressie, żeby użytkownik bez aplikacji nie trafiał na `404`.
    - iOS: przygotować plik `/.well-known/apple-app-site-association` ograniczony do `/app/*`.
    - iOS: po ustaleniu `Apple Team ID` dokończyć Universal Links i wypuścić build z nową konfiguracją.
- [ ] Plan dnia: dodać prawdziwe powiadomienie push wieczorne (systemowe), nie tylko przypomnienie widoczne w ekranie.
  - Zakres: `expo-notifications`, prośba o zgodę użytkownika, harmonogram lokalny na wieczór, sensowny fallback gdy brak zgody.
- [ ] Google Play Console: dokończyć deklarację „Uprawnienia usług działających na pierwszym planie" (FOREGROUND_SERVICE_MEDIA_PLAYBACK).
  - Miejsce: Play Console → Dzień po dniu. Anioł Stróż → Zawartość aplikacji → Uprawnienia usług działających na pierwszym planie.
  - Ustalone: checkbox „Odtwarzanie multimediów" jest już zaznaczony (potwierdzone w kodzie — `expo-audio` używane w `app/(tabs)/(main)/refleksje.tsx`, `app/wsparcie-24.tsx`, `app/wsparcie-desiderata.tsx` do odtwarzania nagrań audio z `playsInSilentMode: true`).
  - Brakuje: nagranie wideo (telefon → ekran, Refleksje → play na nagraniu audio, najlepiej pokazać że gra dalej po zablokowaniu ekranu) wrzucone na YouTube jako „Niepubliczny" i wklejone jako link w polu „Link do filmu".
  - Blokada: brak telefonu pod ręką w momencie notowania (2026-09-13).
- [ ] Google Play i App Store: dopisać nową kategorię danych "Interakcje z aplikacją" / "Usage Data — Product Interaction" (cel: Analytics, niepowiązane z tożsamością, bez trackingu) po wdrożeniu anonimowej analityki użycia ekranów (`app_usage_events`, patrz Notatki zmian 2026-09-13). Bez tego dzisiejsze poprawki Data Safety/App Privacy przestają być kompletne.

## Uzgodnione zachowanie (Plan dnia)
- Po `Podsumuj dzień`:
  - wpis trafia do archiwum,
  - pola bieżącego dnia są czyszczone,
  - plan jest gotowy na nowy dzień.

## Notatki zmian
- 2026-09-13: Dziennik Uczuć — dodano możliwość wpisania własnego, niestandardowego uczucia (poza listą 7×5 gotowych opcji), plik `app/(tabs)/(main)/dzienniki/uczucia-test.tsx`.
- 2026-09-13: Ekran Wsparcie/Społeczność — dodano badge "Nowa wiadomość na #pogaduchy" przy przycisku "Otwórz Discord" (`app/wsparcie-spolecznosc.tsx`), oparty o nową automatyzację backendową: bot Discorda + Supabase Edge Function `discord-activity-check` (cron co 5 min) zapisujące ostatnią wiadomość do tabeli `discord_channel_activity`.
- 2026-09-13: Discord — dodano automatyczną wiadomość bota na #pogaduchy publikowaną we wtorki i piątki ok. 9:00 (Supabase Edge Function `discord-daily-encouragement`, cron `0 7 * * 2,5`), żeby zaangażować mniej aktywnych członków społeczności. Treść: tytuł prawdziwej refleksji dziennej (`reflections.json`, wyciąg z `docs/daily-reflections.json`) + proste, bezpośrednie pytanie (wzorzec sprawdzony na grupie FB).
- 2026-09-13: Google Play (Bezpieczeństwo danych) i App Store Connect (App Privacy) — poprawiono deklaracje, żeby odpowiadały rzeczywistości potwierdzonej audytem kodu. Zbierane jest wyłącznie: (1) dobrowolnie publikowana treść wpisu do "Wspólnej bazy doświadczeń" ("Inne treści użytkowników" / "Other User Content"), (2) pseudonimowy `contributorId` używany do liczenia postępu współtwórcy ("Identyfikatory urządzenia i inne" / "User ID") — oba: cel tylko "Funkcje aplikacji", zaznaczone jako powiązane z tożsamością (bezpieczniejsza, bardziej transparentna opcja), bez trackingu. Usunięto błędne wcześniejsze zaznaczenia (Wiadomości, Dzienniki błędów, Diagnostyka, Interakcje z aplikacją, Historia wyszukiwania) — w kodzie nie ma żadnej analityki ani crash reportingu. Oba sklepy: zmiany zapisane i opublikowane.
- 2026-09-13: dodano anonimową analitykę użycia — tabela `app_usage_events` (Supabase, tylko INSERT dla klienta, brak SELECT — odczyt wyłącznie przez Dashboard/SQL Editor), serwis `services/usageAnalytics.ts` (`logScreenOpen`), spięte z już istniejącym globalnym mechanizmem `markVisitedRoute` w `app/(tabs)/_layout.tsx` (reużyto `normalizeRoute` z `hooks/useVisitedTiles.ts`, teraz wyeksportowane). Śledzone tylko wybrane ekrany: `/`, `/plan-dnia`, `/dziennik-uczucia`, `/lista-wyzwalaczy`, `/dziennik-wdziecznosci`, `/liczniki`, `/licznik`, `/licznik-strat`, `/wsparcie-spolecznosc`, `/refleksje`, `/codzienne-refleksje`, `/moje-doswiadczenie`. Brak identyfikatora urządzenia/użytkownika — czyste liczniki otwarć. Przetestowane end-to-end (Playwright, realna nawigacja w apce, nie samo `page.goto`) — działa poprawnie tylko dla nawigacji w obrębie działającej apki (stack pozostaje zamontowany); bezpośredni "zimny" deep link prosto na dany URL może nie zostać zliczony, bo `(tabs)` wtedy się nie montuje — świadomie zaakceptowane ograniczenie, dotyczy marginalnego przypadku.
- 2026-09-13: dodano panel podglądu analityki — Edge Function `usage-analytics-summary` (agreguje `app_usage_events`, chroniona własnym tokenem `ANALYTICS_DASHBOARD_TOKEN`, odczyt kluczem service_role) + Artifact "Statystyki Anioła" (link w historii tej rozmowy) pokazujący ranking ekranów i trend dzienny. Artefakty Claude blokują bezpośredni `fetch` do zewnętrznych adresów (piaskownica CSP) — dane trafiają do wbudowanej bazy artefaktu (`capabilities: {db}`, dokument `stats/summary`), którą Claude odświeża na żądanie poleceniem `curl` do edge function + zapisem do bazy artefaktu. Strona subskrybuje ten dokument na żywo (`onSnapshot`), więc po każdym odświeżeniu przez Claude widok aktualizuje się automatycznie u wszystkich, którzy mają go otwartego. Do dodania jako ikona na Docku macOS (Safari/Chrome → dodaj do Docka / zainstaluj jako aplikację).
- 2026-05-03: zweryfikowano domenę `aniolstroz.com.pl` dla Android App Links i wystawiono `https://aniolstroz.com.pl/.well-known/assetlinks.json`.
- 2026-05-03: dodano konfigurację aplikacji dla wybranych ścieżek `https://aniolstroz.com.pl/app/*` w `app.json` oraz adapter `app/+native-intent.ts`.
- 2026-02-10: poprawiono modal podsumowania dnia (czytelniejszy układ, lepsza hierarchia i akcenty kolorystyczne).
- 2026-02-10: dodano rozwijaną sekcję instrukcji (`Pokaż instrukcję` / `Ukryj instrukcję`) z animacją rozsuwania.
