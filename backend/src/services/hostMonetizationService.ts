import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { HOST_LEVELS } from '../constants/hostLevels';
import { HostLevel } from '../types/host';

/**
 * Calculates a host's current level based on their stats.
 */
export const calculateHostLevel = async (hostId: string): Promise<HostLevel> => {
  const hostStatsRef = db.collection('hostStats').doc(hostId);
  const hostStatsSnap = await hostStatsRef.get();
  
  if (!hostStatsSnap.exists) {
    return 'initial';
  }

  const stats = hostStatsSnap.data()!;
  
  // Gold requirements
  const gold = HOST_LEVELS.find((l: any) => l.id === 'gold')!;
  if (
    stats.followersCount >= gold.minFollowers &&
    stats.monthlyLiveHours >= gold.minLiveHoursMonthly &&
    stats.monthlyActiveDays >= gold.minActiveDaysMonthly &&
    stats.averageViewers >= gold.minAverageViewers &&
    stats.monthlyDiamondsReceived >= gold.minDiamondsMonthly
  ) {
    return 'gold';
  }

  // Silver requirements
  const silver = HOST_LEVELS.find((l: any) => l.id === 'silver')!;
  if (
    stats.followersCount >= silver.minFollowers &&
    stats.monthlyLiveHours >= silver.minLiveHoursMonthly &&
    stats.monthlyActiveDays >= silver.minActiveDaysMonthly &&
    stats.averageViewers >= silver.minAverageViewers &&
    stats.monthlyDiamondsReceived >= silver.minDiamondsMonthly
  ) {
    return 'silver';
  }

  return 'initial';
};

/**
 * Updates host monetization eligibility based on requirements.
 */
export const updateHostEligibility = async (hostId: string): Promise<boolean> => {
  const level = await calculateHostLevel(hostId);
  const hostStatsRef = db.collection('hostStats').doc(hostId);
  const hostStatsSnap = await hostStatsRef.get();

  if (!hostStatsSnap.exists) return false;
  const stats = hostStatsSnap.data()!;

  // Eligibility rules: Gold & Silver hosts are eligible automatically. Initial hosts must meet some basic thresholds.
  const initialReq = HOST_LEVELS.find((l: any) => l.id === 'initial')!;
  
  const meetsInitial = 
    stats.followersCount >= initialReq.minFollowers &&
    stats.monthlyLiveHours >= initialReq.minLiveHoursMonthly &&
    stats.monthlyActiveDays >= initialReq.minActiveDaysMonthly &&
    stats.averageViewers >= initialReq.minAverageViewers;

  const eligible = level === 'gold' || level === 'silver' || meetsInitial;

  await hostStatsRef.update({
    currentLevel: level,
    eligibleForPayout: eligible,
    eligibilityUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return eligible;
};

/**
 * Returns the commission/share rate for a host (defaulting to 35% for initial).
 */
export const getHostCommissionRate = async (hostId: string): Promise<number> => {
  const hostStatsSnap = await db.collection('hostStats').doc(hostId).get();
  if (!hostStatsSnap.exists) return 35; // default 35% for Host Inicial
  
  const currentLevel = hostStatsSnap.data()?.currentLevel || 'initial';
  const levelDef = HOST_LEVELS.find((l: any) => l.id === currentLevel) || HOST_LEVELS[0];
  return levelDef.hostSharePercent;
};

/**
 * Calculates the amount of beans a host receives for a given diamonds spending.
 */
export const calculateBeansForGift = async (hostId: string, giftPriceDiamonds: number): Promise<number> => {
  const rate = await getHostCommissionRate(hostId);
  // 1 Diamond spent = 1 Bean value base * share percent
  return Math.floor(giftPriceDiamonds * (rate / 100));
};

/**
 * Recalculates all host stats for a month.
 */
export const recalculateMonthlyHostStats = async (hostId: string): Promise<void> => {
  // In a real app this pulls from actual live stream sessions and follows collections
  // Mocking aggregation for simplicity:
  const userSnap = await db.collection('users').doc(hostId).get();
  if (!userSnap.exists) return;
  const user = userSnap.data()!;

  const hostStatsRef = db.collection('hostStats').doc(hostId);
  const hostStatsSnap = await hostStatsRef.get();

  const baseStats = hostStatsSnap.exists ? hostStatsSnap.data()! : {};

  await hostStatsRef.set({
    ...baseStats,
    hostId,
    followersCount: user.followersCount || 0,
    monthlyLiveHours: baseStats.monthlyLiveHours || 25, // mock active hours
    monthlyActiveDays: baseStats.monthlyActiveDays || 12,
    averageViewers: baseStats.averageViewers || 18,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await updateHostEligibility(hostId);
};

/**
 * Batch recalculate levels for all hosts.
 */
export const recalculateAllHostLevels = async (): Promise<number> => {
  const hostsSnap = await db.collection('users').where('role', '==', 'host').get();
  for (const doc of hostsSnap.docs) {
    await recalculateMonthlyHostStats(doc.id);
  }
  return hostsSnap.size;
};
