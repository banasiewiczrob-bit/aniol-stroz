import { getFirstStepsState, resolveFirstStepsStep } from '@/hooks/useFirstSteps';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

type StartRoute = '/intro' | '/ustawienia' | '/kontrakt' | '/licznik' | '/licznik-nagrody' | '/(tabs)';

function stepToRoute(step: ReturnType<typeof resolveFirstStepsStep>): StartRoute {
  if (step === 'intro') return '/intro';
  if (step === 'consents') return '/ustawienia';
  if (step === 'contract') return '/kontrakt';
  if (step === 'counter') return '/licznik';
  if (step === 'anniversary') return '/licznik-nagrody';
  return '/(tabs)';
}

export default function Index() {
  const [targetRoute, setTargetRoute] = useState<StartRoute | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const state = await getFirstStepsState();
      const step = resolveFirstStepsStep(state);
      if (mounted) {
        setTargetRoute(stepToRoute(step));
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  if (!targetRoute) return null;
  return <Redirect href={targetRoute} />;
}
