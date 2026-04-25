export type SupportPaymentAmountKey = '10' | '25' | '50' | 'custom';

const DEFAULT_SUPPORT_PAYMENT_URL = process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL?.trim();

const DEFAULT_PAYPAL_PAYMENT_LINKS: Record<SupportPaymentAmountKey, string> = {
  '10': 'https://www.paypal.com/ncp/payment/MSMUQQLCWZCPE',
  '25': 'https://www.paypal.com/ncp/payment/4MQKWV2E6S39E',
  '50': 'https://www.paypal.com/ncp/payment/MJJY74NZDMHSC',
  custom: 'https://www.paypal.com/ncp/payment/2V98UV3ZDWFH4',
};

function resolveSupportPaymentUrl(specificUrl: string | undefined, fallbackUrl: string) {
  return specificUrl?.trim() || DEFAULT_SUPPORT_PAYMENT_URL || fallbackUrl;
}

export const SUPPORT_PAYMENT_LINKS: Record<SupportPaymentAmountKey, string> = {
  '10': resolveSupportPaymentUrl(process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_10, DEFAULT_PAYPAL_PAYMENT_LINKS['10']),
  '25': resolveSupportPaymentUrl(process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_25, DEFAULT_PAYPAL_PAYMENT_LINKS['25']),
  '50': resolveSupportPaymentUrl(process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_50, DEFAULT_PAYPAL_PAYMENT_LINKS['50']),
  custom: resolveSupportPaymentUrl(
    process.env.EXPO_PUBLIC_SUPPORT_PAYMENT_URL_CUSTOM,
    DEFAULT_PAYPAL_PAYMENT_LINKS.custom
  ),
};

export function getSupportPaymentUrl(amount: SupportPaymentAmountKey) {
  return SUPPORT_PAYMENT_LINKS[amount];
}
