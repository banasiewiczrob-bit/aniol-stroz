import { AnimatedAngel } from '@/components/AnimatedAngel';
import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { CoJakSection } from '@/components/CoJakSection';
import { markAnniversarySeen } from '@/hooks/useFirstSteps';
import { TYPE } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { captureRef } from 'react-native-view-shot';
import { Alert, Animated, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

const APP_LOGO = require('../assets/images/ikona-z-logo2.png');
const WATERMARK = require('../assets/images/maly_aniol.png');
const COIN_BLUE = require('../assets/images/coin-blue.png');
const COIN_GREEN = require('../assets/images/coin-green.png');
const COIN_BRONZE = require('../assets/images/coin-bronze.png');
const COIN_SILVER = require('../assets/images/coin-silver.png');
const COIN_GOLD = require('../assets/images/coin-gold.png');

const STORAGE_START_DATE = 'startDate';

export default function LicznikNagrody() {
  const [yearsPassed, setYearsPassed] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [ymd, setYmd] = useState({ years: 0, months: 0, days: 0 });
  const coinBounce = useRef(new Animated.Value(0)).current;
  const shareCardRef = useRef<View>(null);

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
      console.error('Błąd ładowania półki:', e);
    }
  }, []);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  useEffect(() => {
    void markAnniversarySeen();
  }, []);

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
      [1000, 'M'],
      [900, 'CM'],
      [500, 'D'],
      [400, 'CD'],
      [100, 'C'],
      [90, 'XC'],
      [50, 'L'],
      [40, 'XL'],
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
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
    if (years >= 30) return COIN_GOLD;
    if (years >= 20) return COIN_SILVER;
    if (years >= 10) return COIN_BRONZE;
    if (years >= 5) return COIN_GREEN;
    return COIN_BLUE;
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
    const startDateLabel = startDate ? startDate.toLocaleDateString('pl-PL') : '—';
    const ymdLabel = `${ymd.years} lat ${ymd.months} mies. ${ymd.days} dni`;
    const badgeLabel = yearsPassed < 1 ? 'Właśnie dzisiaj' : `${toRoman(Math.min(yearsPassed, 40))} lat`;
    const message = `Moje rocznice - Anioł Stróż\n${badgeLabel}\n${ymdLabel}\nPierwszy dzień nowego życia: ${startDateLabel}`;

    try {
      if (shareCardRef.current) {
        const imageUri = await captureRef(shareCardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        const canShareFiles = await Sharing.isAvailableAsync();
        if (canShareFiles) {
          await Sharing.shareAsync(imageUri, {
            mimeType: 'image/png',
            UTI: 'public.png',
            dialogTitle: 'Udostępnij swój sukces',
          });
          return;
        }

        await Share.share({ message, url: imageUri });
        return;
      }

      await Share.share({ message });
    } catch (e) {
      console.error('Błąd udostępniania:', e);
      Alert.alert('Nie udało się udostępnić', 'Spróbuj ponownie za chwilę.');
    }
  };

  const startDateLabel = startDate ? startDate.toLocaleDateString('pl-PL') : '—';
  const ymdLabel = `${ymd.years} lat ${ymd.months} mies. ${ymd.days} dni`;

  return (
    <BackgroundWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Tutaj znajdziesz swoje rocznice</Text>
        <CoJakSection
          title="Opis i instrukcja"
          co="Ten ekran zbiera Twoje rocznice i odznaki, 
          żeby wzmacniać Twoją motywację oraz poczucie postępu."
          jak="Sprawdź swoje rocznice i, jeśli chcesz, 
          udostępnij Swój sukces. To ma być wsparcie i ślad Twojej drogi. Poza tym to symbol, 
          że jesteś na dobrej drodze i że warto iść dalej. Gdy pokazujesz własne osiągnięcia, wtedy to pomaga także innym. Gratulacje!"
        />
        <Text style={styles.subtitle}>Pierwsze kroki: sprawdź swoje rocznice. Oto symbole na Twojej drodze zdrowienia.</Text>

        <View ref={shareCardRef} collapsable={false} style={styles.shareCaptureCanvas}>
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
              <Animated.View
                style={{
                  alignItems: 'center',
                  paddingVertical: 10,
                  transform: [{ translateY: coinBounce.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
                }}
              >
                <Image source={getCoinAsset(yearsPassed)} style={styles.shareCoinIcon} />
                <Text style={styles.shareLabel}>{toRoman(Math.min(yearsPassed, 40))} lat</Text>
              </Animated.View>
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
});
