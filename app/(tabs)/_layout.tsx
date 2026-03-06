import { Stack, router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { getFirstStepsState, resolveFirstStepsStep, subscribeFirstStepsChanges, type FirstStepsStep } from '@/hooks/useFirstSteps';
import { markVisitedRoute } from '@/hooks/useVisitedTiles';

export default function TabLayout() {
  const pathname = usePathname();
  const [firstStepsStep, setFirstStepsStep] = useState<FirstStepsStep | null>(null);

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
    if (__DEV__) return;
    if (!firstStepsStep || firstStepsStep === 'done') return;
    const requiredPath =
      firstStepsStep === 'consents'
        ? '/ustawienia'
        : firstStepsStep === 'contract'
          ? '/kontrakt'
          : '/licznik';

    if (pathname !== requiredPath) {
      router.replace(requiredPath as any);
    }
  }, [firstStepsStep, pathname]);

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
