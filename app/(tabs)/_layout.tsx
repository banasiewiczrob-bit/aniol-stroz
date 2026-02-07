import { Ionicons } from '@expo/vector-icons';
import { getOnboardingStep, OnboardingStep } from '@/utils/onboarding';
import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [step, setStep] = useState<OnboardingStep | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const nextStep = await getOnboardingStep();
      if (active) setStep(nextStep);
    })();
    return () => {
      active = false;
    };
  }, [segments.join('/')]);

  useEffect(() => {
    if (!step) return;
    const currentLeaf = segments[segments.length - 1] ?? '';
    if (step === 'contract' && currentLeaf !== 'kontrakt') {
      router.replace('/kontrakt');
      return;
    }
    if (step === 'startDate' && currentLeaf !== 'licznik') {
      router.replace('/licznik');
    }
  }, [router, segments, step]);

  if (!step) return <View style={{ flex: 1, backgroundColor: '#071826' }} />;
  const isLocked = step !== 'done';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#78C8FF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: isLocked
          ? { display: 'none' }
          : {
              backgroundColor: '#071826',
              borderTopWidth: 1,
              borderTopColor: 'rgba(120,200,255,0.1)',
              height: 65,
              paddingBottom: 10,
              paddingTop: 5,
            },
      }}
    >
      {/* 1. GŁÓWNE IKONY */}
      <Tabs.Screen
        name="index"
        options={{
          href: isLocked ? null : undefined,
          title: 'Dom',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="licznik"
        options={{
          href: step === 'contract' ? null : undefined,
          title: 'Licznik',
          tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wsparcie"
        options={{
          href: isLocked ? null : undefined,
          title: 'Wsparcie',
          tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={26} color={color} />,
        }}
      />

      {/* 2. BLOKADA TRÓJKĄCIKÓW - DOKŁADNE NAZWY Z TWOJEGO VS CODE */}
      <Tabs.Screen name="kontrakt" options={{ href: null }} />
      <Tabs.Screen name="plan-dnia" options={{ href: null }} />
      
      {/* Pliki wsparcia (z przedrostkiem wsparcie- jak na Twoim screenie) */}
      <Tabs.Screen name="wsparcie-24" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-desiderata" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-halt" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-kontakt" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-modlitwa" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-siatka" options={{ href: null }} />
    </Tabs>
  );
}
