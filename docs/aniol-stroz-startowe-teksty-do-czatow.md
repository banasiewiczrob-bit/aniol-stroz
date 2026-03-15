# Aniol Stroz - startowe teksty do osobnych czatow

Status: aktualne na 2026-03-14

Ponizej sa gotowe teksty startowe do wklejenia do nowego czatu.
Kazdy z nich zaklada, ze wspolnym punktem odniesienia jest `docs/aniol-stroz-kontekst-do-czatow.md`.

## 1. Czat ogolny o produkcie i UX

```text
Pracujemy nad aplikacja Aniol Stroz.

Najpierw uwzglednij:
- docs/aniol-stroz-kontekst-do-czatow.md
- docs/logika-glosu-aplikacji.md
- app/intro.tsx
- app/(tabs)/(main)/index.tsx

Chce rozwijac produkt i UX bez odchodzenia od aktualnego tonu aplikacji.
Pamietaj:
- jezyk ma byc prosty, spokojny i bez zawstydzania
- aplikacja ma pomagac zaczac od jednej sensownej rzeczy
- nie chcemy mechanik presji, poganiania ani sztucznej motywacji

W tym czacie skupiamy sie tylko na produkcie, UX, flow, copy i decyzjach ekranowych.
```

## 2. Czat o codziennych refleksjach i audio

```text
Pracujemy nad codziennymi refleksjami i biblioteka audio dla aplikacji Aniol Stroz.

Najpierw uwzglednij:
- docs/aniol-stroz-kontekst-do-czatow.md
- docs/audio-i-refleksje-kontekst.md
- docs/codzienne-refleksje-plan.md
- docs/codzienne-refleksje-tytuly.md
- docs/codzienne-refleksje/README.md
- docs/biblioteka-audio-plan.md
- app/(tabs)/(main)/refleksje.tsx

Wazne:
- codzienne refleksje maja model 365 + bonus na 29.02
- ekran refleksji jest juz w aplikacji, ale audio nie jest jeszcze podpiete
- chcemy trzymac ton bliski, prosty i bez patosu
- nie wychodzimy poza temat refleksji, audio, manifestow, namingow plikow i podpiecia do aplikacji
```

## 3. Czat o planie dnia, onboardingu i inteligentnym wsparciu

```text
Pracujemy nad flow wejscia do aplikacji, planem dnia i inteligentnym wsparciem w Aniole Strozu.

Najpierw uwzglednij:
- docs/aniol-stroz-kontekst-do-czatow.md
- docs/logika-glosu-aplikacji.md
- app/intro.tsx
- components/FirstStepsRoadmap.tsx
- app/plan-dnia.tsx
- app/(tabs)/(main)/ustawienia.tsx
- hooks/useDailyPlanNotifications.ts
- hooks/useIntelligentSupportEngine.ts

Wazne:
- onboarding prowadzi przez kontrakt, licznik i ustawienia
- plan dnia ma pomagac rano i wieczorem bez presji
- inteligentne wsparcie ma byc delikatne, uczciwe i nieinwazyjne
- rozwiazania maja pasowac do aktualnej architektury lokalnej opartej o AsyncStorage
```

## 4. Czat o wsparciu, spolecznosci i bezpieczenstwie

```text
Pracujemy nad modulami wsparcia i spolecznosci aplikacji Aniol Stroz.

Najpierw uwzglednij:
- docs/aniol-stroz-kontekst-do-czatow.md
- docs/logika-glosu-aplikacji.md
- app/wsparcie.tsx
- app/wsparcie-siatka.tsx
- app/wsparcie-spolecznosc.tsx
- app/spolecznosc.tsx
- hooks/useCommunityForum.ts
- constants/community.ts

Wazne:
- siatka wsparcia korzysta z kontaktow telefonu po zgodzie usera
- Discord jest zewnetrzna spolecznoscia
- pokoj glowny i grupy w aplikacji sa lokalnym prototypem
- jezyk i funkcje maja dbac o bezpieczenstwo, prywatnosc i brak presji
```

## 5. Czat o publikacji, prywatnosci i App Store

```text
Pracujemy nad publikacja aplikacji Aniol Stroz i materialami do sklepu.

Najpierw uwzglednij:
- docs/aniol-stroz-kontekst-do-czatow.md
- app.json
- docs/polityka-prywatnosci.html
- app/polityka-prywatnosci.tsx
- app/(tabs)/(main)/ustawienia.tsx

Wazne:
- aplikacja ma wersje 1.0.0
- bundle id iOS i package Android to com.robert.aniolstroz
- aplikacja przechowuje dane glownie lokalnie
- ma lokalne powiadomienia i opcjonalny dostep do kontaktow
- odpowiedzi maja uwzgledniac realny stan produktu, a nie planowane funkcje jako gotowe
```

## Jak dobierac pliki do kolejnego czatu

- zawsze zaczynaj od `docs/aniol-stroz-kontekst-do-czatow.md`
- dobieraj tylko 4-8 najbardziej potrzebnych plikow do tematu
- gdy temat dotyczy tresci, dolacz dokumenty `docs/` przed kodem
- gdy temat dotyczy implementacji, dolacz odpowiedni ekran, hook i ewentualny plik stanu
