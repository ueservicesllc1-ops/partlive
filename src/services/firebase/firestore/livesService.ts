import firestore from '@react-native-firebase/firestore';
import { LiveStream, LiveViewer } from '../../../types/live';
import { FirestoreCollections, getLiveViewersPath } from '../../../constants/firestoreCollections';

/**
 * Fetch active live streams.
 */
export const getLiveStreams = async (): Promise<LiveStream[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.LIVES)
    .where('status', '==', 'live')
    .orderBy('viewersCount', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveStream));
};

/**
 * Fetch a specific live stream by its ID.
 */
export const getLiveById = async (id: string): Promise<LiveStream | null> => {
  const doc = await firestore().collection(FirestoreCollections.LIVES).doc(id).get();
  if (doc.exists()) {
    return { id: doc.id, ...doc.data() } as LiveStream;
  }
  return null;
};

/**
 * Fetch live streams by category.
 */
export const getLivesByCategory = async (category: string): Promise<LiveStream[]> => {
  if (category.toLowerCase() === 'popular') {
    return getLiveStreams();
  }
  const snapshot = await firestore()
    .collection(FirestoreCollections.LIVES)
    .where('status', '==', 'live')
    .where('category', '==', category)
    .orderBy('viewersCount', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveStream));
};

/**
 * Search active live streams by title or tags.
 */
export const searchLives = async (query: string): Promise<LiveStream[]> => {
  const allStreams = await getLiveStreams();
  if (!query) return allStreams;
  const lowerQuery = query.toLowerCase();
  return allStreams.filter(stream => 
    stream.title.toLowerCase().includes(lowerQuery) || 
    (stream.tags && stream.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
    stream.hostName.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Creates a new live stream document and registers the host as the first viewer.
 */
export const createLive = async (
  hostProfile: { uid: string; displayName?: string; name?: string; username?: string; photoURL?: string },
  data: Partial<Omit<LiveStream, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  const db = firestore();
  const timestamp = firestore.FieldValue.serverTimestamp();
  const liveRef = db.collection(FirestoreCollections.LIVES).doc();
  const liveId = liveRef.id;

  const liveData: Omit<LiveStream, 'id'> = {
    hostId: hostProfile.uid,
    hostName: hostProfile.displayName || hostProfile.name || 'Host',
    hostUsername: hostProfile.username || '',
    hostPhotoURL: hostProfile.photoURL || '',
    title: data.title || 'Live Stream sin título',
    description: data.description || '',
    category: data.category || 'Popular',
    thumbnailUrl: data.thumbnailUrl || '',
    country: data.country || 'CL',
    language: data.language || 'es',
    tags: data.tags || [],
    viewersCount: 1,
    peakViewersCount: 1,
    likesCount: 0,
    giftsCount: 0,
    diamondsEarned: 0,
    status: 'live',
    isPrivate: data.isPrivate || false,
    allowChat: data.allowChat !== undefined ? data.allowChat : true,
    allowGifts: data.allowGifts !== undefined ? data.allowGifts : true,
    moderatorIds: [],
    startedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const hostViewer: LiveViewer = {
    id: hostProfile.uid,
    liveId,
    userId: hostProfile.uid,
    displayName: hostProfile.displayName || hostProfile.name || 'Host',
    username: hostProfile.username || '',
    photoURL: hostProfile.photoURL || '',
    role: 'host',
    joinedAt: timestamp,
    lastActiveAt: timestamp,
    isMuted: false,
    isBannedFromLive: false,
  };

  // Perform inside write batch
  const batch = db.batch();
  batch.set(liveRef, liveData);
  batch.set(db.collection(getLiveViewersPath(liveId)).doc(hostProfile.uid), hostViewer);
  await batch.commit();

  return liveId;
};

/**
 * Generic live stream update.
 */
export const updateLive = async (id: string, data: Partial<LiveStream>): Promise<void> => {
  await firestore().collection(FirestoreCollections.LIVES).doc(id).update({
    ...data,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Safely updates viewers counts inside transaction.
 */
export const updateLiveCounts = async (liveId: string): Promise<void> => {
  const db = firestore();
  const liveRef = db.collection(FirestoreCollections.LIVES).doc(liveId);
  const viewersSnap = await db.collection(getLiveViewersPath(liveId)).get();
  const currentCount = viewersSnap.size;

  await db.runTransaction(async transaction => {
    const liveSnap = await transaction.get(liveRef);
    if (!liveSnap.exists()) return;

    const liveData = liveSnap.data() as LiveStream;
    const peak = Math.max(liveData.peakViewersCount || 0, currentCount);

    transaction.update(liveRef, {
      viewersCount: currentCount,
      peakViewersCount: peak,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });
};

/**
 * Terminate/end an active live stream.
 */
export const endLive = async (liveId: string, actorUserId: string): Promise<void> => {
  const live = await getLiveById(liveId);
  if (!live) return;
  if (live.hostId !== actorUserId) {
    throw new Error('Only the host can end this live stream.');
  }

  await firestore().collection(FirestoreCollections.LIVES).doc(liveId).update({
    status: 'ended',
    endedAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Add user as a viewer of a live stream.
 */
export const joinLive = async (
  liveId: string,
  userProfile: { uid: string; displayName?: string; name?: string; username?: string; photoURL?: string }
): Promise<void> => {
  const db = firestore();
  const live = await getLiveById(liveId);
  if (!live) throw new Error('Live not found');
  if (live.status === 'ended') throw new Error('Este live ya ha finalizado');

  const viewerRef = db.collection(getLiveViewersPath(liveId)).doc(userProfile.uid);
  const viewerSnap = await viewerRef.get();

  if (viewerSnap.exists()) {
    // Already in stream, update activity
    await viewerRef.update({
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  const newViewer: LiveViewer = {
    id: userProfile.uid,
    liveId,
    userId: userProfile.uid,
    displayName: userProfile.displayName || userProfile.name || 'Viewer',
    username: userProfile.username || '',
    photoURL: userProfile.photoURL || '',
    role: live.hostId === userProfile.uid ? 'host' : 'viewer',
    joinedAt: firestore.FieldValue.serverTimestamp(),
    lastActiveAt: firestore.FieldValue.serverTimestamp(),
    isMuted: false,
    isBannedFromLive: false,
  };

  await viewerRef.set(newViewer);
  await updateLiveCounts(liveId);
};

/**
 * Remove user as a viewer.
 */
export const leaveLive = async (liveId: string, userId: string): Promise<void> => {
  const db = firestore();
  const viewerRef = db.collection(getLiveViewersPath(liveId)).doc(userId);
  const viewerSnap = await viewerRef.get();

  if (viewerSnap.exists()) {
    await viewerRef.delete();
    await updateLiveCounts(liveId);
  }
};

/**
 * Listen to live document updates.
 */
export const listenToLive = (liveId: string, callback: (live: LiveStream | null) => void) => {
  return firestore()
    .collection(FirestoreCollections.LIVES)
    .doc(liveId)
    .onSnapshot(doc => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as LiveStream);
      } else {
        callback(null);
      }
    });
};


/**
 * Like a live stream.
 */
export const likeLive = async (
  liveId: string,
  userProfile: { uid: string; displayName?: string; name?: string }
): Promise<void> => {
  const db = firestore();
  const likeRef = db.collection(FirestoreCollections.LIVES).doc(liveId).collection('likes').doc(userProfile.uid);
  const likeSnap = await likeRef.get();

  if (!likeSnap.exists()) {
    const liveRef = db.collection(FirestoreCollections.LIVES).doc(liveId);
    await db.runTransaction(async transaction => {
      const liveSnap = await transaction.get(liveRef);
      if (!liveSnap.exists()) return;
      const liveData = liveSnap.data() as LiveStream;

      transaction.set(likeRef, {
        userId: userProfile.uid,
        userName: userProfile.displayName || userProfile.name || 'User',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      transaction.update(liveRef, {
        likesCount: (liveData.likesCount || 0) + 1,
      });
    });
  }
};

/**
 * Unlike a live stream.
 */
export const unlikeLive = async (liveId: string, userId: string): Promise<void> => {
  const db = firestore();
  const likeRef = db.collection(FirestoreCollections.LIVES).doc(liveId).collection('likes').doc(userId);
  const likeSnap = await likeRef.get();

  if (likeSnap.exists()) {
    const liveRef = db.collection(FirestoreCollections.LIVES).doc(liveId);
    await db.runTransaction(async transaction => {
      const liveSnap = await transaction.get(liveRef);
      if (!liveSnap.exists()) return;
      const liveData = liveSnap.data() as LiveStream;

      transaction.delete(likeRef);
      transaction.update(liveRef, {
        likesCount: Math.max(0, (liveData.likesCount || 0) - 1),
      });
    });
  }
};
