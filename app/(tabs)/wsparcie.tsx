import { router } from 'expo-router';
import { CoJakSection } from '@/components/CoJakSection';
import { BackButton } from '@/components/BackButton';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type SupportRoute = {
  title: string;
  subtitle: string;
  route:
    | '/wsparcie-24'
    | '/wsparcie-12-krokow'
    | '/wsparcie-desiderata'
    | '/wsparcie-halt'
    | '/wsparcie-kontakt'
    | '/wsparcie-modlitwa'
    | '/wsparcie-siatka'
    | '/moje-doswiadczenie'
    | '/spolecznosc';
};

const ITEMS: SupportRoute[] = [
  { title: 'Właśnie dzisiaj', subtitle: '24 godziny i plan na dziś', route: '/wsparcie-24' },
  { title: '12 kroków', subtitle: 'Różne brzmienia kroków', route: '/wsparcie-12-krokow' },
  { title: 'HALT', subtitle: 'Hungry, Angry, Lonely, Tired', route: '/wsparcie-halt' },
  { title: 'Modlitwa o pogodę ducha', subtitle: 'Szybki dostęp do treści', route: '/wsparcie-modlitwa' },
  { title: 'Desiderata', subtitle: 'Tekst do codziennego czytania', route: '/wsparcie-desiderata' },
  { title: 'Siatka wsparcia', subtitle: 'Twoje kontakty pomocowe', route: '/wsparcie-siatka' },
  { title: 'Społeczność', subtitle: 'Grupy i forum wsparcia', route: '/spolecznosc' },
  { title: 'Kontakt', subtitle: 'Numery i szybkie akcje', route: '/wsparcie-kontakt' },
  { title: 'Napisz, co Ci pomaga', subtitle: 'Zapisz, co dziś przeżyłeś', route: '/moje-doswiadczenie' },
];

export default function WsparcieScreen() {
  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Wsparcie</Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="To baza treści i narzędzi pomocowych, do których możesz wracać codziennie."
          jak="Wybierz materiał, który teraz najbardziej Cię wspiera. Pracuj krok po kroku, bez pośpiechu."
        />
        <Text style={styles.subtext}>Wybierz materiał, z którego chcesz teraz skorzystać.</Text>

        {ITEMS.map((item) => (
          <Pressable
            key={item.route}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: item.route as any,
                params: { backTo: '/wsparcie' },
              })
            }
          >
            <View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071826' },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 30 },
  title: { color: 'white', fontSize: 39, fontWeight: '900', marginBottom: 10 },
  subtext: { color: 'rgba(255,255,255,0.76)', fontSize: 18, lineHeight: 26, marginBottom: 20 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.2)',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { color: 'white', fontSize: 21, fontWeight: '700' },
  cardSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 22, marginTop: 3 },
  arrow: { color: '#78C8FF', fontSize: 31, fontWeight: '700' },
});
