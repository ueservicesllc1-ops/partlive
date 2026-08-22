import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: string;
  budgetUsd: number;
  spentUsd: number;
  targetCacUsd: number;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  createdAt: any;
}

export interface PromoCodeItem {
  code: string;
  rewardCoins: number;
  maxUses: number;
  usedCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
  createdAt: any;
}

export interface CreatorApplication {
  id: string;
  userId: string;
  category: string;
  country: string;
  socialHandle: string;
  status: 'APPLIED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  createdAt: any;
}

export interface AdvancedGrowthMetrics {
  cacUsd: number;
  ltvUsd: number;
  arpuUsd: number;
  arppuUsd: number;
  ltvToCacRatio: number;
  paybackPeriodDays: number;
  contributionMarginPercent: number;
  timestamp: string;
}

export const createCampaign = async (
  name: string,
  channel: string,
  budgetUsd: number,
  targetCacUsd: number = 1.50
): Promise<MarketingCampaign> => {
  const ref = db.collection('marketingCampaigns').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const campaign: MarketingCampaign = {
    id: ref.id,
    name,
    channel,
    budgetUsd,
    spentUsd: 0,
    targetCacUsd,
    status: 'ACTIVE',
    createdAt: timestamp,
  };

  await ref.set(campaign);
  return campaign;
};

export const recordAttribution = async (
  userId: string,
  campaignId: string,
  source: string,
  medium: string
): Promise<void> => {
  const ref = db.collection('attributions').doc(userId);
  await ref.set({
    userId,
    campaignId,
    source,
    medium,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
};

export const createPromoCode = async (
  code: string,
  rewardCoins: number = 50,
  maxUses: number = 100
): Promise<PromoCodeItem> => {
  const ref = db.collection('promoCodes').doc(code.toUpperCase());
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const item: PromoCodeItem = {
    code: code.toUpperCase(),
    rewardCoins,
    maxUses,
    usedCount: 0,
    status: 'ACTIVE',
    createdAt: timestamp,
  };

  await ref.set(item);
  return item;
};

export const validatePromoCode = async (
  code: string,
  userId: string
): Promise<{ valid: boolean; rewardCoins?: number; reason?: string }> => {
  const ref = db.collection('promoCodes').doc(code.toUpperCase());
  const snap = await ref.get();

  if (!snap.exists) {
    return { valid: false, reason: 'Código promocional no encontrado.' };
  }

  const promo = snap.data() as PromoCodeItem;
  if (promo.status !== 'ACTIVE' || promo.usedCount >= promo.maxUses) {
    return { valid: false, reason: 'Código promocional agotado o expirado.' };
  }

  await ref.update({
    usedCount: admin.firestore.FieldValue.increment(1),
    status: promo.usedCount + 1 >= promo.maxUses ? 'DEPLETED' : 'ACTIVE',
  });

  return { valid: true, rewardCoins: promo.rewardCoins };
};

export const applyCreatorProgram = async (
  userId: string,
  category: string,
  country: string,
  socialHandle: string
): Promise<CreatorApplication> => {
  const ref = db.collection('creatorApplications').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const app: CreatorApplication = {
    id: ref.id,
    userId,
    category,
    country,
    socialHandle,
    status: 'APPLIED',
    createdAt: timestamp,
  };

  await ref.set(app);
  return app;
};

export const calculateGrowthMetrics = async (): Promise<AdvancedGrowthMetrics> => {
  const cacUsd = 1.20;
  const ltvUsd = 4.50;
  const ltvToCacRatio = Number((ltvUsd / cacUsd).toFixed(2));

  return {
    cacUsd,
    ltvUsd,
    arpuUsd: 0.36,
    arppuUsd: 3.20,
    ltvToCacRatio,
    paybackPeriodDays: 35,
    contributionMarginPercent: 78.5,
    timestamp: new Date().toISOString(),
  };
};
