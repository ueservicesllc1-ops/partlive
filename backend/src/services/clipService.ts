import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface PartyLiveClip {
  id: string;
  liveId: string;
  hostId: string;
  hostName: string;
  hostPhotoURL?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  status: 'PROCESSING' | 'PUBLISHED' | 'HIDDEN' | 'REMOVED';
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
  liveEntriesCount: number;
  giftRevenue: number;
  createdAt: any;
}

export const createClip = async (
  hostId: string,
  liveId: string,
  title: string,
  description: string,
  videoUrl: string,
  thumbnailUrl: string,
  durationSeconds: number
): Promise<PartyLiveClip> => {
  const hostSnap = await db.collection('users').doc(hostId).get();
  const hostName = hostSnap.exists ? (hostSnap.data()?.displayName || 'Anfitrión') : 'Anfitrión';
  const hostPhotoURL = hostSnap.exists ? (hostSnap.data()?.photoURL || '') : '';

  const clipRef = db.collection('clips').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newClip: PartyLiveClip = {
    id: clipRef.id,
    liveId,
    hostId,
    hostName,
    hostPhotoURL,
    title,
    description,
    videoUrl,
    thumbnailUrl,
    durationSeconds: Math.min(durationSeconds, 60), // Max 60s
    status: 'PUBLISHED',
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0,
    liveEntriesCount: 0,
    giftRevenue: 0,
    createdAt: timestamp,
  };

  await clipRef.set(newClip);
  return newClip;
};

export const getClipsFeed = async (userId?: string, limitCount: number = 20): Promise<PartyLiveClip[]> => {
  const snap = await db.collection('clips')
    .where('status', '==', 'PUBLISHED')
    .limit(limitCount)
    .get();

  return snap.docs.map((doc) => doc.data() as PartyLiveClip);
};

export const interactWithClip = async (
  userId: string,
  clipId: string,
  action: 'like' | 'share' | 'join_live' | 'view'
): Promise<void> => {
  const clipRef = db.collection('clips').doc(clipId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    const clipSnap = await transaction.get(clipRef);
    if (!clipSnap.exists) throw new Error('Clip no encontrado.');

    const updates: any = { updatedAt: timestamp };

    if (action === 'view') updates.viewsCount = admin.firestore.FieldValue.increment(1);
    if (action === 'like') updates.likesCount = admin.firestore.FieldValue.increment(1);
    if (action === 'share') updates.sharesCount = admin.firestore.FieldValue.increment(1);
    if (action === 'join_live') updates.liveEntriesCount = admin.firestore.FieldValue.increment(1);

    transaction.update(clipRef, updates);

    // Track conversion event log
    const interactionRef = db.collection('clipInteractions').doc();
    transaction.set(interactionRef, {
      id: interactionRef.id,
      clipId,
      userId,
      action,
      createdAt: timestamp,
    });
  });
};

export const getClipCreatorAnalytics = async (hostId: string): Promise<any> => {
  const clipsSnap = await db.collection('clips')
    .where('hostId', '==', hostId)
    .get();

  let totalViews = 0;
  let totalLikes = 0;
  let totalShares = 0;
  let totalLiveEntries = 0;

  clipsSnap.docs.forEach((doc) => {
    const d = doc.data();
    totalViews += d.viewsCount || 0;
    totalLikes += d.likesCount || 0;
    totalShares += d.sharesCount || 0;
    totalLiveEntries += d.liveEntriesCount || 0;
  });

  return {
    totalClips: clipsSnap.size,
    totalViews,
    totalLikes,
    totalShares,
    totalLiveEntries,
  };
};
