import { Stack, router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { getFirstStepsState, subscribeFirstStepsChanges } from '@/hooks/useFirstSteps';
import { markVisitedRoute, normalizeRoute } from '@/hooks/useVisitedTiles';
import { logScreenOpen } from '@/services/usageAnalytics';

const TRACKED_USAGE_ROUTES = new Set([
  '/plan-dnia',
  '/dziennik-uczucia',
  '/lista-wyzwalaczy',
  '/dziennik-wdziecznosci',
  '/licznik',
  '/licznik-strat',
  '/wsparcie-spolecznosc',
  '/refleksje',
  '/codzienne-refleksje',
  '/moje-doswiadczenie',
]);

export default function TabLayout() {
  const pathname = usePathname();
  const [onboardingRequired, setOnboardingRequired] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const state = await getFirstStepsState();
      if (mounted) setOnboardingRequired(!state.firstStepsDone);
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
      if (mounted) {
        setOnboardingRequired(!state.firstStepsDone);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    if (!onboardingRequired) return;
    if (pathname === '/intro' || pathname === '/ustawienia') return;

    const run = async () => {
      const state = await getFirstStepsState();
      if (!mounted) return;
      if (state.firstStepsDone) {
        setOnboardingRequired(false);
        return;
      }
      router.replace('/intro');
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [onboardingRequired, pathname]);

  useEffect(() => {
    void markVisitedRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    const normalized = normalizeRoute(pathname);
    if (normalized && TRACKED_USAGE_ROUTES.has(normalized)) {
      void logScreenOpen(normalized);
    }
  }, [pathname]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        animation: 'none',
      }}
    >
      <Stack.Screen name="(main)" />
    </Stack>
  );
}
