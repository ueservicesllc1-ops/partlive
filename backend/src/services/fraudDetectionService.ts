import { db } from '../config/firebase';

export interface FraudEvaluation {
  userId: string;
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: string[];
}

export const calculateUserFraudRiskScore = async (userId: string): Promise<FraudEvaluation> => {
  const signals: string[] = [];
  let riskScore = 0;

  // 1. Check refund history
  const refundSnap = await db.collection('refundAuditLogs')
    .where('userId', '==', userId)
    .get();

  if (refundSnap.size > 0) {
    riskScore += 40;
    signals.push(`Historial de reembolsos detectado (${refundSnap.size} solicitudes)`);
  }

  // 2. Check gift velocity in short time window
  const giftsSnap = await db.collection('giftTransactions')
    .where('senderId', '==', userId)
    .limit(50)
    .get();

  if (giftsSnap.size >= 40) {
    riskScore += 20;
    signals.push('Alta velocidad de envío de regalos');
  }

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (riskScore >= 70) riskLevel = 'HIGH';
  else if (riskScore >= 30) riskLevel = 'MEDIUM';

  return {
    userId,
    riskScore,
    riskLevel,
    signals,
  };
};
