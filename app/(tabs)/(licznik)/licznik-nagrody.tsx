import { AnimatedAngel } from '@/components/AnimatedAngel';
import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { TYPE } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

const { width } = Dimensions.get('window');
const APP_LOGO = require('../../../assets/images/ikona-z-logo2.png');
const WATERMARK = require('../../../assets/images/maly_aniol.png');
const COIN_BLUE = require('../../../assets/images/coin-blue.png');
const COIN_GREEN = require('../../../assets/images/coin-green.png');
const COIN_BRONZE = require('../../../assets/images/coin-bronze.png');
const COIN_SILVER = require('../../../assets/images/coin-silver.png');
const COIN_GOLD = require('../../../assets/images/coin-gold.png');

const STORAGE_START_DATE = 'startDate';

export default function LicznikNagrody() {
  const [yearsPassed, setYearsPassed] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [ymd, setYmd] = useState({ years: 0, months: 0, days: 0 });
  const coinBounce = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<any>(null);

  const loadRewards = useCallback(async () => {
    try {
      const savedDate = await AsyncStorage.getItem(STORAGE_START_DATE);
      if (savedDate) {
        const startDate = new Date(savedDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const years = Math.max(0, Math.floor(diffDays / 365));
        setStartDate(startDate);
        setYearsPassed(years);
        setYmd(calculateYmd(startDate, now));

      } else {
        setYearsPassed(0);
        setStartDate(null);
        setYmd({ years: 0, months: 0, days: 0 });
      }
    } catch (e) {
      console.error("Błąd ładowania półki:", e);
    }
  }, []);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  useFocusEffect(
    useCallback(() => {
      loadRewards();
    }, [loadRewards])
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(coinBounce, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(coinBounce, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [coinBounce]);

  const toRoman = (num: number) => {
    const map: Array<[number, string]> = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];
    let result = '';
    let n = num;
    for (const [value, symbol] of map) {
      while (n >= value) {
        result += symbol;
        n -= value;
      }
    }
    return result;
  };

  const getCoinAsset = (years: number) => {
    if (years >= 30) return { image: COIN_GOLD, glow: 'rgba(255, 215, 0, 0.7)' }; // złoto (30–39)
    if (years >= 20) return { image: COIN_SILVER, glow: 'rgba(192, 192, 192, 0.7)' }; // srebro (20–29)
    if (years >= 10) return { image: COIN_BRONZE, glow: 'rgba(205, 127, 50, 0.7)' }; // brąz (10–19)
    if (years >= 5) return { image: COIN_GREEN, glow: 'rgba(46, 204, 113, 0.6)' }; // zieleń (5–9)
    return { image: COIN_BLUE, glow: 'rgba(120, 200, 255, 0.6)' }; // błękit (1–4)
  };

  const calculateYmd = (start: Date, end: Date) => {
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    if (days < 0) {
      months -= 1;
      const lastMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return {
      years: Math.max(0, years),
      months: Math.max(0, months),
      days: Math.max(0, days),
    };
  };

  const handleShare = async () => {
    try {
      if (!viewShotRef.current) return;
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return;

      const uri = await captureRef(viewShotRef.current, {
        format: "png",
        quality: 0.9,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri);
    } catch (e) {
      console.error('Błąd udostępniania:', e);
    }
  };

  const startDateLabel = startDate ? startDate.toLocaleDateString('pl-PL') : '—';
  const ymdLabel = `${ymd.years} lat ${ymd.months} mies. ${ymd.days} dni`;

  return (
    <BackgroundWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Tutaj znajdziesz swoje rocznice</Text>
        <Text style={styles.subtitle}>Oto symbole na Twojej drodze zdrowienia. Bądź z nich dumny.</Text>

        <View ref={viewShotRef} collapsable={false} style={styles.shareCaptureCanvas}>
          <Image source={WATERMARK} style={styles.shareWatermark} resizeMode="contain" />
          <View style={styles.shareArea}>
            <Image source={APP_LOGO} style={styles.shareLogo} />
            <Text style={styles.shareTitle}>Moje rocznice</Text>
            <Text style={styles.shareSubtitle}>Anioł Stróż</Text>
            {yearsPassed < 1 ? (
              <View style={styles.shareAngel}>
                <AnimatedAngel color="#FFFFFF" size={120} />
                <Text style={styles.shareLabel}>Właśnie dzisiaj</Text>
              </View>
            ) : (
              <View style={styles.shareCoin}>
                <Image source={getCoinAsset(yearsPassed).image} style={styles.shareCoinIcon} />
                <Text style={styles.shareLabel}>{toRoman(Math.min(yearsPassed, 40))} lat</Text>
              </View>
            )}
            <View style={styles.shareMeta}>
              <Text style={styles.shareMetaBig}>{ymdLabel}</Text>
              <Text style={styles.shareMetaText}>Pierwszy dzień nowego życia to:</Text>
              <Text style={styles.shareMetaText}> {startDateLabel}</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={18} color="white" style={{ marginRight: 10 }} />
          <Text style={styles.shareBtnText}>Udostępnij swój sukces</Text>
        </Pressable>

        {null}
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, paddingTop: 60, alignItems: 'center' },
  title: { ...TYPE.h1, color: 'white', textAlign: 'center' },
  subtitle: { ...TYPE.body, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 40, textAlign: 'center' },
  shareCaptureCanvas: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#071826',
  },
  shareWatermark: {
    position: 'absolute',
    top: '28%',
    alignSelf: 'center',
    width: 260,
    height: 260,
    opacity: 0.06,
    tintColor: 'white',
    transform: [{ rotate: '-12deg' }],
  },
  shareArea: {
    width: '100%',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(120, 200, 255, 0.25)',
    backgroundColor: 'rgba(7,24,38,0.82)',
    alignItems: 'center',
  },
  shareLogo: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    opacity: 0.85,
    resizeMode: 'contain',
  },
  shareTitle: { ...TYPE.h2, color: 'white' },
  shareSubtitle: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: 4, marginBottom: 10 },
  shareAngel: { alignItems: 'center', paddingVertical: 10 },
  shareCoin: { alignItems: 'center', paddingVertical: 10 },
  shareCoinIcon: { width: 180, height: 180, resizeMode: 'contain' },
  shareLabel: { ...TYPE.h3, color: 'white', marginTop: 8 },
  shareMeta: { marginTop: 8, alignItems: 'center' },
  shareMetaBig: { ...TYPE.h2, color: 'white', marginBottom: 4 },
  shareMetaText: { ...TYPE.bodySmall, color: 'rgba(255,255,255,0.7)' },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: '#3b5998',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    justifyContent: 'center',
  },
  shareBtnText: { ...TYPE.button, color: 'white' },
  coinSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  coin: {
    width: 230,
    height: 230,
    borderRadius: 105,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coinIcon: {
    width: 280,
    height: 280,
    resizeMode: 'contain',
  },
  coinLabel: {
    ...TYPE.h3,
    marginTop: 10,
    color: 'white',
  },
});
