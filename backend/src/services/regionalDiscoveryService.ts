import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export type DiscoveryScope = 'LOCAL' | 'REGIONAL' | 'GLOBAL';

export const getRegionalTrendingContent = async (
  countryCode: string = 'US',
  scope: DiscoveryScope = 'LOCAL'
): Promise<any[]> => {
  let query: admin.firestore.Query = db.collection('lives')
    .where('status', '==', 'active');

  if (scope === 'LOCAL') {
    query = query.where('country', '==', countryCode.toUpperCase());
  }

  const snap = await query.limit(30).get();
  let lives = snap.docs.map((doc) => doc.data());

  if (scope === 'GLOBAL' && lives.length === 0) {
    const globalSnap = await db.collection('lives')
      .where('status', '==', 'active')
      .limit(30)
      .get();
    lives = globalSnap.docs.map((doc) => doc.data());
  }

  return lives;
};

export const getRegionalLeaderboards = async (
  countryCode: string = 'US',
  scope: DiscoveryScope = 'LOCAL'
): Promise<{ topHosts: any[]; topGifters: any[] }> => {
  let query: admin.firestore.Query = db.collection('users')
    .where('status', '==', 'active');

  if (scope === 'LOCAL') {
    query = query.where('country', '==', countryCode.toUpperCase());
  }

  const snap = await query.limit(20).get();
  const users = snap.docs.map((d) => d.data());

  const topHosts = users.filter((u) => u.isHost);
  const topGifters = [...users].sort((a, b) => (b.diamondsSpent || 0) - (a.diamondsSpent || 0));

  return { topHosts, topGifters };
};
