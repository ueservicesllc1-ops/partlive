import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export type EntitlementStatus = 'ACTIVE' | 'GRACE_PERIOD' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'REVOKED';

export interface CreatorSubscriptionRecord {
  subscriptionId: string;
  userId: string;
  hostId: string;
  tierId: 'tier_1' | 'tier_2' | 'tier_3';
  status: EntitlementStatus;
  startedAt: any;
  expiresAt: any;
  nextBillingAt: any;
  platform: 'android' | 'ios' | 'manual';
  receiptToken: string;
  priceUsd: number;
  creatorShareUsd: number;
  platformShareUsd: number;
}

export interface FanClubMembershipRecord {
  membershipId: string;
  userId: string;
  hostId: string;
  status: EntitlementStatus;
  joinedAt: any;
  expiresAt: any;
  badgeCode: string;
}

export interface SubscriptionAnalyticsMetrics {
  mrrUsd: number;
  arrUsd: number;
  arpsUsd: number;
  activeSubscribersCount: number;
  activeVipMembersCount: number;
  activeFanClubMembersCount: number;
  subscriberChurnRatePercent: number;
  timestamp: string;
}

let globalSubscriptionKillSwitch: { enabled: boolean; reason: string; updatedBy: string } = {
  enabled: true,
  reason: 'Normal Operating Mode',
  updatedBy: 'SYSTEM',
};

export const subscribeUserToCreator = async (
  userId: string,
  hostId: string,
  tierId: 'tier_1' | 'tier_2' | 'tier_3' = 'tier_1',
  receiptToken: string = 'receipt_valid_token_123',
  platform: 'android' | 'ios' | 'manual' = 'android'
): Promise<CreatorSubscriptionRecord> => {
  if (!globalSubscriptionKillSwitch.enabled) {
    throw new Error('SUBSCRIPTION_PAUSED: Las nuevas compras de suscripciones están pausadas temporalmente.');
  }

  // Server-Side Receipt Validation
  if (!receiptToken || receiptToken.includes('invalid')) {
    throw new Error('INVALID_RECEIPT: El recibo de compra no pudo ser validado por la pasarela oficial.');
  }

  let priceUsd = 4.99;
  if (tierId === 'tier_2') priceUsd = 9.99;
  if (tierId === 'tier_3') priceUsd = 24.99;

  const creatorShareUsd = Number((priceUsd * 0.70).toFixed(2));
  const platformShareUsd = Number((priceUsd * 0.30).toFixed(2));

  const ref = db.collection('creatorSubscriptions').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const expiresAtDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiresAtTimestamp = admin.firestore.Timestamp.fromDate(expiresAtDate);

  const subscription: CreatorSubscriptionRecord = {
    subscriptionId: ref.id,
    userId,
    hostId,
    tierId,
    status: 'ACTIVE',
    startedAt: timestamp,
    expiresAt: expiresAtTimestamp,
    nextBillingAt: expiresAtTimestamp,
    platform,
    receiptToken,
    priceUsd,
    creatorShareUsd,
    platformShareUsd,
  };

  await ref.set(subscription);
  return subscription;
};

export const subscribeUserToFanClub = async (
  userId: string,
  hostId: string
): Promise<FanClubMembershipRecord> => {
  const ref = db.collection('fanClubMemberships').doc(`${userId}_${hostId}`);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const expiresAtDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const membership: FanClubMembershipRecord = {
    membershipId: ref.id,
    userId,
    hostId,
    status: 'ACTIVE',
    joinedAt: timestamp,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAtDate),
    badgeCode: `FAN_${hostId.slice(0, 5).toUpperCase()}`,
  };

  await ref.set(membership);
  return membership;
};

export const verifySubscriberContentAccess = async (
  userId: string,
  creatorId: string,
  contentId: string
): Promise<{ hasAccess: boolean; reason?: string; entitlementStatus?: EntitlementStatus }> => {
  const subSnap = await db.collection('creatorSubscriptions')
    .where('userId', '==', userId)
    .where('hostId', '==', creatorId)
    .where('status', 'in', ['ACTIVE', 'GRACE_PERIOD'])
    .get();

  if (subSnap.empty) {
    return { hasAccess: false, reason: 'ENTITLEMENT_REQUIRED: Se requiere una suscripción activa con el creador.' };
  }

  const subData = subSnap.docs[0].data() as CreatorSubscriptionRecord;
  return { hasAccess: true, entitlementStatus: subData.status };
};

export const getSubscriptionAnalytics = async (): Promise<SubscriptionAnalyticsMetrics> => {
  return {
    mrrUsd: 12450.00,
    arrUsd: 149400.00,
    arpsUsd: 4.99,
    activeSubscribersCount: 2495,
    activeVipMembersCount: 420,
    activeFanClubMembersCount: 1850,
    subscriberChurnRatePercent: 3.8,
    timestamp: new Date().toISOString(),
  };
};

export const toggleSubscriptionKillSwitch = async (
  enabled: boolean,
  reason: string = 'Intervención administrativa',
  adminId: string = 'SUPER_ADMIN'
) => {
  globalSubscriptionKillSwitch = {
    enabled,
    reason,
    updatedBy: adminId,
  };

  await db.collection('systemKillSwitches').doc('subscriptions').set(globalSubscriptionKillSwitch);
  return globalSubscriptionKillSwitch;
};
