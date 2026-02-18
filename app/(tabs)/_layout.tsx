import { Ionicons } from '@expo/vector-icons';
import { Tabs, router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFirstStepsState, resolveFirstStepsStep, subscribeFirstStepsChanges, type FirstStepsStep } from '@/hooks/useFirstSteps';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 0);
  const pathname = usePathname();
  const [firstStepsStep, setFirstStepsStep] = useState<FirstStepsStep | null>(null);
  const firstStepsDone = firstStepsStep === 'done';

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const state = await getFirstStepsState();
      const step = resolveFirstStepsStep(state);
      if (mounted) setFirstStepsStep(step);
    };

    void refresh();
    const unsubscribe = subscribeFirstStepsChanges(() => {
      void refresh();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const state = await getFirstStepsState();
      const step = resolveFirstStepsStep(state);
      if (mounted) {
        setFirstStepsStep(step);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!firstStepsStep || firstStepsStep === 'done') return;

    if (firstStepsStep === 'intro') {
      if (pathname !== '/intro') router.replace('/intro');
      return;
    }

    const requiredPath =
      firstStepsStep === 'consents'
        ? '/ustawienia'
        : firstStepsStep === 'contract'
          ? '/kontrakt'
          : firstStepsStep === 'counter'
            ? '/licznik'
            : '/licznik-nagrody';

    if (pathname !== requiredPath) {
      router.replace(requiredPath as any);
    }
  }, [firstStepsStep, pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#78C8FF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: '#071826',
          borderTopWidth: 1,
          borderTopColor: 'rgba(120,200,255,0.1)',
          height: 56 + tabBottomInset,
          paddingBottom: tabBottomInset,
          paddingTop: 6,
        },
      }}
    >
      {/* 1. GŁÓWNE IKONY */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dom',
          href: firstStepsDone ? undefined : null,
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ustawienia"
        options={{
          title: 'Ustawienia',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wsparcie"
        options={{
          title: 'Wsparcie',
          href: firstStepsDone ? undefined : null,
          tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={26} color={color} />,
        }}
      />

      {/* 2. BLOKADA TRÓJKĄCIKÓW - DOKŁADNE NAZWY Z TWOJEGO VS CODE */}
      <Tabs.Screen name="kontrakt" options={{ href: null }} />
      <Tabs.Screen name="plan-dnia" options={{ href: null }} />
      <Tabs.Screen name="licznik" options={{ href: null }} />
      <Tabs.Screen name="licznik-nagrody" options={{ href: null }} />
      <Tabs.Screen name="moje-doswiadczenie" options={{ href: null }} />
      
      {/* Pliki wsparcia (z przedrostkiem wsparcie- jak na Twoim screenie) */}
      <Tabs.Screen name="wsparcie-24" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-12-krokow" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-desiderata" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-halt" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-kontakt" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-modlitwa" options={{ href: null }} />
      <Tabs.Screen name="wsparcie-siatka" options={{ href: null }} />
      <Tabs.Screen name="spolecznosc/index" options={{ href: null }} />
      <Tabs.Screen name="spolecznosc/[groupId]" options={{ href: null }} />
      <Tabs.Screen name="spolecznosc/watek/[threadId]" options={{ href: null }} />
      <Tabs.Screen name="dzienniki" options={{ href: null }} />
      <Tabs.Screen name="teksty-codzienne" options={{ href: null }} />
      <Tabs.Screen name="zadania" options={{ href: null }} />
      <Tabs.Screen name="centrum-wsparcia" options={{ href: null }} />
    </Tabs>
  );
}
