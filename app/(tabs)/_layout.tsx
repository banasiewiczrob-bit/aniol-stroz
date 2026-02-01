import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
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
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dom',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="licznik"
        options={{
          title: 'Licznik',
          tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wsparcie"
        options={{
          title: 'Wsparcie',
          tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}