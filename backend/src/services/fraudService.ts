import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { FraudSignalType } from '../types/fraud';

/**
 * Records a new fraud signal and triggers risk score updates.
 */
export const recordFraudSignal = async (data: {
  userId: string;
  type: FraudSignalType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  metadata?: Record<string, any>;
}): Promise<string> => {
  const signalRef = db.collection('fraudSignals').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await signalRef.set({
    id: signalRef.id,
    ...data,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  });

  await updateUserRiskScore(data.userId);

  // Track fraud signal in analytics asynchronously
  try {
    const { recordFraudSignal: recordFraudAnalytics } = await import('./analyticsService');
    await recordFraudAnalytics(data.userId, data.score, data.description);
  } catch (anErr) {
    console.error('Failed to track fraud signal in analytics:', anErr);
  }

  return signalRef.id;
};

/**
 * Aggregates all open fraud signals and updates the user's risk score and level.
 */
export const updateUserRiskScore = async (userId: string): Promise<any> => {
  const signalsSnap = await db.collection('fraudSignals')
    .where('userId', '==', userId)
    .where('status', '==', 'open')
    .get();

  let riskScore = 0;
  signalsSnap.docs.forEach(doc => {
    riskScore += doc.data().score || 0;
  });

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore >= 75) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 20) riskLevel = 'medium';

  // Enforcement rules
  const payoutBlocked = riskScore >= 50; // High or critical risk blocks payout
  const giftBlocked = riskScore >= 75; // Critical risk blocks gift sending
  const walletLocked = riskScore >= 90; // Over 90 locks the entire wallet

  const userRiskRef = db.collection('userRisk').doc(userId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  const riskData = {
    userId,
    riskScore,
    riskLevel,
    signalsCount: signalsSnap.size,
    lastSignalAt: now,
    payoutBlocked,
    giftBlocked,
    walletLocked,
    updatedAt: now,
  };

  await userRiskRef.set(riskData, { merge: true });

  // Update wallet lock status if needed
  if (walletLocked) {
    await db.collection('wallets').doc(userId).update({
      status: 'locked',
      updatedAt: now,
    }).catch(() => {});
  }

  return riskData;
};

/**
 * Checks for fraud before sending a gift.
 */
export const checkGiftFraud = async (
  senderId: string,
  receiverId: string,
  giftId: string,
  quantity: number,
  giftPriceDiamonds: number
): Promise<void> => {
  const userRiskSnap = await db.collection('userRisk').doc(senderId).get();
  if (userRiskSnap.exists) {
    const risk = userRiskSnap.data()!;
    if (risk.walletLocked || risk.giftBlocked) {
      throw new Error('Tu cuenta tiene restricciones de seguridad para enviar regalos.');
    }
  }

  // 1. Detect self-gifting
  if (senderId === receiverId) {
    await recordFraudSignal({
      userId: senderId,
      type: 'self_gifting',
      severity: 'high',
      score: 30,
      description: 'Intento de auto-regalo detectado.',
      metadata: { receiverId, giftId, quantity },
    });
    throw new Error('No puedes enviarte un regalo a ti mismo.');
  }

  // 2. Detect New Account High Spend
  const senderSnap = await db.collection('users').doc(senderId).get();
  if (senderSnap.exists) {
    const sender = senderSnap.data()!;
    const createdAt = sender.createdAt ? (sender.createdAt.toMillis ? sender.createdAt.toMillis() : new Date(sender.createdAt).getTime()) : Date.now();
    const accountAgeDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    const totalDiamonds = giftPriceDiamonds * quantity;

    if (accountAgeDays < 2 && totalDiamonds >= 5000) {
      await recordFraudSignal({
        userId: senderId,
        type: 'new_account_high_spend',
        severity: 'high',
        score: 40,
        description: `Cuenta nueva (<2 días) gastó ${totalDiamonds} diamantes en un solo envío.`,
        metadata: { giftId, quantity, accountAgeDays },
      });
    }
  }
};

/**
 * Checks for fraud before requesting a payout.
 */
export const checkPayoutFraud = async (hostId: string, amountBeans: number): Promise<void> => {
  const userRiskSnap = await db.collection('userRisk').doc(hostId).get();
  if (userRiskSnap.exists) {
    const risk = userRiskSnap.data()!;
    if (risk.walletLocked || risk.payoutBlocked) {
      throw new Error('Tu cuenta tiene restricciones de seguridad para solicitar retiros.');
    }
  }

  // High amount check
  if (amountBeans >= 500000) { // ~ $1500 USD
    await recordFraudSignal({
      userId: hostId,
      type: 'payout_risk',
      severity: 'medium',
      score: 15,
      description: `Solicitud de retiro de alto valor: ${amountBeans} beans.`,
      metadata: { amountBeans },
    });
  }
};
