import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SOFT_BADGE_BG, SOFT_BADGE_TEXT } from '@/constants/ui';
import { getFirstStepsState, resolveFirstStepsStep, subscribeFirstStepsChanges } from '@/hooks/useFirstSteps';
import { useAppIconBadge } from '@/hooks/useAppIconBadge';
import { usePendingTasksBadge } from '@/hooks/usePendingTasksBadge';
import { loadAppSettings, subscribeAppSettingsChanges } from '@/hooks/useAppSettings';

export default function MainTabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 0);
  const [firstStepsDone, setFirstStepsDone] = useState(false);
  const [badgeIndicatorsEnabled, setBadgeIndicatorsEnabled] = useState(false);
  const pendingTasksBadge = usePendingTasksBadge(badgeIndicatorsEnabled);
  useAppIconBadge(firstStepsDone && badgeIndicatorsEnabled ? pendingTasksBadge.total : 0);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const settings = await loadAppSettings();
      if (mounted) {
        setBadgeIndicatorsEnabled(settings.badgeIndicatorsEnabled);
      }
    };
    void refresh();
    const unsubscribe = subscribeAppSettingsChanges((settings) => {
      setBadgeIndicatorsEnabled(settings.badgeIndicatorsEnabled);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const state = await getFirstStepsState();
      const done = resolveFirstStepsStep(state) === 'done';
      if (mounted) {
        setFirstStepsDone(done);
      }
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dom',
          href: firstStepsDone ? undefined : null,
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
          tabBarBadge:
            firstStepsDone && badgeIndicatorsEnabled && pendingTasksBadge.total > 0
              ? pendingTasksBadge.total > 99
                ? '99+'
                : pendingTasksBadge.total
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: SOFT_BADGE_BG,
            color: SOFT_BADGE_TEXT,
            fontSize: 11,
            fontWeight: '800',
          },
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
        name="refleksje"
        options={{
          title: 'Codzienne refleksje',
          href: null,
          tabBarIcon: ({ color }) => <Ionicons name="mic-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen name="dzienniki" options={{ href: null }} />
      <Tabs.Screen name="(flow)" options={{ href: null, popToTopOnBlur: true }} />
      <Tabs.Screen name="(flow-kontrakt)" options={{ href: null, popToTopOnBlur: true }} />
      <Tabs.Screen name="(flow-licznik)" options={{ href: null, popToTopOnBlur: true }} />
      <Tabs.Screen name="(flow-plan)" options={{ href: null, popToTopOnBlur: true }} />
      <Tabs.Screen name="(flow-teksty)" options={{ href: null, popToTopOnBlur: true }} />
      <Tabs.Screen name="(flow-obserwatorium)" options={{ href: null, popToTopOnBlur: true }} />
      <Tabs.Screen name="(flow-wsparcie)" options={{ href: null, popToTopOnBlur: true }} />
    </Tabs>
  );
}
