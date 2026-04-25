export type SupportPaymentAmountKey = '10' | '25' | '50' | 'custom';

const DEFAULT_SUPPORT_PAYMENT_URL = process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL?.trim() ?? '';

export const SUPPORT_PAYMENT_LINKS: Record<SupportPaymentAmountKey, string> = {
  '10': process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_10?.trim() ?? DEFAULT_SUPPORT_PAYMENT_URL,
  '25': process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_25?.trim() ?? DEFAULT_SUPPORT_PAYMENT_URL,
  '50': process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_50?.trim() ?? DEFAULT_SUPPORT_PAYMENT_URL,
  custom: process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_CUSTOM?.trim() ?? DEFAULT_SUPPORT_PAYMENT_URL,
};

export function getSupportPaymentUrl(amount: SupportPaymentAmountKey) {
  return SUPPORT_PAYMENT_LINKS[amount];
}
