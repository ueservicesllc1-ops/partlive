import * as admin from 'firebase-admin';
import { db } from '../config/firebase';

const HOST_APPLICATIONS = 'hostApplications';
const HOST_STATS = 'hostStats';
const HOST_ACTIVITIES = 'hostActivities';
const USERS = 'users';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ensure a hostStats document exists for a host. Creates a default one if missing.
 */
export const ensureHostStats = async (hostId: string): Promise<void> => {
  const ref = db.collection(HOST_STATS).doc(hostId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      hostId,
      totalDiamondsEarned: 0,
      availableDiamonds: 0,
      pendingDiamonds: 0,
      lockedDiamonds: 0,
      totalGiftsReceived: 0,
      totalLives: 0,
      totalRooms: 0,
      totalLiveMinutes: 0,
      totalRoomMinutes: 0,
      followersGained: 0,
      bestRankingPosition: null,
      currentDailyRank: null,
      currentWeeklyRank: null,
      averageViewers: 0,
      peakViewers: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
};

/**
 * Create a host activity log entry.
 */
export const createHostActivity = async (data: {
  hostId: string;
  type: string;
  title: string;
  description?: string;
  diamondsDelta?: number;
  relatedLiveId?: string;
  relatedRoomId?: string;
  relatedGiftEventId?: string;
}): Promise<string> => {
  const ref = await db.collection(HOST_ACTIVITIES).add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
};

// ─── Application Management ───────────────────────────────────────────────────

/**
 * Approve a host application.
 * - Updates application status to 'approved'
 * - Sets user.isHost = true, user.role = 'host' (if was 'user')
 * - Creates hostStats document
 * - Creates a 'system' activity with approval message
 */
export const approveHostApplication = async (
  applicationId: string,
  reviewerId: string,
  note?: string
): Promise<void> => {
  const appRef = db.collection(HOST_APPLICATIONS).doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new Error('Application not found');

  const appData = appSnap.data()!;
  const userId = appData.userId;
  const userRef = db.collection(USERS).doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error('User not found');

  const userData = userSnap.data()!;

  await db.runTransaction(async (transaction) => {
    // Update application
    transaction.update(appRef, {
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewNote: note || 'Aprobado por el equipo de PartyLive.',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Promote user
    transaction.update(userRef, {
      isHost: true,
      role: userData.role === 'user' ? 'host' : userData.role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  // Ensure hostStats doc
  await ensureHostStats(userId);

  // Create activity
  await createHostActivity({
    hostId: userId,
    type: 'system',
    title: '¡Solicitud aprobada!',
    description: note || 'Tu solicitud para ser host fue aprobada. ¡Bienvenido al programa!',
  });
};

/**
 * Reject a host application.
 */
export const rejectHostApplication = async (
  applicationId: string,
  reviewerId: string,
  note?: string
): Promise<void> => {
  const appRef = db.collection(HOST_APPLICATIONS).doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new Error('Application not found');

  const appData = appSnap.data()!;
  const userId = appData.userId;

  await appRef.update({
    status: 'rejected',
    reviewedBy: reviewerId,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewNote: note || 'Tu solicitud no cumple los requisitos actuales.',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify via activity
  await createHostActivity({
    hostId: userId,
    type: 'system',
    title: 'Solicitud no aprobada',
    description: note || 'Tu solicitud fue revisada y no fue aprobada en esta ocasión.',
  });
};

/**
 * Suspend a host.
 */
export const suspendHost = async (
  hostId: string,
  reviewerId: string,
  reason?: string
): Promise<void> => {
  const userRef = db.collection(USERS).doc(hostId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error('User not found');

  await userRef.update({
    isHost: false,
    status: 'suspended',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await createHostActivity({
    hostId,
    type: 'warning',
    title: 'Cuenta suspendida',
    description: reason || 'Tu cuenta de host ha sido suspendida temporalmente.',
  });
};

// ─── Stats Updates ────────────────────────────────────────────────────────────

/**
 * Update host stats when a gift is received.
 * Called from gift processing pipeline.
 */
export const updateHostStatsFromGift = async (
  hostId: string,
  diamonds: number,
  giftEventId: string
): Promise<void> => {
  await ensureHostStats(hostId);
  const statsRef = db.collection(HOST_STATS).doc(hostId);

  await statsRef.update({
    totalDiamondsEarned: admin.firestore.FieldValue.increment(diamonds),
    availableDiamonds: admin.firestore.FieldValue.increment(diamonds),
    totalGiftsReceived: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await createHostActivity({
    hostId,
    type: 'gift_received',
    title: `+${diamonds} diamonds recibidos`,
    description: 'Recibiste un regalo de un espectador.',
    diamondsDelta: diamonds,
    relatedGiftEventId: giftEventId,
  });
};

/**
 * Update host stats when a live stream ends.
 */
export const updateHostStatsFromLive = async (
  hostId: string,
  liveId: string,
  durationMinutes: number,
  peakViewers: number
): Promise<void> => {
  await ensureHostStats(hostId);
  const statsRef = db.collection(HOST_STATS).doc(hostId);
  const statsSnap = await statsRef.get();
  const current = statsSnap.data() || {};

  await statsRef.update({
    totalLives: admin.firestore.FieldValue.increment(1),
    totalLiveMinutes: admin.firestore.FieldValue.increment(durationMinutes),
    peakViewers: Math.max(current.peakViewers || 0, peakViewers),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await createHostActivity({
    hostId,
    type: 'live_ended',
    title: 'Live finalizado',
    description: `Duración: ${durationMinutes} min. Pico: ${peakViewers} espectadores.`,
    relatedLiveId: liveId,
  });
};

/**
 * Update host stats when a room session ends.
 */
export const updateHostStatsFromRoom = async (
  hostId: string,
  roomId: string,
  durationMinutes: number,
  peakListeners: number
): Promise<void> => {
  await ensureHostStats(hostId);
  const statsRef = db.collection(HOST_STATS).doc(hostId);

  await statsRef.update({
    totalRooms: admin.firestore.FieldValue.increment(1),
    totalRoomMinutes: admin.firestore.FieldValue.increment(durationMinutes),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await createHostActivity({
    hostId,
    type: 'room_ended',
    title: 'Sala finalizada',
    description: `Duración: ${durationMinutes} min. Pico: ${peakListeners} oyentes.`,
    relatedRoomId: roomId,
  });
};

// ─── Admin Helpers ────────────────────────────────────────────────────────────

/**
 * Check if a Firestore user document has admin or moderator role.
 */
export const isAdminOrModerator = async (uid: string): Promise<boolean> => {
  const doc = await db.collection(USERS).doc(uid).get();
  if (!doc.exists) return false;
  const role = doc.data()?.role;
  return role === 'admin' || role === 'moderator';
};
