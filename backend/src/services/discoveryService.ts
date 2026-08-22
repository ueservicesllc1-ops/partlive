import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { getUserHiddenCreators } from './userPreferenceService';

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
  creatorLevel?: string;
  score: number;
  isLive: boolean;
  sponsored?: boolean;
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
    .where('status', '==', 'active')
    .limit(limitCount * 2)
    .get();

  const items: DiscoveryFeedItem[] = livesSnap.docs.map((doc) => {
    const data = doc.data();
    const viewers = data.viewerCount || 0;
    const diamonds = data.diamondsGenerated || 0;
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
      creatorLevel: data.creatorLevel || 'Rookie',
      score,
      isLive: true,
      sponsored: Boolean(data.sponsored),
    };
  });

  return items.sort((a, b) => b.score - a.score).slice(0, limitCount);
};

export const getForYouFeed = async (userId: string, limitCount: number = 20): Promise<DiscoveryFeedItem[]> => {
  const hiddenHostIds = await getUserHiddenCreators(userId);

  // Fetch watch history
  const historySnap = await db.collection('watchHistory')
    .where('userId', '==', userId)
    .limit(30)
    .get();

  const watchedHostIds = new Set<string>();
  historySnap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.hostId) watchedHostIds.add(data.hostId);
  });

  const trending = await getTrendingLives(limitCount * 2);

  // Exclude hidden creators and boost watched hosts
  const filtered = trending.filter((item) => !hiddenHostIds.has(item.hostId));

  const personalized = filtered.map((item) => {
    let boostedScore = item.score;
    if (watchedHostIds.has(item.hostId)) {
      boostedScore *= 1.5;
    }
    // Boost Rising creators slightly to protect new talent exposure
    if (item.creatorLevel === 'Rookie' || item.creatorLevel === 'Rising') {
      boostedScore *= 1.25;
    }
    return { ...item, score: boostedScore };
  });

  return personalized.sort((a, b) => b.score - a.score).slice(0, limitCount);
};

export const getRisingCreatorsFeed = async (limitCount: number = 20): Promise<DiscoveryFeedItem[]> => {
  const livesSnap = await db.collection('lives')
    .where('status', '==', 'active')
    .limit(50)
    .get();

  const items: DiscoveryFeedItem[] = livesSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'live' as const,
        title: data.title || 'Live Stream',
        hostId: data.hostId || '',
        hostName: data.hostName || 'Nuevo Anfitrión',
        hostPhotoURL: data.hostPhotoURL || '',
        coverUrl: data.coverUrl || '',
        viewerCount: data.viewerCount || 0,
        creatorLevel: data.creatorLevel || 'Rookie',
        score: (data.viewerCount || 0) * 1.5 + 50, // Freshness boost for new creators
        isLive: true,
      };
    })
    .filter((item) => item.creatorLevel === 'Rookie' || item.creatorLevel === 'Rising');

  return items.sort((a, b) => b.score - a.score).slice(0, limitCount);
};

export const getPKDiscoveryFeed = async (limitCount: number = 20): Promise<any[]> => {
  const pkSnap = await db.collection('pkBattles')
    .where('status', '==', 'active')
    .limit(limitCount)
    .get();

  return pkSnap.docs.map((doc) => doc.data());
};
