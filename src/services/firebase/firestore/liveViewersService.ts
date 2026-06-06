import firestore from '@react-native-firebase/firestore';
import { LiveViewer } from '../../../types/live';
import { getLiveViewersPath, FirestoreCollections } from '../../../constants/firestoreCollections';
import { getLiveById } from './livesService';

/**
 * Get all current viewers of a stream.
 */
export const getLiveViewers = async (liveId: string): Promise<LiveViewer[]> => {
  const snap = await firestore()
    .collection(getLiveViewersPath(liveId))
    .orderBy('joinedAt', 'desc')
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveViewer));
};

/**
 * Listen to live viewers in real-time.
 */
export const listenToLiveViewers = (liveId: string, callback: (viewers: LiveViewer[]) => void) => {
  return firestore()
    .collection(getLiveViewersPath(liveId))
    .orderBy('joinedAt', 'desc')
    .onSnapshot(snap => {
      if (snap) {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveViewer)));
      }
    });
};

/**
 * Helper to get direct viewer document.
 */
const getViewerDirect = async (liveId: string, userId: string): Promise<LiveViewer | null> => {
  const doc = await firestore().collection(getLiveViewersPath(liveId)).doc(userId).get();
  return doc.exists() ? (doc.data() as LiveViewer) : null;
};

/**
 * Check if user is host.
 */
const checkIsHost = async (liveId: string, userId: string): Promise<boolean> => {
  const live = await getLiveById(liveId);
  return live?.hostId === userId;
};

/**
 * Promote a viewer to moderator.
 */
export const addLiveModerator = async (liveId: string, targetUserId: string, actorUserId: string): Promise<void> => {
  const isHost = await checkIsHost(liveId, actorUserId);
  if (!isHost) throw new Error('Solo el host puede agregar moderadores.');

  const db = firestore();
  const liveRef = db.collection(FirestoreCollections.LIVES).doc(liveId);
  const viewerRef = db.collection(getLiveViewersPath(liveId)).doc(targetUserId);

  await db.runTransaction(async transaction => {
    const liveSnap = await transaction.get(liveRef);
    if (!liveSnap.exists()) return;
    const liveData = liveSnap.data() || {};
    const moderators: string[] = liveData.moderatorIds || [];

    if (!moderators.includes(targetUserId)) {
      transaction.update(liveRef, {
        moderatorIds: [...moderators, targetUserId],
      });
      transaction.update(viewerRef, {
        role: 'moderator',
        lastActiveAt: firestore.FieldValue.serverTimestamp(),
      });
    }
  });
};

/**
 * Demote/remove a moderator to regular viewer.
 */
export const removeLiveModerator = async (liveId: string, targetUserId: string, actorUserId: string): Promise<void> => {
  const isHost = await checkIsHost(liveId, actorUserId);
  if (!isHost) throw new Error('Solo el host puede quitar moderadores.');

  const db = firestore();
  const liveRef = db.collection(FirestoreCollections.LIVES).doc(liveId);
  const viewerRef = db.collection(getLiveViewersPath(liveId)).doc(targetUserId);

  await db.runTransaction(async transaction => {
    const liveSnap = await transaction.get(liveRef);
    if (!liveSnap.exists()) return;
    const liveData = liveSnap.data() || {};
    const moderators: string[] = liveData.moderatorIds || [];

    transaction.update(liveRef, {
      moderatorIds: moderators.filter(id => id !== targetUserId),
    });
    transaction.update(viewerRef, {
      role: 'viewer',
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    });
  });
};

/**
 * Mute/unmute a viewer.
 */
export const muteLiveViewer = async (
  liveId: string,
  targetUserId: string,
  actorUserId: string,
  muted: boolean
): Promise<void> => {
  const isHost = await checkIsHost(liveId, actorUserId);
  const actorViewer = await getViewerDirect(liveId, actorUserId);
  const targetViewer = await getViewerDirect(liveId, targetUserId);

  if (!targetViewer) throw new Error('Viewer no encontrado.');
  
  // Host can mute everyone; moderators can only mute viewers
  const isModerator = actorViewer?.role === 'moderator';
  const hasPermission = isHost || (isModerator && targetViewer.role === 'viewer');

  if (!hasPermission) {
    throw new Error('No tienes permisos suficientes para silenciar a este usuario.');
  }

  await firestore()
    .collection(getLiveViewersPath(liveId))
    .doc(targetUserId)
    .update({
      isMuted: muted,
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    });
};

/**
 * Kick / Ban viewer from live stream.
 */
export const kickLiveViewer = async (liveId: string, targetUserId: string, actorUserId: string): Promise<void> => {
  const isHost = await checkIsHost(liveId, actorUserId);
  const actorViewer = await getViewerDirect(liveId, actorUserId);
  const targetViewer = await getViewerDirect(liveId, targetUserId);

  if (!targetViewer) throw new Error('Viewer no encontrado.');

  const isModerator = actorViewer?.role === 'moderator';
  const hasPermission = isHost || (isModerator && targetViewer.role === 'viewer');

  if (!hasPermission) {
    throw new Error('No tienes permisos para expulsar a este miembro.');
  }

  const db = firestore();
  const viewerRef = db.collection(getLiveViewersPath(liveId)).doc(targetUserId);

  await db.runTransaction(async transaction => {
    transaction.update(viewerRef, {
      role: 'viewer',
      isBannedFromLive: true,
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    });
  });
};

/**
 * Retrieve current user live streaming role.
 */
export const getCurrentUserLiveRole = async (liveId: string, userId: string): Promise<LiveViewer['role'] | null> => {
  const doc = await firestore().collection(getLiveViewersPath(liveId)).doc(userId).get();
  if (doc.exists()) {
    return (doc.data() as LiveViewer).role;
  }
  return null;
};
