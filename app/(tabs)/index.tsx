import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { TYPE } from "@/styles/typography";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { AnimatedAngel } from '@/components/AnimatedAngel';
import { BackgroundWrapper } from '@/components/BackgroundWrapper';

const { width } = Dimensions.get('window');

const TILE_BG = "rgba(255,255,255,0.05)";
const TILE_BORDER = "rgba(120,200,255,0.15)";
const SUB = "rgba(255,255,255,0.65)";
const SECTION = "rgba(255,255,255,0.85)";
const Watermark = require("../../assets/images/maly_aniol.png");

function Tile({ title, subtitle, to, disabled }: { title: string; subtitle?: string; to?: string; disabled?: boolean; }) {
  return (
    <Pressable
      onPress={() => { if (!disabled && to) router.push(to as any); }}
      style={({ pressed }) => [
        styles.tile,
        { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }
      ]}
    >
      <Image source={Watermark} style={styles.tileWatermark} />
      <View style={{ zIndex: 2 }}>
        <Text style={styles.tileTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.tileSubtitle}>{subtitle}</Text>}
      </View>
    </Pressable>
  );
}

export default function Dom() {
  const [showReward, setShowReward] = useState(false);
  const [rewardColor, setRewardColor] = useState('#FFD700');
  const [currentAnniversary, setCurrentAnniversary] = useState(0);

  const handleAcceptReward = async () => {
    try {
      const currentRewardsJSON = await AsyncStorage.getItem('unlockedAngels');
      let unlocked = currentRewardsJSON ? JSON.parse(currentRewardsJSON) : [];

      if (!unlocked.includes(currentAnniversary)) {
        unlocked.push(currentAnniversary);
        unlocked.sort((a: number, b: number) => a - b);
        await AsyncStorage.setItem('unlockedAngels', JSON.stringify(unlocked));
      }
      setShowReward(false);
      // Po akceptacji kierujemy na półkę, by zobaczyć nową nagrodę
      router.push('/(licznik)/licznik-nagrody');
    } catch (e) {
      console.error("Błąd zapisu nagrody:", e);
    }
  };

  useEffect(() => {
    const checkAnniversary = async () => {
      try {
        const savedDate = await AsyncStorage.getItem('startDate');
        if (!savedDate) return;

        const start = new Date(savedDate);
        const now = new Date();
        const diffInMs = now.getTime() - start.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        const lastShown = await AsyncStorage.getItem('lastRewardShown');

        // Automatyczne sprawdzanie Twoich progów
        if (diffInDays > 0 && lastShown !== diffInDays.toString()) {
          const thresholds = [1, 30, 60, 90, 180, 270];
          const isYearAnniversary = diffInDays >= 365 && diffInDays % 365 === 0;
          const shouldShow = thresholds.includes(diffInDays) || isYearAnniversary;

          if (shouldShow) {
            let color = "";
            if (diffInDays === 1) color = "#FFFFFF";    // Biały
            if (diffInDays === 30) color = "#FF8C00";   // Pomarańczowy
            if (diffInDays === 60) color = "#4CAF50";   // Zielony
            if (diffInDays === 90) color = "#a33b3b";   // Czerwony
            if (diffInDays === 180) color = "#808080";  // Szary
            if (diffInDays === 270) color = "#a5a562";  // Żółty
            if (isYearAnniversary) color = "#FFD700";   // Złoty

            setRewardColor(color);
            setCurrentAnniversary(diffInDays);
            setShowReward(true);
            await AsyncStorage.setItem('lastRewardShown', diffInDays.toString());
          }
        }
      } catch (e) {
        console.error("Błąd nagród:", e);
      }
    };
    checkAnniversary();
  }, []);

  return (
    <BackgroundWrapper>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Dom</Text>
        <Text style={styles.headerSubtitle}>
          ...to miejsce gdzie wszystko się zaczyna.{"\n"}
          Znajdziesz tu podstawowe narzędzia potrzebne w Twojej podróży ku zdrowieniu.
          A ja jestem tutaj, aby Cię wspierać na każdym etapie tej drogi.
        </Text>

        <Tile title="Kontrakt" subtitle="Umowa z samym sobą" to="/(kontrakt)/kontrakt" />
        <Tile title="Licznik zdrowienia" subtitle="Start zdrowienia i rocznice" to="/(licznik)/licznik" />
        <Tile title="Plan dnia" subtitle="Jedna rzecz na teraz" to="/(plan)/plan-dnia" />

        <View style={{ marginTop: 28 }}>
          <Text style={styles.sectionTitle}>Wsparcie</Text>
          <Tile title="Modlitwa o pogodę ducha" subtitle="kilka zwykłych słów" to="/(wsparcie)/wsparcie-modlitwa" />
          <Tile title="Desiderata" subtitle="słowa na spokojny dzień" to="/(wsparcie)/wsparcie-desiderata" />
          <Tile title="HALT" subtitle="Cztery ważne sprawy" to="/(wsparcie)/wsparcie-halt" />
          <Tile title="Właśnie dzisiaj" subtitle="program na 24 godziny" to="/(wsparcie)/wsparcie-24" />
          <Tile title="Siatka wsparcia" subtitle="Ludzie i kontakty" to="/(wsparcie)/wsparcie-siatka" />
          <Tile title="Kontakt" subtitle="Gdy potrzebujesz pomocy" to="/(wsparcie)/wsparcie-kontakt" />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      <Modal visible={showReward} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.rewardCard}>
            <Text style={styles.congratsText}>GRATULACJE!</Text>
            <Text style={styles.anniversaryText}>
              {currentAnniversary === 1 
                ? "Dziś jest Twój pierwszy krok" 
                : `To już ${currentAnniversary} dni Twojej drogi`}
            </Text>
            
            <View style={styles.angelContainer}>
              <AnimatedAngel color={rewardColor} size={100} />
            </View>

            <TouchableOpacity 
              style={[styles.closeButton, { borderColor: rewardColor }]} 
              onPress={handleAcceptReward}
            >
              <Text style={[styles.closeButtonText, { color: rewardColor }]}>Przyjmuję z wdzięcznością</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 18, paddingTop: 78 },
  headerTitle: { ...TYPE.h1, color: "white", marginBottom: 16 },
  headerSubtitle: { ...TYPE.body, color: "rgba(255,255,255,0.7)", marginBottom: 40 },
  sectionTitle: { ...TYPE.h2, color: SECTION, marginBottom: 16 },
  tile: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: TILE_BG,
    borderWidth: 1.5,
    borderColor: TILE_BORDER,
    marginBottom: 12,
    minHeight: 95,
    overflow: "hidden",
    position: "relative",
  },
  tileWatermark: {
    position: "absolute",
    right: 5,
    bottom: 2,
    width: 65,
    height: 65,
    opacity: 0.08,
    tintColor: "white",
    resizeMode: "contain",
    transform: [{ rotate: "10deg" }],
  },
  tileTitle: { ...TYPE.h3, color: "white" },
  tileSubtitle: { ...TYPE.bodySmall, marginTop: 6, color: SUB, width: '75%' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(7, 24, 38, 0.98)', justifyContent: 'center', alignItems: 'center' },
  rewardCard: { width: width * 0.85, alignItems: 'center', padding: 30, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  congratsText: { ...TYPE.h2, color: 'white' },
  anniversaryText: { ...TYPE.body, color: SUB, marginTop: 10, textAlign: 'center' },
  angelContainer: { marginVertical: 40, height: 150, justifyContent: 'center' },
  closeButton: { borderWidth: 1.5, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 20 },
  closeButtonText: { ...TYPE.bodySmall, fontFamily: TYPE.bodyStrong.fontFamily },
});
