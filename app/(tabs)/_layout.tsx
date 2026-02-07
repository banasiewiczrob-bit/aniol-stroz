import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const extraBottom = 21;

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
          height: 60 + Math.max(insets.bottom + extraBottom, 8),
          paddingBottom: Math.max(insets.bottom + extraBottom, 8),
          paddingTop: 5,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
      }}
    >
      {/* 1. GŁÓWNE IKONY */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dom',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(licznik)/licznik"
        options={{
          title: 'Licznik',
          tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(wsparcie)/wsparcie"
        options={{
          title: 'Wsparcie',
          tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={26} color={color} />,
        }}
      />

      {/* 2. EKRANY UKRYTE - POPRAWIONE NAZWY Z LOGÓW */}
      <Tabs.Screen name="(wsparcie)/wsparcie-desiderata" options={{ href: null }} />
      <Tabs.Screen name="(licznik)/licznik-nagrody" options={{ href: null }} />
      <Tabs.Screen name="(wsparcie)/wsparcie-halt" options={{ href: null }} />
      <Tabs.Screen name="(wsparcie)/wsparcie-modlitwa" options={{ href: null }} />
      <Tabs.Screen name="(wsparcie)/wsparcie-24" options={{ href: null }} />
      <Tabs.Screen name="(wsparcie)/wsparcie-siatka" options={{ href: null }} />
      <Tabs.Screen name="(wsparcie)/wsparcie-kontakt" options={{ href: null }} />
      <Tabs.Screen name="(kontrakt)/kontrakt" options={{ href: null }} />
      <Tabs.Screen name="(plan)/plan-dnia" options={{ href: null }} />

    </Tabs>
  );
}
