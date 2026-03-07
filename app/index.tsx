import { Redirect } from 'expo-router';
import { getFirstStepsState } from '@/hooks/useFirstSteps';
import { useEffect, useState } from 'react';

export default function Index() {
  const [targetRoute, setTargetRoute] = useState<'/intro' | '/(tabs)' | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const state = await getFirstStepsState();
      if (mounted) {
        setTargetRoute(state.firstStepsDone ? '/(tabs)' : '/intro');
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
