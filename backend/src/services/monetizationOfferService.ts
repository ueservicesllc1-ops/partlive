import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export type OfferType =
  | 'COIN_PACKAGE'
  | 'GIFT_PROMOTION'
  | 'SUBSCRIPTION_PROMOTION'
  | 'VIP_PROMOTION'
  | 'FAN_CLUB_PROMOTION'
  | 'EVENT_PROMOTION'
  | 'BUNDLE'
  | 'WELCOME_OFFER'
  | 'RETURNING_USER_OFFER'
  | 'CREATOR_OFFER';

export type OfferPlacement = 'WALLET' | 'HOME' | 'LIVE' | 'GIFT_PICKER' | 'PROFILE' | 'VIP';

export interface SmartOfferRecord {
  offerId: string;
  type: OfferType;
  title: string;
  description: string;
  placement: OfferPlacement;
  priceUsd: number;
  baseCoins: number;
  bonusCoins: number;
  savingsPercent: number;
  isSingleUse: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED';
  startAt: string;
  endAt: string;
}

export interface CoinPackageRecord {
  packageId: string;
  tierName: 'Starter' | 'Basic' | 'Popular' | 'Premium' | 'Ultimate';
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  priceUsd: number;
  isRecommended: boolean;
}

export interface SmartBundleRecord {
  bundleId: string;
  title: string;
  includedItems: string[];
  individualPriceUsd: number;
  bundlePriceUsd: number;
  savingsUsd: number;
  savingsPercent: number;
}

let globalMonetizationKillSwitch: { enabled: boolean; reason: string; updatedBy: string } = {
  enabled: true,
  reason: 'Normal Operating Mode',
  updatedBy: 'SYSTEM',
};

const claimedOffersPerUser = new Set<string>();

export const getCoinPackages = async (): Promise<CoinPackageRecord[]> => {
  return [
    { packageId: 'pack_starter', tierName: 'Starter', baseCoins: 100, bonusCoins: 20, totalCoins: 120, priceUsd: 0.99, isRecommended: false },
    { packageId: 'pack_basic', tierName: 'Basic', baseCoins: 500, bonusCoins: 100, totalCoins: 600, priceUsd: 4.99, isRecommended: false },
    { packageId: 'pack_popular', tierName: 'Popular', baseCoins: 1200, bonusCoins: 300, totalCoins: 1500, priceUsd: 9.99, isRecommended: true },
    { packageId: 'pack_premium', tierName: 'Premium', baseCoins: 3000, bonusCoins: 900, totalCoins: 3900, priceUsd: 24.99, isRecommended: false },
    { packageId: 'pack_ultimate', tierName: 'Ultimate', baseCoins: 6500, bonusCoins: 2200, totalCoins: 8700, priceUsd: 49.99, isRecommended: false },
  ];
};

export const getEligibleOffersForUser = async (
  userId: string,
  placement: OfferPlacement = 'WALLET'
): Promise<SmartOfferRecord[]> => {
  const allOffers: SmartOfferRecord[] = [
    {
      offerId: 'offer_welcome_starter',
      type: 'WELCOME_OFFER',
      title: '🎁 Oferta de Bienvenida Especial',
      description: '100 Coins + 50 Bonus Coins por solo $0.99 USD',
      placement: 'WALLET',
      priceUsd: 0.99,
      baseCoins: 100,
      bonusCoins: 50,
      savingsPercent: 33,
      isSingleUse: true,
      status: 'ACTIVE',
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      offerId: 'offer_bundle_vip_coins',
      type: 'BUNDLE',
      title: '💎 Combo VIP + 1,500 Coins',
      description: 'Obtén 1 mes de VIP 1 y 1,500 Coins con 25% de ahorro real',
      placement: 'HOME',
      priceUsd: 11.99,
      baseCoins: 1200,
      bonusCoins: 300,
      savingsPercent: 25,
      isSingleUse: false,
      status: 'ACTIVE',
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return allOffers.filter((o) => o.placement === placement || placement === 'WALLET');
};

export const createSmartBundle = async (
  bundleId: string,
  products: { name: string; individualPriceUsd: number }[],
  discountPercent: number = 20
): Promise<SmartBundleRecord> => {
  const individualPriceUsd = products.reduce((acc, p) => acc + p.individualPriceUsd, 0);
  const savingsUsd = Number((individualPriceUsd * (discountPercent / 100)).toFixed(2));
  const bundlePriceUsd = Number((individualPriceUsd - savingsUsd).toFixed(2));

  return {
    bundleId,
    title: `Combo Promocional (${discountPercent}% Ahorro Real)`,
    includedItems: products.map((p) => p.name),
    individualPriceUsd,
    bundlePriceUsd,
    savingsUsd,
    savingsPercent: discountPercent,
  };
};

export const calculateNextBestOffer = async (
  userId: string
): Promise<{ nextOffer: SmartOfferRecord; relevanceScore: number; experimentVariant: 'CONTROL' | 'VARIANT_A' | 'VARIANT_B' }> => {
  const offers = await getEligibleOffersForUser(userId, 'WALLET');
  const nextOffer = offers[0];

  return {
    nextOffer,
    relevanceScore: 0.94,
    experimentVariant: 'VARIANT_A',
  };
};

export const claimSmartOffer = async (
  userId: string,
  offerId: string,
  receiptToken: string = 'receipt_valid_token_123'
): Promise<{ success: boolean; isDuplicateClaim: boolean; coinsGranted: number; transactionId: string }> => {
  if (!globalMonetizationKillSwitch.enabled) {
    throw new Error('PROMOTIONS_PAUSED: Las ofertas promocionales están pausadas temporalmente.');
  }

  const claimKey = `${userId}_${offerId}`;
  if (claimedOffersPerUser.has(claimKey)) {
    return { success: false, isDuplicateClaim: true, coinsGranted: 0, transactionId: '' };
  }

  if (!receiptToken || receiptToken.includes('invalid')) {
    throw new Error('INVALID_RECEIPT: No se pudo validar la compra de la oferta.');
  }

  claimedOffersPerUser.add(claimKey);

  const ref = db.collection('offerClaims').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await ref.set({
    claimId: ref.id,
    userId,
    offerId,
    receiptToken,
    claimedAt: timestamp,
  });

  return {
    success: true,
    isDuplicateClaim: false,
    coinsGranted: 150,
    transactionId: ref.id,
  };
};

export const toggleGlobalMonetizationKillSwitch = async (
  enabled: boolean,
  reason: string = 'Intervención administrativa',
  adminId: string = 'SUPER_ADMIN'
) => {
  globalMonetizationKillSwitch = {
    enabled,
    reason,
    updatedBy: adminId,
  };

  await db.collection('systemKillSwitches').doc('monetizationOffers').set(globalMonetizationKillSwitch);
  return globalMonetizationKillSwitch;
};
