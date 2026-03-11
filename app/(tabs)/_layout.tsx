import { Stack, router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { getFirstStepsState, subscribeFirstStepsChanges } from '@/hooks/useFirstSteps';
import { markVisitedRoute } from '@/hooks/useVisitedTiles';

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
    if (!onboardingRequired) return;
    if (pathname !== '/intro' && pathname !== '/ustawienia') {
      router.replace('/intro');
    }
  }, [onboardingRequired, pathname]);

  useEffect(() => {
    void markVisitedRoute(pathname);
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
