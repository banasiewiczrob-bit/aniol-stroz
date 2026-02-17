import { CoJakSection } from '@/components/CoJakSection';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BG = '#071826';
const TILE_BG = 'rgba(255,255,255,0.05)';
const TILE_BORDER = 'rgba(120,200,255,0.22)';
const SUB = 'rgba(255,255,255,0.88)';
const SECTION = 'rgba(255,255,255,0.85)';

const Watermark = require('../assets/images/maly_aniol.png');

type RoutePath =
  | '/kontrakt'
  | '/licznik'
  | '/plan-dnia'
  | '/teksty-codzienne'
  | '/dzienniki'
  | '/centrum-wsparcia';

type DashboardTile = {
  title: string;
  subtitle?: string;
  to: RoutePath;
};

const allTiles: DashboardTile[] = [
  { title: 'Kontrakt', subtitle: 'Umowa z samym sobą', to: '/kontrakt' },
  { title: 'Licznik', subtitle: 'Start i rocznice', to: '/licznik' },
  { title: 'Plan dnia', subtitle: 'Plan i HALT', to: '/plan-dnia' },
  { title: 'Teksty codzienne', subtitle: 'Modlitwa, 24h, HALT, 12 kroków', to: '/teksty-codzienne' },
  { title: 'Obserwatorium 365', subtitle: 'Dzienniki', to: '/dzienniki' },
  { title: 'Wsparcie', subtitle: 'Siatka, społeczność, kontakt', to: '/centrum-wsparcia' },
];

function SquareTile({ title, subtitle, to }: DashboardTile) {
  return (
    <Pressable
      onPress={() => router.push(to as any)}
      style={({ pressed }) => [styles.squareTile, pressed && styles.tilePressed]}
    >
      <Image source={Watermark} resizeMode="contain" style={styles.tileWatermark} />
      <View style={styles.tileContent}>
        <Text
          style={styles.squareTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={styles.squareSubtitle}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Dom() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Dom</Text>
      <Text style={styles.headerSubtitle}>
        ...to miejsce, gdzie wszystko się zaczyna.{"\n"}
        Znajdziesz tu podstawowe narzędzia potrzebne w Twojej podróży ku zdrowieniu.
      </Text>

      <CoJakSection
        title="Opis i instrukcja"
        co="Jeśli dotarłeś tutaj i czytasz ten tekst, to znaczy, że masz za sobą już podpisanie kontraktu i ustawienie pierwszych kroków."
        jak="Wybierz kafel i przejdź dalej. Sekcje otwierają się w czytelnej, pojedynczej kolumnie."
      />

      <Text style={styles.sectionTitle}>Menu główne</Text>
      <View style={styles.grid}>
        {allTiles.map((item) => (
          <SquareTile key={item.title} {...item} />
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  headerTitle: { color: 'white', fontSize: 36, fontWeight: '800', marginBottom: 16 },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    marginBottom: 20,
  },
  sectionTitle: { color: SECTION, fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  squareTile: {
    width: '48.5%',
    aspectRatio: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: TILE_BG,
    borderWidth: 2,
    borderColor: TILE_BORDER,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  tilePressed: {
    opacity: 0.82,
  },
  tileWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 150,
    height: 150,
    opacity: 0.11,
    tintColor: 'white',
    transform: [{ rotate: '15deg' }],
  },
  tileContent: {
    zIndex: 2,
    flex: 1,
    justifyContent: 'space-between',
  },
  squareTitle: { color: 'white', fontSize: 22, lineHeight: 28, fontWeight: '700' },
  squareSubtitle: {
    marginTop: 8,
    color: SUB,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500',
  },
});
