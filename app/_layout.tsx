import { Stack } from 'expo-router';
import { useDailyPlanNotifications } from '@/hooks/useDailyPlanNotifications';
import { useIntelligentSupportEngine } from '@/hooks/useIntelligentSupportEngine';
import { runMigrationsIfNeeded } from '@/hooks/useDataMigrations';
import { AppSettings, DEFAULT_APP_SETTINGS, loadAppSettings, subscribeAppSettingsChanges } from '@/hooks/useAppSettings';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

export const Array = {
  // To wymusza na routerze zachowanie statyczne, co często naprawia ten błąd
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [migrationsReady, setMigrationsReady] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  useDailyPlanNotifications();
  useIntelligentSupportEngine();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        await runMigrationsIfNeeded();
      } finally {
        if (mounted) setMigrationsReady(true);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const settings = await loadAppSettings();
      if (mounted) setAppSettings(settings);
    };
    void load();
    const unsubscribe = subscribeAppSettingsChanges((settings) => {
      setAppSettings(settings);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (!migrationsReady) {
    return null;
  }

  const uiScale = appSettings.textScale === 'small' ? 0.97 : appSettings.textScale === 'large' ? 1.04 : 1;
  const scaledWidth = viewportWidth / uiScale;
  const scaledHeight = viewportHeight / uiScale;

  return (
    <View style={styles.root}>
      <View style={[styles.scaleLayer, { transform: [{ scale: uiScale }], width: scaledWidth, height: scaledHeight }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
            animation: 'none',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="intro" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="kontrakt"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="licznik"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="licznik-nagrody"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="plan-dnia"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="teksty-codzienne"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="obserwatorium"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie-modlitwa"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie-24"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie-halt"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie-12-krokow"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie-desiderata"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie-kontakt"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie-siatka"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="moje-doswiadczenie"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie-spolecznosc"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie-spolecznosc/[groupId]"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="wsparcie-spolecznosc/watek/[threadId]"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="dziennik-uczucia"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="dziennik-kryzysu"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="dziennik-wdziecznosci"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="dziennik-uczucia-test"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="polityka-prywatnosci"
            options={{
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#061A2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleLayer: {
    flex: 1,
  },
});
