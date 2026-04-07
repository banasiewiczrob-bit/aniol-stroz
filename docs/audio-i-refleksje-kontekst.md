# Audio i refleksje - kontekst do osobnego czatu

Status: aktywny zestaw ustalen, zaktualizowany 2026-03-31

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

- `Codzienne refleksje` maja juz aktywny ekran w aplikacji z tytulem, odtwarzaczem i sekcja `Tekst refleksji`
- po kliknieciu `Odtworz` ekran przewija sie do tekstu, a tekst autoscrolluje lekko szybciej niz audio
- user nie widzi, ze wybor jest losowaniem; w UI jest to po prostu `Refleksja na dzis`
- wybor dziennej refleksji opiera sie na jednej stalej kolejce globalnej dla wszystkich userow, zeby wpisy nie lecialy blokami autorow i nurtow
- publiczny bucket Supabase `daily-reflections` ma obecnie pliki audio `01-01.m4a` do `01-59.m4a`
- manifest [daily-reflections.json](./daily-reflections.json) jest juz zsynchronizowany z Supabase i zawiera 59 aktywnych wpisow z tekstami
- techniczne ID typu `01-01`, `01-02` sa nazwami plikow i kluczami manifestu; nie sa pokazywane userowi jako daty
- archiwum pelnych 365 refleksji nadal nie jest jeszcze podpiete

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

1. Kontynuowac ten sam proces dla kolejnych nagran `01-60+`.
2. Po kazdej nowej paczce audio dopisac odpowiadajace teksty do [daily-reflections.json](./daily-reflections.json).
3. Wrzucic zaktualizowany manifest do `daily-reflections/manifests/daily-reflections.json`.
4. Docelowo rozszerzyc zestaw z 59 do pelnego roku `365 + bonus 29.02`.
5. Osobno przygotowac `app-audio-library.json` dla biblioteki audio poza refleksjami dziennymi.

## Jak kontynuowac pozniej bez odtwarzania ustalen

Najwazniejsze zalozenia na teraz:

- nie zmieniamy modelu UI `Refleksja na dzis`
- nie pokazujemy userowi zadnych technicznych informacji o manifestach, losowaniu ani Supabase
- kolejny krok to po prostu dokladanie nastepnych nagran i tekstow do juz dzialajacego manifestu
- zrodlem tekstow do pierwszej paczki bylo: `/Users/robert/Downloads/refleksje od kazdego pisarza.xlsx`
- jesli pojawia sie nowe audio, zachowujemy naming `01-33.m4a`, `01-34.m4a` itd. i dopisujemy matching wpisy do manifestu

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
