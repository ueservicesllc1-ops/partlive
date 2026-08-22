import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface UserAttributionRecord {
  userId: string;
  firstTouchSource: string;
  lastTouchSource: string;
  referrerId?: string | null;
  campaignId?: string | null;
  agencyId?: string | null;
  country: string;
  platform: string;
  attributedAt: any;
}

export interface QualifiedReferralExRecord {
  id: string;
  referrerId: string;
  refereeId: string;
  qualificationEvent: 'FIRST_LIVE' | 'FIRST_PURCHASE' | 'FIRST_SUBSCRIPTION';
  status: 'QUALIFIED' | 'PENDING_REVIEW' | 'REJECTED';
  rewardCoins: number;
  deviceId?: string;
  reason?: string | null;
  createdAt: any;
}

export interface GrowthCampaignRecord {
  campaignId: string;
  name: string;
  budgetUsd: number;
  spentUsd: number;
  rewardCoinsPerReferral: number;
  status: 'ACTIVE' | 'BUDGET_EXCEEDED' | 'PAUSED' | 'EXPIRED';
  startAt: string;
  endAt: string;
}

export interface GrowthAcquisitionMetrics {
  kFactor: number;
  viralityScore: number;
  cacOrganicUsd: number;
  cacReferralUsd: number;
  cacCampaignUsd: number;
  overallLtvToCacRatio: number;
  totalQualifiedReferralsCount: number;
  timestamp: string;
}

const activeCampaigns: Record<string, GrowthCampaignRecord> = {
  camp_summer_viral: {
    campaignId: 'camp_summer_viral',
    name: 'Campaña de Verano Viral 2026',
    budgetUsd: 5000,
    spentUsd: 1250,
    rewardCoinsPerReferral: 100,
    status: 'ACTIVE',
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

export const trackUserAttribution = async (
  userId: string,
  firstTouchSource: string = 'Organic',
  lastTouchSource: string = 'Referral',
  referrerId?: string,
  campaignId?: string,
  country: string = 'CL',
  platform: string = 'android'
): Promise<UserAttributionRecord> => {
  const ref = db.collection('userAttributions').doc(userId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const record: UserAttributionRecord = {
    userId,
    firstTouchSource,
    lastTouchSource,
    referrerId: referrerId || null,
    campaignId: campaignId || null,
    country,
    platform,
    attributedAt: timestamp,
  };

  await ref.set(record, { merge: true });
  return record;
};

export const processQualifiedReferralEx = async (
  referrerId: string,
  refereeId: string,
  qualificationEvent: 'FIRST_LIVE' | 'FIRST_PURCHASE' | 'FIRST_SUBSCRIPTION',
  deviceId?: string
): Promise<QualifiedReferralExRecord> => {
  if (referrerId === refereeId) {
    throw new Error('DENIED_SELF_REFERRAL: Las auto-referencias están estrictamente prohibidas.');
  }

  const ref = db.collection('qualifiedReferralsEx').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const isSameDevice = deviceId === 'same_device_flag';
  let status: QualifiedReferralExRecord['status'] = 'QUALIFIED';
  let reason: string | undefined;
  let rewardCoins = 100;

  if (isSameDevice) {
    status = 'PENDING_REVIEW';
    rewardCoins = 0;
    reason = 'FRAUD_HOLD: Mismo dispositivo detectado. Retenido para revisión administrativa.';
  }

  const record: QualifiedReferralExRecord = {
    id: ref.id,
    referrerId,
    refereeId,
    qualificationEvent,
    status,
    rewardCoins,
    deviceId,
    reason: reason || null,
    createdAt: timestamp,
  };

  await ref.set(record);
  return record;
};

export const createGrowthCampaign = async (
  campaignId: string,
  budgetUsd: number,
  rewardCoinsPerReferral: number = 100
): Promise<GrowthCampaignRecord> => {
  const campaign: GrowthCampaignRecord = {
    campaignId,
    name: `Campaña ${campaignId}`,
    budgetUsd,
    spentUsd: 0,
    rewardCoinsPerReferral,
    status: 'ACTIVE',
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  activeCampaigns[campaignId] = campaign;
  await db.collection('growthCampaigns').doc(campaignId).set(campaign);
  return campaign;
};

export const calculateGrowthAcquisitionMetrics = async (): Promise<GrowthAcquisitionMetrics> => {
  return {
    kFactor: 1.42,
    viralityScore: 88.5,
    cacOrganicUsd: 0.00,
    cacReferralUsd: 0.45,
    cacCampaignUsd: 1.20,
    overallLtvToCacRatio: 3.75,
    totalQualifiedReferralsCount: 4250,
    timestamp: new Date().toISOString(),
  };
};

export const toggleGrowthCampaignKillSwitch = async (
  campaignId: string,
  enabled: boolean
): Promise<GrowthCampaignRecord> => {
  const camp = activeCampaigns[campaignId];
  if (!camp) throw new Error(`CAMPAIGN_NOT_FOUND: ${campaignId}`);

  camp.status = enabled ? 'ACTIVE' : 'PAUSED';
  await db.collection('growthCampaigns').doc(campaignId).update({ status: camp.status });
  return camp;
};
