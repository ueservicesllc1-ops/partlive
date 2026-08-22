import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface CountryConfig {
  countryCode: string;
  countryName: string;
  region: 'NORTH_AMERICA' | 'LATIN_AMERICA' | 'EUROPE' | 'OTHER';
  defaultLanguage: string;
  supportedLanguages: string[];
  defaultCurrency: string;
  supportedCurrencies: string[];
  status: 'ACTIVE' | 'BETA' | 'RESTRICTED' | 'DISABLED';
  features: {
    payouts: boolean;
    karaoke: boolean;
    pkBattles: boolean;
    vipSubscriptions: boolean;
  };
}

export interface FxConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  timestamp: string;
}

const countryRegistry: Record<string, CountryConfig> = {
  US: {
    countryCode: 'US',
    countryName: 'United States',
    region: 'NORTH_AMERICA',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es'],
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD'],
    status: 'ACTIVE',
    features: { payouts: true, karaoke: true, pkBattles: true, vipSubscriptions: true },
  },
  EC: {
    countryCode: 'EC',
    countryName: 'Ecuador',
    region: 'LATIN_AMERICA',
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD'],
    status: 'ACTIVE',
    features: { payouts: true, karaoke: true, pkBattles: true, vipSubscriptions: true },
  },
  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    region: 'LATIN_AMERICA',
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    defaultCurrency: 'MXN',
    supportedCurrencies: ['MXN', 'USD'],
    status: 'BETA',
    features: { payouts: true, karaoke: true, pkBattles: true, vipSubscriptions: true },
  },
  CO: {
    countryCode: 'CO',
    countryName: 'Colombia',
    region: 'LATIN_AMERICA',
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    defaultCurrency: 'COP',
    supportedCurrencies: ['COP', 'USD'],
    status: 'BETA',
    features: { payouts: true, karaoke: true, pkBattles: true, vipSubscriptions: true },
  },
};

const fxRates: Record<string, number> = {
  USD_USD: 1.0,
  USD_MXN: 17.15,
  MXN_USD: 0.058,
  USD_COP: 3920.0,
  COP_USD: 0.000255,
  USD_EUR: 0.92,
  EUR_USD: 1.087,
};

export const getCountryConfig = async (countryCode: string): Promise<CountryConfig> => {
  const code = countryCode.toUpperCase();
  if (countryRegistry[code]) {
    return countryRegistry[code];
  }

  // Safe fallback to global defaults (US)
  return countryRegistry.US;
};

export const updateCountryConfig = async (
  countryCode: string,
  updates: Partial<CountryConfig>
): Promise<CountryConfig> => {
  const code = countryCode.toUpperCase();
  const current = await getCountryConfig(code);
  const updated = { ...current, ...updates };

  countryRegistry[code] = updated;
  const ref = db.collection('countryConfigs').doc(code);
  await ref.set({ ...updated, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

  return updated;
};

export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): FxConversionResult => {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) {
    return {
      originalAmount: amount,
      originalCurrency: from,
      convertedAmount: amount,
      targetCurrency: to,
      exchangeRate: 1.0,
      timestamp: new Date().toISOString(),
    };
  }

  const pair = `${from}_${to}`;
  const rate = fxRates[pair] || 1.0;
  const convertedAmount = Number((amount * rate).toFixed(2));

  return {
    originalAmount: amount,
    originalCurrency: from,
    convertedAmount,
    targetCurrency: to,
    exchangeRate: rate,
    timestamp: new Date().toISOString(),
  };
};

export const isFeatureEnabledForCountry = async (
  countryCode: string,
  featureKey: keyof CountryConfig['features']
): Promise<boolean> => {
  const config = await getCountryConfig(countryCode);
  if (config.status === 'DISABLED') return false;
  return !!config.features[featureKey];
};

export const simulateCountryExpansion = (
  countryCode: string,
  targetDau: number,
  arppuUsd: number = 18.0,
  paymentFeePercent: number = 3.0
): {
  countryCode: string;
  projectedMonthlyRevenueUsd: number;
  projectedPaymentFeesUsd: number;
  projectedContributionMarginUsd: number;
} => {
  const monthlyPayingUsers = targetDau * 0.035 * 30; // 3.5% conversion over 30 days
  const projectedMonthlyRevenueUsd = Number((monthlyPayingUsers * arppuUsd).toFixed(2));
  const projectedPaymentFeesUsd = Number((projectedMonthlyRevenueUsd * (paymentFeePercent / 100)).toFixed(2));
  const projectedContributionMarginUsd = Number(((projectedMonthlyRevenueUsd - projectedPaymentFeesUsd) * 0.72).toFixed(2));

  return {
    countryCode: countryCode.toUpperCase(),
    projectedMonthlyRevenueUsd,
    projectedPaymentFeesUsd,
    projectedContributionMarginUsd,
  };
};
