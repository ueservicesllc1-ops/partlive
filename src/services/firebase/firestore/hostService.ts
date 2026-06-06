import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { HostApplication, HostStats, HostActivity, HostRule } from '../../../types';
import { nowServerTimestamp } from '../../../utils/firestoreDates';

// ─── Host Application ─────────────────────────────────────────────────────────

/**
 * Get the most recent host application for a user.
 */
export const getUserHostApplication = async (userId: string): Promise<HostApplication | null> => {
  const snap = await firestore()
    .collection(FirestoreCollections.HOST_APPLICATIONS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as HostApplication;
  }
  return null;
};

/**
 * Listen in real-time to the user's most recent host application.
 */
export const listenToUserHostApplication = (
  userId: string,
  callback: (application: HostApplication | null) => void
) => {
  return firestore()
    .collection(FirestoreCollections.HOST_APPLICATIONS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .onSnapshot(snap => {
      if (!snap.empty) {
        callback({ id: snap.docs[0].id, ...snap.docs[0].data() } as HostApplication);
      } else {
        callback(null);
      }
    });
};

/**
 * Create a new host application. Status is always 'pending' on creation.
 * Throws if the user already has a pending application.
 */
export const createHostApplication = async (
  data: Omit<HostApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  // Check for existing pending application
  const existing = await getUserHostApplication(data.userId);
  if (existing && existing.status === 'pending') {
    throw new Error('Ya tienes una solicitud en revisión.');
  }
  const ref = await firestore().collection(FirestoreCollections.HOST_APPLICATIONS).add({
    ...data,
    status: 'pending',
    createdAt: nowServerTimestamp(),
    updatedAt: nowServerTimestamp(),
  });
  return ref.id;
};

/**
 * [Admin only — use backend] Update host application status.
 */
export const getPendingHostApplications = async (): Promise<HostApplication[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.HOST_APPLICATIONS)
    .where('status', '==', 'pending')
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostApplication));
};

// ─── Host Stats ───────────────────────────────────────────────────────────────

/**
 * Get host stats document by hostId. Returns null if not yet created.
 */
export const getHostStats = async (hostId: string): Promise<HostStats | null> => {
  const doc = await firestore()
    .collection(FirestoreCollections.HOST_STATS)
    .doc(hostId)
    .get();
  if (doc.exists()) {
    return { id: doc.id, ...doc.data() } as HostStats;
  }
  return null;
};

/**
 * Listen in real-time to host stats.
 */
export const listenToHostStats = (
  hostId: string,
  callback: (stats: HostStats | null) => void
) => {
  return firestore()
    .collection(FirestoreCollections.HOST_STATS)
    .doc(hostId)
    .onSnapshot(doc => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as HostStats);
      } else {
        callback(null);
      }
    });
};

// ─── Host Activities ──────────────────────────────────────────────────────────

/**
 * Get host activities ordered by date descending.
 */
export const getHostActivities = async (
  hostId: string,
  limitCount = 50
): Promise<HostActivity[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.HOST_ACTIVITIES)
    .where('hostId', '==', hostId)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostActivity));
};

/**
 * Listen in real-time to host activities.
 */
export const listenToHostActivities = (
  hostId: string,
  callback: (activities: HostActivity[]) => void,
  limitCount = 50
) => {
  return firestore()
    .collection(FirestoreCollections.HOST_ACTIVITIES)
    .where('hostId', '==', hostId)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .onSnapshot(snap => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostActivity)));
    });
};

/**
 * Create a host activity (client-side for live/room events).
 * In production this should be moved to Cloud Functions / backend.
 */
export const createHostActivityClient = async (
  data: Omit<HostActivity, 'id' | 'createdAt'>
): Promise<string> => {
  const ref = await firestore().collection(FirestoreCollections.HOST_ACTIVITIES).add({
    ...data,
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

// ─── Host Rules ───────────────────────────────────────────────────────────────

/**
 * Get host program rules from Firestore.
 */
export const getHostRules = async (): Promise<HostRule[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.HOST_RULES)
    .where('isActive', '==', true)
    .orderBy('sortOrder', 'asc')
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostRule));
};

/**
 * Listen in real-time to host rules.
 */
export const listenToHostRules = (callback: (rules: HostRule[]) => void) => {
  return firestore()
    .collection(FirestoreCollections.HOST_RULES)
    .where('isActive', '==', true)
    .orderBy('sortOrder', 'asc')
    .onSnapshot(snap => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HostRule)));
    });
};

// ─── Host Payout (App-side read only) ────────────────────────────────────────

/**
 * [Legacy] kept for backward compatibility.
 */
export const updateHostApplicationStatus = async (
  applicationId: string,
  status: HostApplication['status'],
  reviewerId?: string,
  note?: string
): Promise<void> => {
  await firestore().collection(FirestoreCollections.HOST_APPLICATIONS).doc(applicationId).update({
    status,
    reviewedBy: reviewerId,
    reviewNote: note,
    updatedAt: nowServerTimestamp(),
  });
};
