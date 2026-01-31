import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";

export default function AppEntry() {
  // 0: cisza, 1: slogan górą, 2: logo, 3: tytuł i opis, 4: stopka
  const [phase, setPhase] = useState(0);

  const fadeTop = useRef(new Animated.Value(0)).current;
  const fadeLogo = useRef(new Animated.Value(0)).current;
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const fadeFooter = useRef(new Animated.Value(0)).current;

  const logoScale = useRef(new Animated.Value(0.98)).current;

  const goNext = () => {
    router.replace("/(tabs)");
  };

  const timings = useMemo(() => {
    return {
      silence: 1800,
      top: 1400,
      logo: 1600,
      title: 1600,
      footer: 1400,
      exit: 400,
    };
  }, []);

  useEffect(() => {
    const t0 = setTimeout(() => setPhase(1), timings.silence);
    const t1 = setTimeout(() => setPhase(2), timings.silence + timings.top);
    const t2 = setTimeout(() => setPhase(3), timings.silence + timings.top + timings.logo);
    const t3 = setTimeout(() => setPhase(4), timings.silence + timings.top + timings.logo + timings.title);

    const t4 = setTimeout(() => {
      goNext();
    }, timings.silence + timings.top + timings.logo + timings.title + timings.footer + timings.exit);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [timings]);

  useEffect(() => {
    if (phase >= 1) {
      Animated.timing(fadeTop, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }).start();
    }

    if (phase >= 2) {
      Animated.parallel([
        Animated.timing(fadeLogo, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(logoScale, {
              toValue: 1.02,
              duration: 1200,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.quad),
            }),
            Animated.timing(logoScale, {
              toValue: 0.98,
              duration: 1200,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.quad),
            }),
          ])
        ),
      ]).start();
    }

    if (phase >= 3) {
      Animated.timing(fadeTitle, {
        toValue: 1,
        duration: 850,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }).start();
    }

    if (phase >= 4) {
      Animated.timing(fadeFooter, {
        toValue: 1,
        duration: 850,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }).start();
    }
  }, [phase]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0B1B2B",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <StatusBar barStyle="light-content" />

      {/* Pomiń intro */}
      <Pressable
        onPress={goNext}
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? 58 : 24,
          right: 18,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.10)",
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" }}>
          Pomiń intro
        </Text>
      </Pressable>

      {/* Góra: NIE PIJĘ • NIE BIORĘ */}
      <Animated.View
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? 120 : 90,
          opacity: fadeTop,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 14,
            letterSpacing: 3,
            fontWeight: "700",
          }}
        >
          NIE PIJĘ • NIE BIORĘ
        </Text>
      </Animated.View>

      {/* Logo */}
      <Animated.View
        style={{
          opacity: fadeLogo,
          transform: [{ scale: logoScale }],
          width: 120,
          height: 120,
          borderRadius: 60,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
  <Image
  source={require("./assets/images/logo-aniol-stroz.png")}
  style={{ width: 120, height: 120, borderRadius: 60 }}
  resizeMode="cover"
/>
      </Animated.View>

      {/* Tytuł + opis */}
      <Animated.View style={{ opacity: fadeTitle, alignItems: "center" }}>
        <Text
          style={{
            color: "rgba(255,255,255,0.95)",
            fontSize: 44,
            fontWeight: "800",
            textAlign: "center",
            letterSpacing: 0.2,
          }}
        >
          Anioł Stróż
        </Text>

        <Text
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 18,
            fontWeight: "600",
            textAlign: "center",
            marginTop: 10,
            lineHeight: 24,
          }}
        >
          aplikacja wspierająca proces{"\n"}zdrowienia
        </Text>
      </Animated.View>

      {/* Stopka: Robert Banasiewicz + ® */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: Platform.OS === "ios" ? 44 : 26,
          opacity: fadeFooter,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" }}>
          Robert Banasiewicz
        </Text>

        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.35)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700" }}>
            R
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}