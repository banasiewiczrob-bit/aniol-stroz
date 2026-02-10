import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type SupportRoute = {
  title: string;
  subtitle: string;
  route: '/wsparcie-24' | '/wsparcie-desiderata' | '/wsparcie-halt' | '/wsparcie-kontakt' | '/wsparcie-modlitwa' | '/wsparcie-siatka';
};

const ITEMS: SupportRoute[] = [
  { title: 'Wlasnie dzisiaj', subtitle: '24 godziny i plan na dzis', route: '/wsparcie-24' },
  { title: 'HALT', subtitle: 'Hungry, Angry, Lonely, Tired', route: '/wsparcie-halt' },
  { title: 'Modlitwa o pogode ducha', subtitle: 'Szybki dostep do tresci', route: '/wsparcie-modlitwa' },
  { title: 'Desiderata', subtitle: 'Tekst do codziennego czytania', route: '/wsparcie-desiderata' },
  { title: 'Siatka wsparcia', subtitle: 'Twoje kontakty pomocowe', route: '/wsparcie-siatka' },
  { title: 'Kontakt', subtitle: 'Numery i szybkie akcje', route: '/wsparcie-kontakt' },
];

export default function WsparcieScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Wsparcie</Text>
      <Text style={styles.subtext}>Wybierz material, z ktorego chcesz teraz skorzystac.</Text>

      {ITEMS.map((item) => (
        <Pressable key={item.route} style={styles.card} onPress={() => router.push(item.route)}>
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071826' },
  content: { padding: 18, paddingTop: 56, paddingBottom: 30 },
  title: { color: 'white', fontSize: 36, fontWeight: '900', marginBottom: 8 },
  subtext: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 18 },
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
  cardTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  cardSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 2 },
  arrow: { color: '#78C8FF', fontSize: 28, fontWeight: '700' },
});
