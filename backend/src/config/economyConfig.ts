import { db } from '../config/firebase';

export interface SystemEconomyConfig {
  diamondConversionRate: number; // e.g. 0.01 (100 diamonds = $1.00 USD)
  minPayoutDiamonds: number; // e.g. 5000 diamonds ($50 USD min payout)
  hostRevenuePercentage: number; // e.g. 70 (%)
  platformPercentage: number; // e.g. 30 (%)
  giftAvailabilityEnabled: boolean;
  coinPackagesEnabled: boolean;
  vipPricingEnabled: boolean;
  updatedAt: any;
}

export const DEFAULT_ECONOMY_CONFIG: SystemEconomyConfig = {
  diamondConversionRate: 0.01, // 100 diamonds = $1 USD
  minPayoutDiamonds: 5000, // 5,000 diamonds = $50 USD
  hostRevenuePercentage: 70,
  platformPercentage: 30,
  giftAvailabilityEnabled: true,
  coinPackagesEnabled: true,
  vipPricingEnabled: true,
  updatedAt: new Date().toISOString(),
};

/**
 * Retrieves central economy configuration from Firestore 'systemConfig/economy'.
 * Falls back to DEFAULT_ECONOMY_CONFIG if document does not exist yet.
 */
export const getSystemEconomyConfig = async (): Promise<SystemEconomyConfig> => {
  try {
    const configDoc = await db.collection('systemConfig').doc('economy').get();
    if (configDoc.exists) {
      return { ...DEFAULT_ECONOMY_CONFIG, ...configDoc.data() };
    }
  } catch (error) {
    console.warn('[EconomyConfig] Could not fetch systemConfig/economy, using defaults:', error);
  }
  return DEFAULT_ECONOMY_CONFIG;
};

/**
 * Initializes or updates systemConfig/economy document in Firestore.
 */
export const initializeEconomyConfig = async (override?: Partial<SystemEconomyConfig>): Promise<SystemEconomyConfig> => {
  const configRef = db.collection('systemConfig').doc('economy');
  const newConfig = {
    ...DEFAULT_ECONOMY_CONFIG,
    ...override,
    updatedAt: new Date().toISOString(),
  };
  await configRef.set(newConfig, { merge: true });
  return newConfig;
};
