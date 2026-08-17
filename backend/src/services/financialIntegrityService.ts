import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface FinancialIntegrityReport {
  timestamp: any;
  totalPurchasesUsd: number;
  totalGiftsSpentCoins: number;
  totalDiamondsGenerated: number;
  totalCommissionsBeans: number;
  anomaliesDetected: number;
  status: 'HEALTHY' | 'ANOMALY_DETECTED';
}

export const reconcileDailyFinancials = async (): Promise<FinancialIntegrityReport> => {
  const purchasesSnap = await db.collection('purchases')
    .where('status', '==', 'completed')
    .limit(200)
    .get();

  let totalPurchasesUsd = 0;
  purchasesSnap.docs.forEach((doc) => {
    totalPurchasesUsd += doc.data().amountUsd || 0;
  });

  const giftsSnap = await db.collection('giftTransactions')
    .where('status', '==', 'completed')
    .limit(200)
    .get();

  let totalGiftsSpentCoins = 0;
  let totalDiamondsGenerated = 0;

  giftsSnap.docs.forEach((doc) => {
    const data = doc.data();
    totalGiftsSpentCoins += data.totalCoinsSpent || 0;
    totalDiamondsGenerated += data.diamondsEarned || 0;
  });

  const commissionsSnap = await db.collection('agencyCommissionLedger')
    .where('status', '==', 'approved')
    .limit(200)
    .get();

  let totalCommissionsBeans = 0;
  commissionsSnap.docs.forEach((doc) => {
    totalCommissionsBeans += doc.data().commissionAmount || 0;
  });

  let anomaliesCount = 0;
  // Financial invariant check: totalDiamondsGenerated must equal totalGiftsSpentCoins
  if (totalGiftsSpentCoins !== totalDiamondsGenerated && totalGiftsSpentCoins > 0) {
    anomaliesCount++;
    const alertRef = db.collection('financialIntegrityAlerts').doc();
    await alertRef.set({
      id: alertRef.id,
      type: 'DIAMOND_GIFT_MISMATCH',
      totalGiftsSpentCoins,
      totalDiamondsGenerated,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {
    timestamp: new Date().toISOString(),
    totalPurchasesUsd,
    totalGiftsSpentCoins,
    totalDiamondsGenerated,
    totalCommissionsBeans,
    anomaliesDetected: anomaliesCount,
    status: anomaliesCount === 0 ? 'HEALTHY' : 'ANOMALY_DETECTED',
  };
};
