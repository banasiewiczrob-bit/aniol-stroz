import { Redirect } from 'expo-router';
import { getFirstStepsState, resolveFirstStepsStep } from '@/hooks/useFirstSteps';
import { useEffect, useState } from 'react';

export default function Index() {
  const [targetRoute, setTargetRoute] = useState<'/intro' | '/kontrakt' | '/licznik' | '/ustawienia' | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const state = await getFirstStepsState();
      const step = resolveFirstStepsStep(state);
      if (mounted) {
        if (step === 'contract') {
          setTargetRoute('/kontrakt');
          return;
        }
        if (step === 'counter') {
          setTargetRoute('/licznik');
          return;
        }
        if (step === 'consents') {
          setTargetRoute('/ustawienia');
          return;
        }
        setTargetRoute('/intro');
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
