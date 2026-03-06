import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BG_CARD = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(120,200,255,0.2)';
const SUB = 'rgba(255,255,255,0.72)';

type RoutePath = '/dzienniki';

type TileItem = {
  title: string;
  subtitle: string;
  to: RoutePath;
};

const items: TileItem[] = [
  { title: 'Dzienniki', subtitle: 'Obserwatorium 365', to: '/dzienniki' },
];

function SectionTile({ title, subtitle, to }: TileItem) {
  return (
    <Pressable
      style={styles.tile}
      onPress={() =>
        router.push({
          pathname: to as any,
          params: { backTo: '/zadania' },
        })
      }
    >
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function ZadaniaScreen() {
  return (
    <BackgroundWrapper>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Obserwatorium 365</Text>
        <Text style={styles.subtitle}>Dzienniki.</Text>

        <View style={styles.card}>
          {items.map((item) => (
            <SectionTile key={item.title} {...item} />
          ))}
        </View>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { color: 'white', fontSize: 36, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: SUB, fontSize: 20, lineHeight: 28, marginBottom: 18 },
  card: {
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
  },
  tile: {
    borderWidth: 1,
    borderColor: 'rgba(120,200,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  tileTitle: { color: 'white', fontSize: 28, lineHeight: 34, fontWeight: '700' },
  tileSubtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 19, lineHeight: 26, marginTop: 4, fontWeight: '500' },
});
