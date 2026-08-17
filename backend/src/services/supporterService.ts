import { db } from '../config/firebase';

export interface HostSupporterTier {
  tierName: 'Supporter' | 'Super Supporter' | 'Elite Supporter' | 'Legend Supporter';
  badge: string;
  totalCoinsSent: number;
}

export const getHostSupporterTier = (totalCoins: number): HostSupporterTier => {
  if (totalCoins >= 50000) {
    return { tierName: 'Legend Supporter', badge: '🪐 LEYENDA', totalCoinsSent: totalCoins };
  }
  if (totalCoins >= 10000) {
    return { tierName: 'Elite Supporter', badge: '👑 ELITE', totalCoinsSent: totalCoins };
  }
  if (totalCoins >= 2500) {
    return { tierName: 'Super Supporter', badge: '⚡ SUPER', totalCoinsSent: totalCoins };
  }
  return { tierName: 'Supporter', badge: '❤️ FAN', totalCoinsSent: totalCoins };
};

export const calculateHostSupporterStatus = async (
  userId: string,
  hostId: string
): Promise<HostSupporterTier> => {
  const giftSnap = await db
    .collection('giftTransactions')
    .where('senderId', '==', userId)
    .where('receiverId', '==', hostId)
    .where('status', '==', 'completed')
    .get();

  let totalCoins = 0;
  giftSnap.docs.forEach((doc) => {
    const data = doc.data();
    totalCoins += data.totalCoinsSpent || data.coinCost * (data.quantity || 1) || 0;
  });

  return getHostSupporterTier(totalCoins);
};
