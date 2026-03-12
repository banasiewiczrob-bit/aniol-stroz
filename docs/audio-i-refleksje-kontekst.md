# Audio i refleksje - kontekst do osobnego czatu

Status: aktywny zestaw ustalen

## Co juz mamy

### Refleksje dzienne

- plan roczny: [codzienne-refleksje-plan.md](./codzienne-refleksje-plan.md)
- szkice 1-7 stycznia: [codzienne-refleksje-styczen-01-07.md](./codzienne-refleksje-styczen-01-07.md)
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
- docs/codzienne-refleksje-plan.md
- docs/codzienne-refleksje-styczen-01-07.md
- docs/codzienne-refleksje-plan.xlsx
- docs/biblioteka-audio-plan.md
- docs/biblioteka-audio-skrypty-01-10.md
- docs/audio-i-refleksje-kontekst.md

Ustalenia:
- refleksje dzienne: 365 + bonus 29.02
- publiczny bucket Supabase: daily-reflections
- prywatny bucket Supabase: app-audio-private
- daily-reflections ma foldery audio i manifests
- app-audio-private ma foldery single, series i manifests

W tym czacie zajmujemy sie tylko audio, refleksjami, manifestami, namingiem plikow, uploadem i podpieciem tego do aplikacji.
```
