# Audio i refleksje - kontekst do osobnego czatu

Status: aktywny zestaw ustalen, zaktualizowany 2026-03-14

Ten plik jest kontekstem specjalistycznym.
Wspolny kontekst dla wszystkich rozmow o projekcie jest tutaj:

- [aniol-stroz-kontekst-do-czatow.md](./aniol-stroz-kontekst-do-czatow.md)

## Co juz mamy

### Refleksje dzienne

- plan roczny: [codzienne-refleksje-plan.md](./codzienne-refleksje-plan.md)
- same tytuly: [codzienne-refleksje-tytuly.md](./codzienne-refleksje-tytuly.md)
- pelny rok: [codzienne-refleksje/README.md](./codzienne-refleksje/README.md)
- szkice 1-7 stycznia: [codzienne-refleksje-styczen-01-07.md](./codzienne-refleksje-styczen-01-07.md)
- zmiany tytulow: [codzienne-refleksje-zmiany-tytulow.md](./codzienne-refleksje-zmiany-tytulow.md)
- excel roboczy: [codzienne-refleksje-plan.xlsx](./codzienne-refleksje-plan.xlsx)

Model:
- 365 refleksji na zwykly rok
- bonus na 29.02

Format jednej refleksji:
- tytul
- jedno zdanie otwarcia
- krotka refleksja
- pytanie do siebie
- maly krok na dzis
- domkniecie

### Biblioteka audio

- plan biblioteki: [biblioteka-audio-plan.md](./biblioteka-audio-plan.md)
- skrypty 1-10: [biblioteka-audio-skrypty-01-10.md](./biblioteka-audio-skrypty-01-10.md)

### Glos i stan produktu

- zasady tonu: [logika-glosu-aplikacji.md](./logika-glosu-aplikacji.md)
- wejscie do ekranu: [../app/codzienne-refleksje.tsx](../app/codzienne-refleksje.tsx)
- UI ekranu: `app/(tabs)/(main)/refleksje.tsx`

Obecny stan:

- `Codzienne refleksje` maja juz material redakcyjny i dedykowany ekran w aplikacji
- ekran pokazuje placeholder `Posluchaj refleksji (wkrotce)`
- archiwum 365 jest zapowiedziane w UI, ale nie jest jeszcze podpiete
- to oznacza, ze tresc i model publikacji sa juz gotowe, ale delivery audio nadal czeka na wdrozenie

Model:
- to nie ma byc zwykly podcast w tle
- to ma byc biblioteka audio do konkretnego stanu usera

Glowne kategorie:
- na trudny moment
- na rano
- na wieczor
- gdy wraca glod / impuls
- gdy jestem sam / w napieciu

## Supabase - obecny uklad

### Bucket publiczny

`daily-reflections`

Struktura:

```text
daily-reflections/
  audio/
  manifests/
```

Cel:
- codzienne refleksje przypisane do dni roku

### Bucket prywatny

`app-audio-private`

Struktura:

```text
app-audio-private/
  single/
  series/
  manifests/
```

Cel:
- biblioteka audio tylko dla aplikacji

Proponowane podfoldery w `single/`:
- `trudny-moment`
- `rano`
- `wieczor`
- `glod-impuls`
- `samotnosc-napiecie`

## Ustalenia techniczne

- nazwy techniczne bez spacji i bez polskich znakow
- codzienne refleksje: pliki typu `01-01.m4a`
- prywatne audio: nazwy slugowe typu `gdy-wraca-glod.m4a`
- na start nagrywanie w Audacity jest OK
- audio lepiej trzymac poza buildem appki
- aplikacja ma pobierac audio zdalnie i lokalnie cache'owac

## Wspolne zasady dla tego obszaru

- trzymamy ton bliski, prosty i bez patosu
- jedna refleksja ma miec jedna mysl, jedno pytanie i jeden maly krok
- biblioteka audio nie ma byc podcastem "do tla", tylko pomoca do konkretnego stanu
- nie opisujemy jeszcze funkcji jako wdrozonych, jesli w aplikacji sa na etapie `wkrotce`

## Co jest do zrobienia dalej

1. Nagrac pierwsze pliki audio.
2. Wrzucic pierwsze nagrania do odpowiednich bucketow.
3. Przygotowac `daily-reflections.json`.
4. Przygotowac `app-audio-library.json`.
5. Podpiac to w aplikacji.

## Tekst startowy do nowego czatu

Mozesz zaczac nowy czat od wklejenia tego:

```text
Pracujemy tylko nad refleksjami dziennymi i biblioteka audio.

Aktualne materialy w repo:
- docs/aniol-stroz-kontekst-do-czatow.md
- docs/codzienne-refleksje-plan.md
- docs/codzienne-refleksje-tytuly.md
- docs/codzienne-refleksje/README.md
- docs/codzienne-refleksje-styczen-01-07.md
- docs/codzienne-refleksje-plan.xlsx
- docs/codzienne-refleksje-zmiany-tytulow.md
- docs/biblioteka-audio-plan.md
- docs/biblioteka-audio-skrypty-01-10.md
- docs/audio-i-refleksje-kontekst.md
- docs/logika-glosu-aplikacji.md
- app/(tabs)/(main)/refleksje.tsx

Ustalenia:
- refleksje dzienne: 365 + bonus 29.02
- publiczny bucket Supabase: daily-reflections
- prywatny bucket Supabase: app-audio-private
- daily-reflections ma foldery audio i manifests
- app-audio-private ma foldery single, series i manifests
- ekran refleksji w aplikacji juz istnieje, ale audio i archiwum sa jeszcze niepodpiete

W tym czacie zajmujemy sie tylko audio, refleksjami, manifestami, namingiem plikow, uploadem i podpieciem tego do aplikacji.
```
