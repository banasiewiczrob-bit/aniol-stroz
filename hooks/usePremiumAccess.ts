export type PremiumAccess = {
  hasPremium: boolean;
  source: 'tester_preview' | 'locked';
};

// Wersja testowa: umożliwia testerom wejście do modułu premium przed wdrożeniem płatności.
const TESTER_PREMIUM_PREVIEW_ENABLED = true;

export function usePremiumAccess(): PremiumAccess {
  if (TESTER_PREMIUM_PREVIEW_ENABLED) {
    return { hasPremium: true, source: 'tester_preview' };
  }

  return { hasPremium: false, source: 'locked' };
}

