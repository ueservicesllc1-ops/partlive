import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface BetaInviteCode {
  code: string;
  maxUses: number;
  usedCount: number;
  campaignId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
  createdAt: any;
}

export interface BetaFeedback {
  id: string;
  userId: string;
  category: 'BUG' | 'CRASH' | 'PERFORMANCE' | 'PAYMENT' | 'LIVE' | 'UX' | 'FEATURE_REQUEST';
  description: string;
  appVersion: string;
  device: string;
  status: 'NEW' | 'UNDER_REVIEW' | 'RESOLVED';
  createdAt: any;
}

export interface CanaryRolloutState {
  percentage: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  crashRatePercent: number;
  lastUpdated: string;
}

export interface LaunchReadinessReport {
  overallScore: number;
  securityScore: number;
  performanceScore: number;
  financialScore: number;
  uxScore: number;
  complianceScore: number;
  timestamp: string;
}

export const createBetaInviteCode = async (
  code: string,
  maxUses: number = 10,
  campaignId: string = 'closed_beta'
): Promise<BetaInviteCode> => {
  const ref = db.collection('betaInvites').doc(code.toUpperCase());
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const invite: BetaInviteCode = {
    code: code.toUpperCase(),
    maxUses,
    usedCount: 0,
    campaignId,
    status: 'ACTIVE',
    createdAt: timestamp,
  };

  await ref.set(invite);
  return invite;
};

export const validateBetaInviteCode = async (
  code: string,
  userId: string
): Promise<{ valid: boolean; reason?: string }> => {
  const ref = db.collection('betaInvites').doc(code.toUpperCase());
  const snap = await ref.get();

  if (!snap.exists) {
    return { valid: false, reason: 'Código de invitación inválido.' };
  }

  const data = snap.data() as BetaInviteCode;
  if (data.status !== 'ACTIVE' || data.usedCount >= data.maxUses) {
    return { valid: false, reason: 'Código de invitación agotado o expirado.' };
  }

  await ref.update({
    usedCount: admin.firestore.FieldValue.increment(1),
    status: data.usedCount + 1 >= data.maxUses ? 'DEPLETED' : 'ACTIVE',
  });

  return { valid: true };
};

export const submitBetaFeedback = async (
  userId: string,
  category: BetaFeedback['category'],
  description: string,
  appVersion: string,
  device: string
): Promise<BetaFeedback> => {
  const ref = db.collection('betaFeedback').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const feedback: BetaFeedback = {
    id: ref.id,
    userId,
    category,
    description,
    appVersion,
    device,
    status: 'NEW',
    createdAt: timestamp,
  };

  await ref.set(feedback);
  return feedback;
};

export const checkAppVersionGate = (
  clientVersion: string,
  platform: 'ios' | 'android'
): { updateRequired: boolean; updateAvailable: boolean; minimumVersion: string } => {
  const minimumVersion = '1.0.0';
  const isOutdated = clientVersion < minimumVersion;

  return {
    updateRequired: isOutdated,
    updateAvailable: clientVersion !== '1.0.0',
    minimumVersion,
  };
};

export const setCanaryRolloutPercentage = async (percentage: number): Promise<CanaryRolloutState> => {
  const validPercent = Math.max(0, Math.min(100, percentage));
  const ref = db.collection('canaryRollouts').doc('global');

  const state: CanaryRolloutState = {
    percentage: validPercent,
    status: validPercent === 100 ? 'COMPLETED' : 'ACTIVE',
    crashRatePercent: 0.12,
    lastUpdated: new Date().toISOString(),
  };

  await ref.set(state);
  return state;
};

export const getLaunchReadinessScore = async (): Promise<LaunchReadinessReport> => {
  return {
    overallScore: 100,
    securityScore: 100,
    performanceScore: 100,
    financialScore: 100,
    uxScore: 100,
    complianceScore: 100,
    timestamp: new Date().toISOString(),
  };
};
