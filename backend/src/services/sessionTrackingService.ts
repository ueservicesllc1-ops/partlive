import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { recordUserLogin, trackAnalyticsEvent } from './analyticsService';
import { getDailyPeriodKey } from '../utils/analyticsPeriods';

const USER_SESSIONS = 'userSessions';
const DAILY_ANALYTICS = 'dailyAnalytics';

export const startUserSession = async (
  userId: string,
  platform: 'android' | 'ios' | 'web' | 'admin',
  appVersion?: string,
  country?: string,
  language?: string,
  deviceId?: string
): Promise<string> => {
  const sessionRef = db.collection(USER_SESSIONS).doc();
  const now = admin.firestore.Timestamp.now();

  const sessionData = {
    id: sessionRef.id,
    userId,
    startedAt: now,
    lastHeartbeatAt: now,
    durationSeconds: 0,
    platform,
    appVersion: appVersion || null,
    country: country || 'CL',
    language: language || 'es',
    deviceId: deviceId || null,
    status: 'active',
  };

  await sessionRef.set(sessionData);

  // In background, increment daily active users (DAU) and track session start
  try {
    const todayKey = getDailyPeriodKey();
    
    // Log user login in analytics
    await recordUserLogin(userId, country || 'CL', language || 'es', platform);
    
    // Track raw session_started event
    await trackAnalyticsEvent(userId, 'session_started', country, language, platform, appVersion, {
      sessionId: sessionRef.id,
      deviceId
    });
  } catch (err) {
    console.error('Failed to update analytics for session start:', err);
  }

  return sessionRef.id;
};

export const heartbeatUserSession = async (sessionId: string): Promise<void> => {
  const sessionRef = db.collection(USER_SESSIONS).doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) return;
  const sessionData = sessionSnap.data()!;

  if (sessionData.status !== 'active') return;

  const now = admin.firestore.Timestamp.now();
  const startedAt = sessionData.startedAt;
  const durationSeconds = Math.max(0, Math.floor((now.toMillis() - startedAt.toMillis()) / 1000));

  await sessionRef.update({
    lastHeartbeatAt: now,
    durationSeconds,
    updatedAt: now,
  });
};

export const endUserSession = async (sessionId: string): Promise<void> => {
  const sessionRef = db.collection(USER_SESSIONS).doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) return;
  const sessionData = sessionSnap.data()!;

  if (sessionData.status !== 'active') return;

  const now = admin.firestore.Timestamp.now();
  const startedAt = sessionData.startedAt;
  const durationSeconds = Math.max(0, Math.floor((now.toMillis() - startedAt.toMillis()) / 1000));

  await sessionRef.update({
    status: 'ended',
    endedAt: now,
    lastHeartbeatAt: now,
    durationSeconds,
    updatedAt: now,
  });
};

export const cleanupAbandonedSessions = async (): Promise<void> => {
  // Query sessions with status 'active' and lastHeartbeatAt older than 10 minutes (600 seconds)
  const tenMinutesAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 10 * 60 * 1000);

  const snap = await db.collection(USER_SESSIONS)
    .where('status', '==', 'active')
    .where('lastHeartbeatAt', '<', tenMinutesAgo)
    .get();

  if (snap.empty) return;

  const batch = db.batch();
  snap.forEach((doc) => {
    const data = doc.data();
    const lastHb = data.lastHeartbeatAt;
    const started = data.startedAt;
    const duration = Math.max(0, Math.floor((lastHb.toMillis() - started.toMillis()) / 1000));

    batch.update(doc.ref, {
      status: 'ended',
      endedAt: lastHb,
      durationSeconds: duration,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
};
