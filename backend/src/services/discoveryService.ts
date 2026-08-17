import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface DiscoveryFeedItem {
  id: string;
  type: 'live' | 'clip' | 'host' | 'pk' | 'event';
  title: string;
  hostId: string;
  hostName: string;
  hostPhotoURL?: string;
  coverUrl?: string;
  viewerCount?: number;
  diamondsGenerated?: number;
  score: number;
  isLive: boolean;
}

export const recordWatchTime = async (
  userId: string,
  contentId: string,
  contentType: 'live' | 'clip',
  watchDurationSeconds: number
): Promise<void> => {
  if (watchDurationSeconds <= 0) return;

  const historyRef = db.collection('watchHistory').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await historyRef.set({
    id: historyRef.id,
    userId,
    contentId,
    contentType,
    watchDurationSeconds,
    createdAt: timestamp,
  });
};

export const getTrendingLives = async (limitCount: number = 20): Promise<DiscoveryFeedItem[]> => {
  const livesSnap = await db.collection('lives')
    .where('status', '==', 'live')
    .limit(limitCount * 2)
    .get();

  const items: DiscoveryFeedItem[] = livesSnap.docs.map((doc) => {
    const data = doc.data();
    const viewers = data.viewerCount || 0;
    const diamonds = data.diamondsGenerated || 0;
    // Calculate real-signal trending score
    const score = viewers * 2.0 + diamonds * 0.1;

    return {
      id: doc.id,
      type: 'live',
      title: data.title || 'Live Stream',
      hostId: data.hostId || data.ownerId || '',
      hostName: data.hostName || 'Anfitrión',
      hostPhotoURL: data.hostPhotoURL || '',
      coverUrl: data.coverUrl || '',
      viewerCount: viewers,
      diamondsGenerated: diamonds,
      score,
      isLive: true,
    };
  });

  return items.sort((a, b) => b.score - a.score).slice(0, limitCount);
};

export const getForYouFeed = async (userId: string, limitCount: number = 20): Promise<DiscoveryFeedItem[]> => {
  // Fetch user watch history to detect preferences
  const historySnap = await db.collection('watchHistory')
    .where('userId', '==', userId)
    .limit(30)
    .get();

  const watchedHostIds = new Set<string>();
  historySnap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.hostId) watchedHostIds.add(data.hostId);
  });

  const trending = await getTrendingLives(limitCount);

  // Boost score for hosts user previously watched
  const personalized = trending.map((item) => {
    let boostedScore = item.score;
    if (watchedHostIds.has(item.hostId)) {
      boostedScore *= 1.5;
    }
    return { ...item, score: boostedScore };
  });

  return personalized.sort((a, b) => b.score - a.score);
};

export const getNewHostsFeed = async (limitCount: number = 20): Promise<any[]> => {
  const usersSnap = await db.collection('users')
    .where('isHost', '==', true)
    .where('status', '==', 'active')
    .limit(limitCount)
    .get();

  return usersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      displayName: data.displayName || 'Nuevo Anfitrión',
      photoURL: data.photoURL || '',
      level: data.level || 1,
      createdAt: data.createdAt,
    };
  });
};
