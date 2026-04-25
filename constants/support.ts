export type SupportPaymentAmountKey = '10' | '25' | '50' | 'custom';

const DEFAULT_SUPPORT_PAYMENT_URL = process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL?.trim();

const DEFAULT_SUPPORT_PAYMENT_LINKS: Record<SupportPaymentAmountKey, string> = {
  '10': 'https://buy.stripe.com/5kQ5kCaBc0GMakH74tdAk01',
  '25': 'https://buy.stripe.com/eVq5kC24G3SY50newVdAk02',
  '50': 'https://buy.stripe.com/6oUaEW6kWfBG0K7coNdAk03',
  custom: 'https://buy.stripe.com/5kQ3cu8t40GM50n4WldAk04',
};

function resolveSupportPaymentUrl(specificUrl: string | undefined, fallbackUrl: string) {
  return specificUrl?.trim() || DEFAULT_SUPPORT_PAYMENT_URL || fallbackUrl;
}

export const SUPPORT_PAYMENT_LINKS: Record<SupportPaymentAmountKey, string> = {
  '10': resolveSupportPaymentUrl(process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_10, DEFAULT_SUPPORT_PAYMENT_LINKS['10']),
  '25': resolveSupportPaymentUrl(process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_25, DEFAULT_SUPPORT_PAYMENT_LINKS['25']),
  '50': resolveSupportPaymentUrl(process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_50, DEFAULT_SUPPORT_PAYMENT_LINKS['50']),
  custom: resolveSupportPaymentUrl(
    process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_CUSTOM,
    DEFAULT_SUPPORT_PAYMENT_LINKS.custom
  ),
};

export function getSupportPaymentUrl(amount: SupportPaymentAmountKey) {
  return SUPPORT_PAYMENT_LINKS[amount];
}
