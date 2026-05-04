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

## Uzgodnione zachowanie (Plan dnia)
- Po `Podsumuj dzień`:
  - wpis trafia do archiwum,
  - pola bieżącego dnia są czyszczone,
  - plan jest gotowy na nowy dzień.

## Notatki zmian
- 2026-05-03: zweryfikowano domenę `aniolstroz.com.pl` dla Android App Links i wystawiono `https://aniolstroz.com.pl/.well-known/assetlinks.json`.
- 2026-05-03: dodano konfigurację aplikacji dla wybranych ścieżek `https://aniolstroz.com.pl/app/*` w `app.json` oraz adapter `app/+native-intent.ts`.
- 2026-02-10: poprawiono modal podsumowania dnia (czytelniejszy układ, lepsza hierarchia i akcenty kolorystyczne).
- 2026-02-10: dodano rozwijaną sekcję instrukcji (`Pokaż instrukcję` / `Ukryj instrukcję`) z animacją rozsuwania.
