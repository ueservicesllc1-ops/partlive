import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export type CountryStatus = 'PLANNED' | 'BETA' | 'ACTIVE' | 'PAUSED' | 'RESTRICTED';

export interface CountryConfig2 {
  countryCode: string;
  name: string;
  status: CountryStatus;
  currencyCode: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  timezone: string;
  pricingProfile: 'US_STANDARD' | 'LATAM_STANDARD' | 'EU_STANDARD' | 'MENA_STANDARD';
  paymentMethods: string[];
  payoutMethods: string[];
  features: {
    payoutsEnabled: boolean;
    karaokeEnabled: boolean;
    pkBattlesEnabled: boolean;
    vipSubscriptionsEnabled: boolean;
  };
}

export interface LanguageResolutionResult {
  effectiveLanguage: string;
  fallbackUsed: boolean;
  isRTL: boolean;
  textDirection: 'ltr' | 'rtl';
}

export interface RegionalPricingProfile {
  profileId: string;
  countryCode: string;
  currencyCode: string;
  currencySymbol: string;
  decimalPrecision: number;
  starterCoinPackPrice: number;
  vipMonthlyPrice: number;
}

export interface MarketOpportunityScore {
  countryCode: string;
  countryName: string;
  marketScore: number; // 0 to 100
  potentialUsers: number;
  estimatedArpuUsd: number;
  readinessChecklist: {
    translationsReady: boolean;
    paymentsReady: boolean;
    payoutsReady: boolean;
    complianceApproved: boolean;
  };
}

const countryDatabase: Record<string, CountryConfig2> = {
  US: {
    countryCode: 'US',
    name: 'Estados Unidos',
    status: 'ACTIVE',
    currencyCode: 'USD',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es'],
    timezone: 'America/New_York',
    pricingProfile: 'US_STANDARD',
    paymentMethods: ['STRIPE_IAP', 'APPLE_PAY', 'GOOGLE_PAY'],
    payoutMethods: ['BANK_TRANSFER', 'PAYONEER'],
    features: { payoutsEnabled: true, karaokeEnabled: true, pkBattlesEnabled: true, vipSubscriptionsEnabled: true },
  },
  CL: {
    countryCode: 'CL',
    name: 'Chile',
    status: 'ACTIVE',
    currencyCode: 'CLP',
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    timezone: 'America/Santiago',
    pricingProfile: 'LATAM_STANDARD',
    paymentMethods: ['WEBPAY', 'STRIPE_IAP', 'GOOGLE_PAY'],
    payoutMethods: ['BANK_TRANSFER'],
    features: { payoutsEnabled: true, karaokeEnabled: true, pkBattlesEnabled: true, vipSubscriptionsEnabled: true },
  },
  MX: {
    countryCode: 'MX',
    name: 'México',
    status: 'ACTIVE',
    currencyCode: 'MXN',
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    timezone: 'America/Mexico_City',
    pricingProfile: 'LATAM_STANDARD',
    paymentMethods: ['OXXO', 'STRIPE_IAP', 'GOOGLE_PAY'],
    payoutMethods: ['BANK_TRANSFER', 'PAYONEER'],
    features: { payoutsEnabled: true, karaokeEnabled: true, pkBattlesEnabled: true, vipSubscriptionsEnabled: true },
  },
  BR: {
    countryCode: 'BR',
    name: 'Brasil',
    status: 'BETA',
    currencyCode: 'BRL',
    defaultLanguage: 'pt',
    supportedLanguages: ['pt', 'en', 'es'],
    timezone: 'America/Sao_Paulo',
    pricingProfile: 'LATAM_STANDARD',
    paymentMethods: ['PIX', 'STRIPE_IAP'],
    payoutMethods: ['PIX_PAYOUT'],
    features: { payoutsEnabled: true, karaokeEnabled: true, pkBattlesEnabled: true, vipSubscriptionsEnabled: true },
  },
  SA: {
    countryCode: 'SA',
    name: 'Arabia Saudita',
    status: 'PLANNED',
    currencyCode: 'SAR',
    defaultLanguage: 'ar',
    supportedLanguages: ['ar', 'en'],
    timezone: 'Asia/Riyadh',
    pricingProfile: 'MENA_STANDARD',
    paymentMethods: ['APPLE_PAY', 'CREDIT_CARD'],
    payoutMethods: ['PAYONEER'],
    features: { payoutsEnabled: false, karaokeEnabled: true, pkBattlesEnabled: true, vipSubscriptionsEnabled: true },
  },
};

export const getCountryConfiguration = async (countryCode: string): Promise<CountryConfig2> => {
  const config = countryDatabase[countryCode.toUpperCase()] || countryDatabase['US'];
  return config;
};

export const resolveUserLanguage = async (
  userId: string,
  userPref?: string,
  deviceLang?: string,
  countryCode: string = 'CL'
): Promise<LanguageResolutionResult> => {
  const country = countryDatabase[countryCode.toUpperCase()] || countryDatabase['US'];
  const supported = ['en', 'es', 'pt', 'fr', 'ar'];

  let effectiveLanguage = 'en';
  let fallbackUsed = false;

  if (userPref && supported.includes(userPref.toLowerCase())) {
    effectiveLanguage = userPref.toLowerCase();
  } else if (deviceLang && supported.includes(deviceLang.toLowerCase())) {
    effectiveLanguage = deviceLang.toLowerCase();
  } else if (country.defaultLanguage && supported.includes(country.defaultLanguage)) {
    effectiveLanguage = country.defaultLanguage;
  } else {
    effectiveLanguage = 'en';
    fallbackUsed = true;
  }

  const isRTL = effectiveLanguage === 'ar' || effectiveLanguage === 'he';

  return {
    effectiveLanguage,
    fallbackUsed,
    isRTL,
    textDirection: isRTL ? 'rtl' : 'ltr',
  };
};

export const getRegionalPricingProfile = async (countryCode: string): Promise<RegionalPricingProfile> => {
  const country = countryDatabase[countryCode.toUpperCase()] || countryDatabase['US'];

  let symbol = '$';
  let decimals = 2;
  let starterPrice = 0.99;
  let vipPrice = 4.99;

  if (country.currencyCode === 'CLP') {
    symbol = 'CLP$';
    decimals = 0;
    starterPrice = 900;
    vipPrice = 4500;
  } else if (country.currencyCode === 'MXN') {
    symbol = 'MX$';
    decimals = 2;
    starterPrice = 19.99;
    vipPrice = 89.99;
  } else if (country.currencyCode === 'BRL') {
    symbol = 'R$';
    decimals = 2;
    starterPrice = 4.99;
    vipPrice = 24.99;
  } else if (country.currencyCode === 'SAR') {
    symbol = 'SAR ';
    decimals = 2;
    starterPrice = 3.99;
    vipPrice = 18.99;
  }

  return {
    profileId: `profile_${country.pricingProfile.toLowerCase()}`,
    countryCode: country.countryCode,
    currencyCode: country.currencyCode,
    currencySymbol: symbol,
    decimalPrecision: decimals,
    starterCoinPackPrice: starterPrice,
    vipMonthlyPrice: vipPrice,
  };
};

export const formatLocalScheduleTime = async (
  utcTimestamp: string,
  targetTimezone: string = 'America/Santiago'
): Promise<{ utcTimestamp: string; localTimeFormatted: string; timezone: string; isDstActive: boolean }> => {
  const date = new Date(utcTimestamp);
  const localTimeFormatted = date.toLocaleString('es-CL', { timeZone: targetTimezone });

  return {
    utcTimestamp,
    localTimeFormatted,
    timezone: targetTimezone,
    isDstActive: false,
  };
};

export const getRegionalFeeds = async (
  countryCode: string = 'CL',
  languageCode: string = 'es'
): Promise<{ countryCode: string; languageCode: string; featuredLivesCount: number; trendingCategory: string }> => {
  return {
    countryCode,
    languageCode,
    featuredLivesCount: 18,
    trendingCategory: 'Karaoke & PK Battles LATAM',
  };
};

export const getMarketOpportunityScore = async (countryCode: string): Promise<MarketOpportunityScore> => {
  const country = countryDatabase[countryCode.toUpperCase()] || countryDatabase['US'];

  let score = 85;
  let potentialUsers = 1200000;
  let arpu = 3.50;

  if (countryCode === 'SA') {
    score = 92;
    potentialUsers = 2500000;
    arpu = 8.90;
  }

  return {
    countryCode: country.countryCode,
    countryName: country.name,
    marketScore: score,
    potentialUsers,
    estimatedArpuUsd: arpu,
    readinessChecklist: {
      translationsReady: true,
      paymentsReady: country.status === 'ACTIVE',
      payoutsReady: country.features.payoutsEnabled,
      complianceApproved: true,
    },
  };
};

export const toggleCountryStatus = async (
  countryCode: string,
  status: CountryStatus
): Promise<CountryConfig2> => {
  const country = countryDatabase[countryCode.toUpperCase()];
  if (!country) throw new Error(`COUNTRY_NOT_FOUND: ${countryCode}`);

  country.status = status;
  await db.collection('countryConfigs2').doc(countryCode.toUpperCase()).set(country, { merge: true });
  return country;
};
