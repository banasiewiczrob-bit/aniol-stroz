import { BackButton, useSwipeHintInset } from '@/components/BackButton';
import { getSupportPaymentUrl, type SupportPaymentAmountKey } from '@/constants/support';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BG = '#061A2C';
const CARD_BG = 'rgba(12,38,62,0.78)';
const CARD_BORDER = 'rgba(159,216,255,0.32)';
const SUB = 'rgba(232,245,255,0.84)';
const NOTE = 'rgba(222,240,255,0.74)';
const ACCENT = '#FFE39B';
const ACCENT_BG = 'rgba(255,227,155,0.18)';
const ACCENT_BORDER = 'rgba(255,227,155,0.46)';
const Watermark = require('../assets/images/maly_aniol.png');

type SupportOption = {
  key: SupportPaymentAmountKey;
  label: string;
  hint: string;
};

const SUPPORT_OPTIONS: SupportOption[] = [
  { key: '10', label: '10 zł', hint: 'symboliczne wsparcie' },
  { key: '25', label: '25 zł', hint: 'na drobne koszty' },
  { key: '50', label: '50 zł', hint: 'mocniejsze wsparcie' },
  { key: 'custom', label: 'Dowolna kwota', hint: 'tyle, ile chcesz' },
];

const COST_ITEMS = [
  'miejsce na serwerze i utrzymanie techniczne',
  'rozwój aplikacji, poprawki i nowe wersje',
  'czas pracy potrzebny do budowania i dopracowywania całości',
] as const;

export default function WsparcieRozwojAplikacjiScreen() {
  const { swipeHintInset } = useSwipeHintInset();
  const [openingKey, setOpeningKey] = useState<SupportPaymentAmountKey | null>(null);

  const handleOpenPayment = async (amount: SupportPaymentAmountKey) => {
    const paymentUrl = getSupportPaymentUrl(amount);

    if (!paymentUrl) {
      Alert.alert(
        'Brak linku płatności',
        'Ustaw EXPO_PUBLIC_SUPPORT_PAYMENT_URL albo osobne linki EXPO_PUBLIC_SUPPORT_PAYMENT_URL_10 / 25 / 50 / CUSTOM.'
      );
      return;
    }

    try {
      setOpeningKey(amount);

      if (Platform.OS === 'web') {
        await Linking.openURL(paymentUrl);
        return;
      }

      await openBrowserAsync(paymentUrl, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    } catch (error) {
      console.error('Błąd otwierania płatności wsparcia:', error);
      Alert.alert('Błąd', 'Nie udało się otworzyć strony płatności. Spróbuj ponownie za chwilę.');
    } finally {
      setOpeningKey(null);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <BackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(56, swipeHintInset + 18) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Wesprzyj rozwój aplikacji</Text>
        <Text style={styles.subtitle}>
          Jeśli chcesz, możesz dorzucić swoją cegiełkę do dalszego rozwoju Anioła Stróża.
        </Text>

        <View style={styles.card}>
          <Image source={Watermark} resizeMode="contain" style={styles.cardWatermark} />
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Na co idzie takie wsparcie?</Text>
          <Text style={styles.cardIntro}>
            Utrzymanie aplikacji to realne koszty i czas, który regularnie dokładam do jej rozwoju.
          </Text>
          {COST_ITEMS.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wybierz kwotę wsparcia</Text>
          <Text style={styles.cardIntro}>
            Po kliknięciu otworzy się zewnętrzna strona płatności.
          </Text>
          <View style={styles.buttonsRow}>
            {SUPPORT_OPTIONS.map((option) => {
              const isOpening = openingKey === option.key;

              return (
                <Pressable
                  key={option.key}
                  style={({ pressed }) => [
                    styles.amountButton,
                    pressed && styles.amountButtonPressed,
                    isOpening && styles.amountButtonActive,
                  ]}
                  onPress={() => void handleOpenPayment(option.key)}
                >
                  <Text style={styles.amountLabel}>{option.label}</Text>
                  <Text style={styles.amountHint}>{isOpening ? 'otwieranie...' : option.hint}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            To dobrowolne wsparcie. Wpłata nie odblokowuje funkcji aplikacji.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  bgOrbA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 227, 155, 0.08)',
    top: -80,
    right: -90,
  },
  bgOrbB: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(154, 199, 255, 0.09)',
    bottom: 110,
    left: -80,
  },
  scroll: { flex: 1 },
  content: { padding: 18, paddingTop: 18, paddingBottom: 40 },
  title: { color: 'white', fontSize: 34, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: SUB, fontSize: 16, lineHeight: 24, marginBottom: 16 },
  card: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  cardWatermark: {
    position: 'absolute',
    right: -22,
    bottom: -26,
    width: 140,
    height: 140,
    opacity: 0.1,
    tintColor: 'white',
    transform: [{ rotate: '16deg' }],
  },
  cardAccent: {
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: ACCENT,
    marginBottom: 10,
  },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardIntro: { color: SUB, fontSize: 14, lineHeight: 21, marginBottom: 10 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: ACCENT,
    marginTop: 6,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  amountButton: {
    width: '48.5%',
    minHeight: 92,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    justifyContent: 'space-between',
  },
  amountButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  amountButtonActive: {
    borderColor: 'rgba(255,255,255,0.72)',
  },
  amountLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  amountHint: {
    marginTop: 8,
    color: SUB,
    fontSize: 13,
    lineHeight: 18,
  },
  noteCard: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  noteText: {
    color: NOTE,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
