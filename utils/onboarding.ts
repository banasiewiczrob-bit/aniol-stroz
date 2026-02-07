import AsyncStorage from '@react-native-async-storage/async-storage';

export const CONTRACT_SIGNED_AT_KEY = '@onboarding_contract_signed_at';
export const START_DATE_KEY = 'startDate';

export type OnboardingStep = 'contract' | 'startDate' | 'done';

export async function getOnboardingStep(): Promise<OnboardingStep> {
  try {
    const contractSignedAt = await AsyncStorage.getItem(CONTRACT_SIGNED_AT_KEY);
    if (!contractSignedAt) return 'contract';

    const startDate = await AsyncStorage.getItem(START_DATE_KEY);
    if (!startDate) return 'startDate';

    const parsed = new Date(startDate);
    if (Number.isNaN(parsed.getTime())) return 'startDate';

    return 'done';
  } catch {
    return 'contract';
  }
}

export async function markContractSigned(): Promise<void> {
  await AsyncStorage.setItem(CONTRACT_SIGNED_AT_KEY, new Date().toISOString());
}
