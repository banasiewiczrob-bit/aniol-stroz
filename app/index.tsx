import { getOnboardingStep, OnboardingStep } from '@/utils/onboarding';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';

export default function Index() {
  const [step, setStep] = useState<OnboardingStep | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const nextStep = await getOnboardingStep();
      if (active) setStep(nextStep);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!step) return null;
  if (step === 'contract') return <Redirect href="/kontrakt" />;
  if (step === 'startDate') return <Redirect href="/licznik" />;
  return <Redirect href="/(tabs)" />;
}
