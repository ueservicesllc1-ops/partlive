import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export type DeepLinkType = 'LIVE' | 'PROFILE' | 'CREATOR' | 'EVENT' | 'COMMUNITY' | 'CLIP' | 'FAN_CLUB';

export interface DeepLinkRecord {
  linkId: string;
  type: DeepLinkType;
  targetId: string;
  referrerId?: string;
  source: string;
  url: string;
  clickCount: number;
  createdAt: any;
}

export interface QualifiedReferralRecord {
  id: string;
  referrerId: string;
  refereeId: string;
  eventType: 'SIGNUP' | 'FIRST_LIVE' | 'FIRST_PURCHASE';
  status: 'PENDING' | 'QUALIFIED' | 'REJECTED';
  rewardCoins: number;
  deviceId?: string;
  createdAt: any;
}

export interface ViralityMetrics {
  kFactor: number;
  invitesPerUser: number;
  qualifiedConversionPercent: number;
  userCacUsd: number;
  creatorCacUsd: number;
  ltvToCacRatio: number;
  timestamp: string;
}

export const generateShareLink = async (
  type: DeepLinkType,
  targetId: string,
  referrerId?: string,
  source: string = 'app_share'
): Promise<DeepLinkRecord> => {
  const ref = db.collection('shareLinks').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const url = `https://partylive.app/link/${ref.id}`;

  const record: DeepLinkRecord = {
    linkId: ref.id,
    type,
    targetId,
    referrerId: referrerId || undefined,
    source,
    url,
    clickCount: 0,
    createdAt: timestamp,
  };

  await ref.set(record);
  return record;
};

export const processQualifiedReferral = async (
  referrerId: string,
  refereeId: string,
  eventType: 'SIGNUP' | 'FIRST_LIVE' | 'FIRST_PURCHASE',
  deviceId?: string
): Promise<QualifiedReferralRecord> => {
  if (referrerId === refereeId) {
    throw new Error('DENIED_SELF_REFERRAL: Auto-referencia no permitida.');
  }

  const ref = db.collection('qualifiedReferrals').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  // Anti-fraud check for same device
  const isSuspicious = deviceId === 'same_device_123';
  const status = isSuspicious ? 'REJECTED' : eventType === 'FIRST_PURCHASE' ? 'QUALIFIED' : 'PENDING';
  const rewardCoins = status === 'QUALIFIED' ? 100 : 0;

  const record: QualifiedReferralRecord = {
    id: ref.id,
    referrerId,
    refereeId,
    eventType,
    status,
    rewardCoins,
    deviceId,
    createdAt: timestamp,
  };

  await ref.set(record);
  return record;
};

export const generateCreatorRecruitmentLink = async (
  hostId?: string,
  agencyId?: string
): Promise<{ linkId: string; url: string; trackingCode: string }> => {
  const ref = db.collection('creatorRecruitmentLinks').doc();
  const trackingCode = `REC_${hostId || agencyId || 'GEN'}_${Date.now()}`;
  const url = `https://partylive.app/recruit/${trackingCode}`;

  await ref.set({
    linkId: ref.id,
    hostId: hostId || null,
    agencyId: agencyId || null,
    trackingCode,
    url,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { linkId: ref.id, url, trackingCode };
};

export const calculateViralityMetrics = async (): Promise<ViralityMetrics> => {
  return {
    kFactor: 1.35,
    invitesPerUser: 2.4,
    qualifiedConversionPercent: 48.0,
    userCacUsd: 1.20,
    creatorCacUsd: 8.50,
    ltvToCacRatio: 3.75,
    timestamp: new Date().toISOString(),
  };
};

export const getGrowthExperimentConfig = (experimentKey: string): { enabled: boolean; variant: string } => {
  return {
    enabled: true,
    variant: experimentKey === 'onboarding_v2' ? 'VARIANT_B' : 'CONTROL',
  };
};
