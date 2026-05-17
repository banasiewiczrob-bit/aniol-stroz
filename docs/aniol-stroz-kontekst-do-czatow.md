# Aniol Stroz - kontekst do wszystkich czatow

Status: aktualne na 2026-05-17

To jest wspolny punkt startowy do kazdej osobnej rozmowy o projekcie `aniol-stroz`.
Najpierw czytaj ten plik, a dopiero potem dokladaj material specjalistyczny z wybranego obszaru.

## Czym jest aplikacja

- `Aniol Stroz` to polskojezyczna aplikacja mobilna wspierajaca codzienny proces zdrowienia.
- Glowna obietnica produktu: pomoc wrocic do siebie i zrobic jedna sensowna rzecz bez presji, wstydu i poczucia zaleglosci.
- Intro w aplikacji mowi: `Jestem Aniol Stroz. Bede Ci towarzyszyl w Twoim procesie zdrowienia.`
- Marka i komunikaty maja byc relacyjne, spokojne, uczciwe i proste.

## Glos produktu

Wspolna zasada dla wszystkich obszarow:

- aplikacja ma byc przyjazna dla uzytkownika
- nie zawstydza za przerwe, brak regularnosci ani gorszy dzien
- pomaga zaczac od jednej malej rzeczy tu i teraz
- nie buduje presji postepu, odblokowan i zaliczania
- teksty, CTA, push, badge i opisy maja zapraszac, a nie poganiac

Zrodlo zasad:

- `docs/logika-glosu-aplikacji.md`

## Obecny stan produktu

Glowne wejscie do aplikacji:

- intro
- pierwsze kroki: kontrakt, licznik startu, ustawienia i zgody
- po onboardingu glowny ekran `Dom`

Glowne moduly widoczne z ekranu `Dom`:

- `Kontrakt` - umowa z samym soba
- `Liczniki` - data startu, rocznice i bilans
- `Plan dnia` - plan na dzis, HALT, poranne i wieczorne domkniecie
- `Teksty codzienne` - modlitwa, `Wlasnie dzisiaj`, HALT, 12 krokow, Desiderata, codzienne refleksje
- `Obserwatorium 365` - dzienniki i lista wyzwalaczy
- `Wsparcie` - siatka wsparcia, spolecznosc, kontakt, lista sposobow ktore pomagaja

Wazna uwaga namingowa:

- nazwa techniczna projektu i slug to `aniol-stroz`
- nazwa wyswietlana aplikacji to `Dzień po dniu. Anioł Stróż`

## Co dziala teraz

- onboarding i mapa pierwszych krokow
- kontrakt i licznik startu
- plan dnia z kalendarzem, podsumowaniem dnia i archiwum
- lokalne przypomnienia planu dnia przez `expo-notifications`
- dzienniki: uczucia, kryzys/glod, wdziecznosc, lista wyzwalaczy
- inteligentne podpowiedzi wsparcia oparte o lokalne dane z planu i dziennikow
- siatka wsparcia z importem kontaktow z telefonu
- ekran spolecznosci Discord oraz lokalny prototyp pokoju glownego i grup tematycznych
- ustawienia, zgody, reset danych i migracje lokalnych danych
- codzienne refleksje z odtwarzaniem audio przez `expo-audio`, tekstem refleksji, ulubionymi i udostepnianiem
- pobieranie manifestu refleksji z publicznego bucketu Supabase z cache lokalnym i fallbackiem
- ekran ulubionych refleksji
- lokalny eksport/import kopii danych aplikacji
- opcjonalny szyfrowany backup w chmurze Supabase za flaga `EXPO_PUBLIC_ENABLE_CLOUD_BACKUP=true`
- modul `Napisz, co Ci pomaga` / `moje-doswiadczenie` z anonimowym wkladem do wspolnej bazy doswiadczen, postepem i odznakami
- ekran dobrowolnego wsparcia rozwoju aplikacji przez zewnetrzne linki platnosci
- deep links / App Links dla `https://aniolstroz.com.pl/app/*`

## Co jest jeszcze w trakcie albo jako placeholder

- pelne archiwum 365 refleksji nie jest jeszcze podpiete jako kompletna biblioteka w aplikacji
- biblioteka audio jest opisana produktowo w dokumentach, ale nie jest jeszcze podpieta w aplikacji
- premium ma tryb testowy `tester_preview`; platnosci i finalny paywall nie sa jeszcze wdrozone
- spolecznosc w aplikacji jest lokalnym prototypem opartym o `AsyncStorage`, a zewnetrzna spolecznosc dziala na Discordzie
- backup w chmurze jest za flaga srodowiskowa i wymaga wdrozonych RPC w Supabase

## Architektura i technologia

- Expo / React Native / TypeScript
- `expo` `~54.0.34`
- `react` `19.1.0`
- `react-native` `0.81.5`
- routing: `expo-router`
- dane sa trzymane glownie lokalnie w `AsyncStorage`
- powiadomienia: `expo-notifications`
- kontakty: `expo-contacts`
- audio: `expo-audio`
- backup plikowy: `expo-file-system` + `expo-sharing`

Dane aplikacji na 2026-05-17:

- wersja aplikacji: `1.0.2`
- iOS bundle id: `com.robert.aniolstroz`
- Android package: `com.robert.aniolstroz`
- Expo owner: `banasiewicz.rob`
- EAS project id: `0675cfe9-9986-4706-b4a2-64b75c2c9f8e`
- scheme: `aniol-stroz`
- domena App Links / Universal Links: `aniolstroz.com.pl`, sciezki `/app/*`

## Zewnetrzne integracje i granice

- Discord invite jest czytany z `EXPO_PUBLIC_DISCORD_INVITE_URL`
- kontakty telefonu sa opcjonalne i wymagaja zgody systemowej
- lokalne powiadomienia wymagaja zgody uzytkownika
- codzienne refleksje sa pobierane z publicznego bucketu Supabase `daily-reflections`
- manifest refleksji jest pod `daily-reflections/manifests/daily-reflections.json`
- domyslny projekt Supabase w kodzie: `https://dqblnmimbqsmmzjzzrjr.supabase.co`
- anonimowy wklad do bazy doswiadczen i postep autora korzystaja z RPC / tabel Supabase
- opcjonalny backup w chmurze korzysta z RPC `zapisz_kopie_zapasowa_aplikacji` i `pobierz_kopie_zapasowa_aplikacji`
- linki platnosci wsparcia sa czytane z `EXPO_PUBLIC_SUPPORT_PAYMENT_URL*`

## Najwazniejsze pliki referencyjne

Produkt i ton:

- `docs/logika-glosu-aplikacji.md`
- `app/intro.tsx`
- `app/(tabs)/(main)/index.tsx`

Onboarding, ustawienia, dane lokalne:

- `components/FirstStepsRoadmap.tsx`
- `app/(tabs)/(main)/ustawienia.tsx`
- `hooks/useAppSettings.ts`
- `hooks/useDataMigrations.ts`

Plan dnia i inteligentne wsparcie:

- `app/plan-dnia.tsx`
- `hooks/useDailyPlanNotifications.ts`
- `hooks/useIntelligentSupportEngine.ts`

Tresci codzienne i refleksje:

- `app/teksty-codzienne.tsx`
- `app/(tabs)/(main)/refleksje.tsx`
- `app/ulubione-refleksje.tsx`
- `services/dailyReflections.ts`
- `docs/codzienne-refleksje-plan.md`
- `docs/codzienne-refleksje-tytuly.md`
- `docs/codzienne-refleksje/README.md`
- `docs/audio-i-refleksje-kontekst.md`
- `docs/biblioteka-audio-plan.md`

Obserwatorium, wsparcie i spolecznosc:

- `app/obserwatorium.tsx`
- `app/wsparcie.tsx`
- `app/wsparcie-siatka.tsx`
- `app/wsparcie-spolecznosc.tsx`
- `app/spolecznosc.tsx`
- `hooks/useCommunityForum.ts`
- `constants/community.ts`
- `app/moje-doswiadczenie.tsx`
- `services/experienceSubmissions.ts`
- `services/experienceCommunity.ts`

Prywatnosc i publikacja:

- `docs/polityka-prywatnosci.html`
- `app/polityka-prywatnosci.tsx`
- `app.json`
- `services/appBackup.ts`
- `services/cloudBackup.ts`

## Jak korzystac z tego pliku w nowym czacie

- zawsze zaczynaj od tego pliku
- potem dokladaj tylko te pliki, ktore sa potrzebne do konkretnego tematu
- trzymaj odpowiedzi po polsku, w tonie spokojnym i bez zawstydzania
- nie zakladaj backendu ani integracji, ktorych jeszcze nie ma w repo
- jesli temat dotyczy refleksji lub audio, dolacz `docs/audio-i-refleksje-kontekst.md`
- jesli temat dotyczy App Store, prywatnosci albo publikacji, dolacz `app.json` i `docs/polityka-prywatnosci.html`
