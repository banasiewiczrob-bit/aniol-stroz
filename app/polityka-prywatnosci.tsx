import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const BG = '#061A2C';
const SUB = 'rgba(232,245,255,0.84)';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function PolitykaPrywatnosciScreen() {
  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Polityka prywatności</Text>
        <Text style={styles.meta}>Anioł Stróż</Text>
        <Text style={styles.meta}>Data wejścia w życie: 26 lutego 2026</Text>

        <Section title="1. Zakres danych">
          <Text style={styles.text}>
            Aplikacja przetwarza dane wprowadzane przez użytkownika, w szczególności wpisy dzienników, plan dnia,
            ustawienia i preferencje. Aplikacja może także przetwarzać podstawowe dane techniczne urządzenia,
            wymagane do działania funkcji mobilnych.
          </Text>
        </Section>

        <Section title="2. Cel przetwarzania">
          <Text style={styles.text}>
            Dane są przetwarzane wyłącznie w celu działania aplikacji, zapisu postępów, personalizacji ustawień oraz
            realizacji przypomnień i powiadomień, jeśli użytkownik udzieli odpowiedniej zgody.
          </Text>
        </Section>

        <Section title="3. Miejsce przechowywania danych">
          <Text style={styles.text}>
            Dane użytkownika są zapisywane lokalnie na urządzeniu. Jeśli w przyszłości pojawią się funkcje chmurowe,
            zakres i zasady przetwarzania zostaną opisane w aktualizacji tej polityki.
          </Text>
        </Section>

        <Section title="4. Udostępnianie danych">
          <Text style={styles.text}>
            Dane nie są sprzedawane. Dane mogą być przekazywane wyłącznie podmiotom technicznym wspierającym
            utrzymanie aplikacji, gdy jest to niezbędne do jej działania oraz zgodne z obowiązującym prawem.
          </Text>
        </Section>

        <Section title="5. Uprawnienia użytkownika">
          <Text style={styles.text}>
            Użytkownik może zarządzać swoimi danymi z poziomu aplikacji, w tym usuwać wpisy i zmieniać zgody.
            Powiadomienia można wyłączyć w ustawieniach aplikacji i systemu urządzenia.
          </Text>
        </Section>

        <Section title="6. Bezpieczeństwo">
          <Text style={styles.text}>
            Stosowane są środki techniczne i organizacyjne, które mają chronić dane przed nieuprawnionym dostępem,
            utratą i nadużyciem.
          </Text>
        </Section>

        <Section title="7. Dzieci">
          <Text style={styles.text}>
            Aplikacja nie jest kierowana do dzieci poniżej 13. roku życia. Jeśli w przyszłości zakres grupy odbiorców
            ulegnie zmianie, polityka zostanie odpowiednio zaktualizowana.
          </Text>
        </Section>

        <Section title="8. Zmiany polityki">
          <Text style={styles.text}>
            Polityka prywatności może być aktualizowana. Aktualna wersja jest publikowana w aplikacji oraz na stronie
            informacyjnej aplikacji.
          </Text>
        </Section>

        <Section title="9. Kontakt">
          <Text style={styles.text}>
            W sprawach dotyczących prywatności należy kontaktować się adresem kontaktowym podanym na stronie
            aplikacji w sklepie.
          </Text>
        </Section>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingTop: 78, paddingBottom: 32 },
  title: { color: 'white', fontSize: 34, fontWeight: '800', marginBottom: 6 },
  meta: { color: SUB, fontSize: 14, lineHeight: 20, marginBottom: 2 },
  section: {
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.32)',
    padding: 14,
    marginTop: 12,
  },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  text: { color: SUB, fontSize: 15, lineHeight: 22 },
});
