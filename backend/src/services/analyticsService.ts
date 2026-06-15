import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import {
  AnalyticsEventType,
  DailyAnalytics,
  CountryAnalytics,
  HostAnalytics,
  AgencyAnalytics,
  GiftAnalytics
} from '../types/analytics';
import { getDailyPeriodKey } from '../utils/analyticsPeriods';
import { checkMetricsForAlerts } from './analyticsAlertService';

// Track a raw event in Firestore
export const trackAnalyticsEvent = async (
  userId: string | undefined,
  type: AnalyticsEventType,
  country?: string,
  language?: string,
  platform?: 'android' | 'ios' | 'web' | 'admin',
  appVersion?: string,
  metadata?: Record<string, any>
): Promise<string> => {
  try {
    const eventRef = db.collection('analyticsEvents').doc();
    const eventData = {
      id: eventRef.id,
      userId: userId || null,
      type,
      country: country || null,
      language: language || null,
      platform: platform || null,
      appVersion: appVersion || null,
      metadata: metadata || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await eventRef.set(eventData);
    return eventRef.id;
  } catch (error) {
    console.error('Failed to track analytics event:', error);
    return '';
  }
};

// Increment daily metrics atomically
export const incrementDailyMetric = async (
  periodKey: string,
  fields: Partial<Record<keyof DailyAnalytics, number>>
): Promise<void> => {
  try {
    const ref = db.collection('dailyAnalytics').doc(periodKey);
    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    for (const [key, value] of Object.entries(fields)) {
      updateData[key] = admin.firestore.FieldValue.increment(value);
    }

    // Set base fields if document is new
    await ref.set(
      {
        id: periodKey,
        periodKey,
        date: periodKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ...updateData,
      },
      { merge: true }
    );

    // Fetch and check alerts
    const snap = await ref.get();
    if (snap.exists) {
      const currentData = snap.data();
      if (currentData) {
        // Fetch yesterday's metrics
        const prevDate = new Date(new Date(periodKey + 'T00:00:00Z').getTime() - 86400000);
        const prevKey = getDailyPeriodKey(prevDate);
        const prevSnap = await db.collection('dailyAnalytics').doc(prevKey).get();
        const prevData = prevSnap.exists ? prevSnap.data() : undefined;
        await checkMetricsForAlerts(currentData, prevData);
      }
    }
  } catch (error) {
    console.error(`Failed to increment daily metric for period ${periodKey}:`, error);
  }
};

// Increment country-based metrics atomically
export const incrementCountryMetric = async (
  periodKey: string,
  country: string,
  fields: Partial<Record<keyof CountryAnalytics, number>>
): Promise<void> => {
  try {
    const id = `${country}_${periodKey}`;
    const ref = db.collection('countryAnalytics').doc(id);
    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    for (const [key, value] of Object.entries(fields)) {
      updateData[key] = admin.firestore.FieldValue.increment(value);
    }

    await ref.set(
      {
        id,
        periodKey,
        country,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ...updateData,
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`Failed to increment country metric for ${country} / ${periodKey}:`, error);
  }
};

// Increment host metrics atomically
export const incrementHostMetric = async (
  periodKey: string,
  hostId: string,
  fields: Partial<Record<keyof HostAnalytics, number>>
): Promise<void> => {
  try {
    const id = `${hostId}_${periodKey}`;
    const ref = db.collection('hostAnalytics').doc(id);
    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    for (const [key, value] of Object.entries(fields)) {
      updateData[key] = admin.firestore.FieldValue.increment(value);
    }

    await ref.set(
      {
        id,
        hostId,
        periodKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ...updateData,
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`Failed to increment host metric for host ${hostId} / ${periodKey}:`, error);
  }
};

// Increment agency metrics atomically
export const incrementAgencyMetric = async (
  periodKey: string,
  agencyId: string,
  fields: Partial<Record<keyof AgencyAnalytics, number>>
): Promise<void> => {
  try {
    const id = `${agencyId}_${periodKey}`;
    const ref = db.collection('agencyAnalytics').doc(id);
    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    for (const [key, value] of Object.entries(fields)) {
      updateData[key] = admin.firestore.FieldValue.increment(value);
    }

    await ref.set(
      {
        id,
        agencyId,
        periodKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ...updateData,
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`Failed to increment agency metric for agency ${agencyId} / ${periodKey}:`, error);
  }
};

// Increment gift metrics atomically
export const incrementGiftMetric = async (
  periodKey: string,
  giftId: string,
  giftName: string,
  fields: Partial<Record<keyof GiftAnalytics, number>>
): Promise<void> => {
  try {
    const id = `${giftId}_${periodKey}`;
    const ref = db.collection('giftAnalytics').doc(id);
    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    for (const [key, value] of Object.entries(fields)) {
      updateData[key] = admin.firestore.FieldValue.increment(value);
    }

    await ref.set(
      {
        id,
        giftId,
        giftName,
        periodKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ...updateData,
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`Failed to increment gift metric for gift ${giftId} / ${periodKey}:`, error);
  }
};

// Aggregators called from other services
export const recordUserRegistered = async (
  userId: string,
  country: string,
  language: string,
  platform: 'android' | 'ios' | 'web' | 'admin'
) => {
  const periodKey = getDailyPeriodKey();
  await trackAnalyticsEvent(userId, 'user_registered', country, language, platform);
  await incrementDailyMetric(periodKey, { usersRegistered: 1, newUsers: 1 });
  await incrementCountryMetric(periodKey, country, { newUsers: 1 });
};

export const recordUserLogin = async (
  userId: string,
  country: string,
  language: string,
  platform: 'android' | 'ios' | 'web' | 'admin'
) => {
  const periodKey = getDailyPeriodKey();
  await trackAnalyticsEvent(userId, 'user_login', country, language, platform);
  await incrementDailyMetric(periodKey, { activeUsers: 1 });
  await incrementCountryMetric(periodKey, country, { activeUsers: 1 });
};

export const recordDiamondPurchase = async (
  userId: string,
  diamonds: number,
  revenueUsd: number,
  country: string
) => {
  const periodKey = getDailyPeriodKey();
  await trackAnalyticsEvent(userId, 'diamond_purchase', country, undefined, undefined, undefined, {
    diamonds,
    revenueUsd,
  });

  const grossEarnings = revenueUsd;
  // Let's assume standard gross margins
  await incrementDailyMetric(periodKey, {
    diamondsSold: diamonds,
    revenueUsd: revenueUsd,
    payingUsers: 1,
    platformEstimatedGrossUsd: grossEarnings,
  });

  await incrementCountryMetric(periodKey, country, {
    revenueUsd: revenueUsd,
    diamondsSold: diamonds,
  });
};

export const recordGiftSent = async (
  senderId: string,
  receiverId: string,
  giftId: string,
  giftName: string,
  diamonds: number,
  beans: number,
  senderCountry: string,
  receiverCountry: string,
  agencyId?: string
) => {
  const periodKey = getDailyPeriodKey();
  await trackAnalyticsEvent(senderId, 'gift_sent', senderCountry, undefined, undefined, undefined, {
    receiverId,
    giftId,
    giftName,
    diamonds,
    beans,
    agencyId,
  });

  // Daily statistics
  await incrementDailyMetric(periodKey, {
    giftsSent: 1,
    diamondsSpent: diamonds,
    beansGenerated: beans,
  });

  // Sender country metrics
  await incrementCountryMetric(periodKey, senderCountry, {
    giftsSent: 1,
  });

  // Host receiver metrics
  await incrementHostMetric(periodKey, receiverId, {
    giftsReceived: 1,
    diamondsReceived: diamonds,
    beansGenerated: beans,
  });

  // Gift item specific metric
  await incrementGiftMetric(periodKey, giftId, giftName, {
    sentCount: 1,
    totalDiamonds: diamonds,
    totalBeansGenerated: beans,
    uniqueSenders: 1, // incremental approximation
    uniqueReceivers: 1,
  });

  // Agency commission tracking if host is in an agency
  if (agencyId) {
    await incrementAgencyMetric(periodKey, agencyId, {
      diamondsGenerated: diamonds,
      hostBeansGenerated: beans,
    });
  }
};

export const recordLiveMinutes = async (
  hostId: string,
  minutes: number,
  country: string,
  viewersCount: number
) => {
  const periodKey = getDailyPeriodKey();
  await trackAnalyticsEvent(hostId, 'host_live_minutes', country, undefined, undefined, undefined, {
    minutes,
    viewersCount,
  });

  const hours = minutes / 60;
  await incrementDailyMetric(periodKey, {
    liveHours: hours,
    livesStarted: 1,
    activeHosts: 1,
  });

  await incrementCountryMetric(periodKey, country, {
    hostsActive: 1,
  });

  await incrementHostMetric(periodKey, hostId, {
    liveMinutes: minutes,
    activeDays: 1,
    // Note: peakViewers / averageViewers logic is usually set/updated via transactions or max
    peakViewers: viewersCount,
  });
};

export const recordPayoutRequested = async (
  userId: string,
  amountUsd: number,
  beans: number
) => {
  const periodKey = getDailyPeriodKey();
  await trackAnalyticsEvent(userId, 'payout_requested', undefined, undefined, undefined, undefined, {
    amountUsd,
    beans,
  });

  await incrementDailyMetric(periodKey, {
    payoutsRequestedUsd: amountUsd,
  });
};

export const recordPayoutPaid = async (
  userId: string,
  amountUsd: number,
  beans: number
) => {
  const periodKey = getDailyPeriodKey();
  await trackAnalyticsEvent(userId, 'payout_paid', undefined, undefined, undefined, undefined, {
    amountUsd,
    beans,
  });

  await incrementDailyMetric(periodKey, {
    payoutsPaidUsd: amountUsd,
  });
};

export const recordVipPurchase = async (
  userId: string,
  planId: string,
  priceUsd: number,
  country: string
) => {
  const periodKey = getDailyPeriodKey();
  await trackAnalyticsEvent(userId, 'vip_purchase', country, undefined, undefined, undefined, {
    planId,
    priceUsd,
  });

  await incrementDailyMetric(periodKey, {
    vipPurchases: 1,
    activeVipUsers: 1,
    revenueUsd: priceUsd,
    platformEstimatedGrossUsd: priceUsd,
  });

  await incrementCountryMetric(periodKey, country, {
    revenueUsd: priceUsd,
  });
};

export const recordAgencyCommission = async (
  agencyId: string,
  hostId: string,
  beans: number,
  diamonds: number
) => {
  const periodKey = getDailyPeriodKey();
  await trackAnalyticsEvent(agencyId, 'agency_commission_created', undefined, undefined, undefined, undefined, {
    hostId,
    beans,
    diamonds,
  });

  await incrementDailyMetric(periodKey, {
    agencyCommissionsBeans: beans,
  });

  await incrementAgencyMetric(periodKey, agencyId, {
    agencyBeansEarned: beans,
    commissionsCount: 1,
  });
};

export const recordFraudSignal = async (
  userId: string,
  score: number,
  reason: string
) => {
  const periodKey = getDailyPeriodKey();
  await trackAnalyticsEvent(userId, 'fraud_signal_created', undefined, undefined, undefined, undefined, {
    score,
    reason,
  });

  await incrementDailyMetric(periodKey, {
    fraudSignals: 1,
  });
};

// Data Retrieval Helpers
export const getAdminAnalyticsSummary = async (limitDays: number = 30): Promise<DailyAnalytics[]> => {
  const snap = await db.collection('dailyAnalytics')
    .orderBy('date', 'desc')
    .limit(limitDays)
    .get();

  return snap.docs.map(doc => doc.data() as DailyAnalytics);
};

export const getRevenueAnalytics = async (limitDays: number = 30) => {
  const summary = await getAdminAnalyticsSummary(limitDays);
  return summary.map(day => ({
    date: day.date,
    revenueUsd: day.revenueUsd || 0,
    diamondsSold: day.diamondsSold || 0,
    diamondsSpent: day.diamondsSpent || 0,
    platformEstimatedGrossUsd: day.platformEstimatedGrossUsd || 0,
    hostEstimatedEarningsUsd: day.hostEstimatedEarningsUsd || 0,
    agencyEstimatedEarningsUsd: day.agencyEstimatedEarningsUsd || 0,
    payoutsRequestedUsd: day.payoutsRequestedUsd || 0,
    payoutsPaidUsd: day.payoutsPaidUsd || 0,
  }));
};

export const getHostAnalyticsSummary = async (hostId: string, limit: number = 10): Promise<HostAnalytics[]> => {
  const snap = await db.collection('hostAnalytics')
    .where('hostId', '==', hostId)
    .orderBy('periodKey', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(doc => doc.data() as HostAnalytics);
};

export const getAgencyAnalyticsSummary = async (agencyId: string, limit: number = 10): Promise<AgencyAnalytics[]> => {
  const snap = await db.collection('agencyAnalytics')
    .where('agencyId', '==', agencyId)
    .orderBy('periodKey', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(doc => doc.data() as AgencyAnalytics);
};

export const getCountryAnalyticsSummary = async (limit: number = 30): Promise<CountryAnalytics[]> => {
  const snap = await db.collection('countryAnalytics')
    .orderBy('periodKey', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(doc => doc.data() as CountryAnalytics);
};

export const getGiftAnalyticsSummary = async (limit: number = 30): Promise<GiftAnalytics[]> => {
  const snap = await db.collection('giftAnalytics')
    .orderBy('periodKey', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(doc => doc.data() as GiftAnalytics);
};

// Rebuild utility to regenerate daily analytics from raw events if needed
export const rebuildDailyAnalyticsFromEvents = async (periodKey: string): Promise<void> => {
  // Simple check and recalculation placeholder for admin panel operations
  console.log(`Rebuilding analytics stats for period ${periodKey}...`);
  // Query all raw events for this date range
  const start = new Date(periodKey + 'T00:00:00Z');
  const end = new Date(periodKey + 'T23:59:59Z');

  const snap = await db.collection('analyticsEvents')
    .where('createdAt', '>=', start)
    .where('createdAt', '<=', end)
    .get();

  let usersRegistered = 0;
  let newUsers = 0;
  let activeUsers = new Set();
  let diamondsSold = 0;
  let revenueUsd = 0;
  let giftsSent = 0;
  let diamondsSpent = 0;
  let beansGenerated = 0;
  let fraudSignals = 0;

  snap.forEach(doc => {
    const data = doc.data();
    if (data.userId) activeUsers.add(data.userId);

    if (data.type === 'user_registered') {
      usersRegistered++;
      newUsers++;
    } else if (data.type === 'diamond_purchase') {
      diamondsSold += data.metadata?.diamonds || 0;
      revenueUsd += data.metadata?.revenueUsd || 0;
    } else if (data.type === 'gift_sent') {
      giftsSent++;
      diamondsSpent += data.metadata?.diamonds || 0;
      beansGenerated += data.metadata?.beans || 0;
    } else if (data.type === 'fraud_signal_created') {
      fraudSignals++;
    }
  });

  const ref = db.collection('dailyAnalytics').doc(periodKey);
  await ref.set({
    id: periodKey,
    periodKey,
    date: periodKey,
    usersRegistered,
    newUsers,
    activeUsers: activeUsers.size,
    diamondsSold,
    diamondsSpent,
    revenueUsd,
    giftsSent,
    beansGenerated,
    fraudSignals,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};
