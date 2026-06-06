import { db } from '../config/firebase';

export interface AdminSummaryData {
  usersCount: number;
  activeRoomsCount: number;
  activeLivesCount: number;
  pendingReportsCount: number;
  pendingHostApplicationsCount: number;
  pendingPayoutsCount: number;
  purchasesTodayCount: number;
  giftsTodayCount: number;
  diamondsToday: number;
}

export const getAdminSummary = async (): Promise<AdminSummaryData> => {
  try {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // Run parallel count queries using Firestore count()
    const [
      usersSnap,
      roomsSnap,
      livesSnap,
      reportsSnap,
      hostAppsSnap,
      payoutsSnap,
      purchasesTodaySnap,
      giftEventsTodaySnap
    ] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('rooms').where('status', '==', 'active').count().get(),
      db.collection('lives').where('status', '==', 'live').count().get(),
      db.collection('reports').where('status', '==', 'pending').count().get(),
      db.collection('hostApplications').where('status', '==', 'pending').count().get(),
      db.collection('hostPayouts').where('status', '==', 'pending').count().get(),
      db.collection('purchases').where('createdAt', '>=', startOfToday).count().get(),
      db.collection('walletTransactions').where('type', '==', 'gift').where('createdAt', '>=', startOfToday).get()
    ]);

    const usersCount = usersSnap.data().count;
    const activeRoomsCount = roomsSnap.data().count;
    const activeLivesCount = livesSnap.data().count;
    const pendingReportsCount = reportsSnap.data().count;
    const pendingHostApplicationsCount = hostAppsSnap.data().count;
    const pendingPayoutsCount = payoutsSnap.data().count;
    const purchasesTodayCount = purchasesTodaySnap.data().count;

    // Process gifts and diamond values from the gift transactions of today
    let giftsTodayCount = 0;
    let diamondsToday = 0;

    giftEventsTodaySnap.forEach(doc => {
      const data = doc.data();
      giftsTodayCount++;
      // Diamonds are usually positive values received by host or delta in transactions
      if (data.currency === 'diamonds' && data.amount > 0) {
        diamondsToday += data.amount;
      }
    });

    return {
      usersCount,
      activeRoomsCount,
      activeLivesCount,
      pendingReportsCount,
      pendingHostApplicationsCount,
      pendingPayoutsCount,
      purchasesTodayCount,
      giftsTodayCount,
      diamondsToday,
    };
  } catch (error) {
    console.error('Error fetching admin summary stats:', error);
    throw error;
  }
};
