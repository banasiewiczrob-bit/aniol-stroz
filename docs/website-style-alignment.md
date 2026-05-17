# Ujednolicenie strony z aplikacja Aniol Stroz

Stan na `2026-05-06`.

Ten dokument zbiera wnioski z dwoch miejsc:
- aplikacja w tym repo,
- live strona `https://aniolstroz.com.pl`.

Na podstawie HTML strony glownej z `2026-05-06` live serwis dziala na:
- WordPress,
- Kadence,
- Elementor,
- LiteSpeed Cache.

To oznacza, ze ujednolicenie mozna zrobic etapami, bez przepisywania wszystkiego od zera.

## 1. Co definiuje styl aplikacji

Najwazniejsze zrodla w repo:
- `components/BackgroundWrapper.tsx`
- `components/MenuSquareTile.tsx`
- `app/(tabs)/(main)/index.tsx`
- `app/wsparcie.tsx`
- `app/intro.tsx`
- `styles/typography.ts`
- `constants/ui.ts`

Najmocniejsze cechy wizualne aplikacji:
- ciemne, spokojne tlo w tonie granatowym,
- szklane, polprzezroczyste karty zamiast plaskich blokow,
- jasna typografia na ciemnym tle,
- miekkie swiatla i orbity w tle,
- kolorowe akcenty przypisane do funkcji,
- proste, bezpieczne CTA,
- duzo "oddechu", malo szumu.

## 2. Tokeny wizualne aplikacji

### Tlo i powierzchnie

- `#061A2C` - glowny granat tla
- `#071826` - ciemniejsza warstwa tla
- `rgba(12,38,62,0.78)` - karta / panel
- `rgba(255,255,255,0.05)` - delikatna powierzchnia pomocnicza
- `rgba(159,216,255,0.32)` - obrys kart
- `rgba(120,200,255,0.20)` - subtelny border / info panel

### Tekst

- `#FFFFFF` - glowny tekst i naglowki
- `rgba(232,245,255,0.86)` - tekst podstawowy na ciemnym tle
- `rgba(232,245,255,0.66)` - tekst pomocniczy
- `rgba(255,255,255,0.35)` - metadane / stopki

### Akcenty

- `#7ED9FF` - blekit glowny
- `#9AC7FF` - blekit spokojniejszy
- `#9EF3C7` - mieta / pomoc / wspolnota
- `#FFD18A` - bursztyn / plan / kontakt / wazne akcje
- `#FFC7D9` - roz / wsparcie emocjonalne
- `#C6B9FF` - lawenda / tresci / biblioteka
- `#4F7DA5` - badge / licznik / status

### Typografia

Aplikacja korzysta z `Inter`:
- regular,
- medium,
- semibold,
- bold.

Skala:
- display: `32 / 38`
- h1: `28 / 34`
- h2: `22 / 28`
- h3: `19 / 25`
- body: `16 / 24`
- bodySmall: `14 / 21`
- caption: `12 / 18`

## 3. Dlaczego live strona wyglada inaczej

Glowny rozdzwiek nie wynika z tresci, tylko z warstwy prezentacji:
- strona ma klasyczny wordpressowy rytm sekcji,
- aplikacja jest bardziej zanurzajaca i "opiekujaca",
- na stronie jest mniej spójnego systemu kart i akcentow,
- kolorystyka sekcji i CTA nie trzyma jednego jezyka,
- blog, podcasty, aplikacja i pozostale obszary nie wygladaja jak elementy jednego ekosystemu.

## 4. Kierunek ujednolicenia

Najbezpieczniejszy kierunek to nie "kopiowanie aplikacji 1:1", tylko przeniesienie jej jezyka wizualnego na web.

Polecam:
- zachowac ciemny shell calego serwisu,
- oprzec glowne sekcje o panele i karty,
- przypisac stale akcenty kolorystyczne do kategorii tresci,
- uproscic CTA i ich hierarchie,
- zrobic domyslny uklad bardziej modulowy niz "dlugie pasy sekcji".

## 5. Mapowanie sekcji strony na wzorce z aplikacji

### Home / landing

Hero:
- ciemne tlo,
- jeden mocny naglowek,
- 1 glowny CTA do aplikacji,
- 1 wtorny CTA do podcastow lub bloga,
- delikatna orbita / watermark w tle.

Sekcja ekosystemu:
- zamiast zwyklych kafli lub boxow: karty jak w aplikacji,
- kazda karta ma swoj akcent i mikro-opis,
- sugerowane stale kolory:
  - aplikacja: lawenda albo blekit,
  - podcasty: mieta,
  - blog: bursztyn,
  - spolecznosc: blekit spokojny,
  - sklep / wsparcie projektu: roz albo zloto.

Sekcja "poza aplikacja":
- grid kart zamiast luuznej listy blokow,
- blog i podcasty nie powinny wygladac jak osobne byty.

### Blog

Lista wpisow:
- ciemne tlo strony,
- kazdy wpis jako karta,
- wyrazny tytul, kategoria, data, lead,
- delikatny border i orbita jak w appce.

Pojedynczy wpis:
- nadal w shellu marki,
- czytelna szerokosc tekstu `68-74ch`,
- wiekszy line-height,
- mniej bocznych elementow rozpraszajacych,
- jeden jasny CTA po wpisie: aplikacja, podcast lub newsletter.

### Podcasty

Karty podcastow powinny wygladac jak zasoby wsparcia, nie jak osobna galeria:
- tytul,
- krotki opis stanu / potrzeby, w ktorej material pomaga,
- jasny CTA "Sluchaj",
- stale kolory akcentowe.

### Strony o aplikacji

Te strony powinny byc najblizej appce:
- ekranowe sekcje,
- szklane panele,
- uporzadkowane CTA,
- mniej zwyklej wordpressowej typografii.

## 6. Zasady systemowe do wdrozenia

### Kolory

W Kadence warto ustawic globalna palete pod aplikacje:
- palette 1: `#7ED9FF`
- palette 2: `#9AC7FF`
- palette 3: `#FFFFFF`
- palette 4: `rgba(232,245,255,0.86)`
- palette 5: `#071826`
- palette 6: `#061A2C`
- palette 7: `#0C263E`
- palette 8: `#9EF3C7`
- palette 9: `#FFD18A`

### Typografia

Na stronie najlepiej ustawic:
- font glowny: `Inter`,
- naglowki: `700` lub `800`,
- tekst: `400`,
- przyciski i etykiety: `600`.

### Promien i obrys

Polecane wartosci:
- promien kart: `18-24px`,
- obrys: `1px solid rgba(159,216,255,0.32)`,
- cienie: miekkie, szerokie, ale nie bardzo ciemne.

### Tla

Zamiast plaskiego koloru:
- glowny granat,
- 1-2 radialne pojasnienia,
- delikatne swiatlo w hero i przy kartach.

## 7. Minimalny plan wdrozenia na WordPress

### Wariant A: najszybszy

1. Wrzucic CSS z pliku `docs/aniolstroz-wordpress-overrides.css` do `Wyglad -> Dodatkowy CSS`.
2. W Kadence ustawic globalna palete i font `Inter`.
3. W Elementorze dodawac klasy:
   - `as-shell`
   - `as-hero`
   - `as-card`
   - `as-card--blue`
   - `as-card--mint`
   - `as-card--amber`
   - `as-card--rose`
   - `as-card--lavender`
   - `as-section-title`
   - `as-lead`

### Wariant B: lepszy

1. Child theme albo miejsce na stale custom CSS.
2. Jednoznaczne klasy dla hero, kart podcastow, bloga i CTA.
3. Drobne porzadki w strukturze sekcji, nie tylko stylach.

### Wariant C: docelowy

Jesli strona ma dalej rosnac jako blog + app + podcasty + inne materialy, docelowo warto:
- uporzadkowac template strony glownej,
- rozdzielic marketing, blog i zasoby audio,
- zrobic 1 wspolny design system dla web + app.

## 8. Co juz przygotowalem

Starter stylow znajduje sie w:
- `docs/aniolstroz-wordpress-overrides.css`

Plik robi trzy rzeczy:
- podmienia globalny nastroj strony na jezyk aplikacji,
- ustawia przyciski, pola, naglowki i shell serwisu,
- daje klasy pomocnicze do sekcji i kart w Elementorze.

## 9. Kolejny najlepszy krok

Jesli chcesz realnie wdrozyc to na stronie, najkrotsza droga jest taka:
- najpierw zastosowac ten CSS na stagingu albo w `Dodatkowy CSS`,
- potem przypisac klasy do 5-8 najwazniejszych sekcji home,
- na koncu poprawic szablon bloga i podcastow.

Jesli dostane repo strony albo eksport custom CSS / child theme, moge przejsc z poziomu rekomendacji do faktycznego wdrozenia.
