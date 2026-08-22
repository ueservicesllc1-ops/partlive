import { db } from '../config/firebase';

export interface UserRiskProfile {
  userId: string;
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signalsCount: number;
  payoutHold: boolean;
  updatedAt: any;
}

export const evaluateUserRiskScore = async (userId: string): Promise<UserRiskProfile> => {
  const signalsSnap = await db.collection('fraudSignals')
    .where('userId', '==', userId)
    .limit(50)
    .get();

  const signalsCount = signalsSnap.size;
  let riskScore = Math.min(100, signalsCount * 20);

  let riskLevel: UserRiskProfile['riskLevel'] = 'LOW';
  if (riskScore >= 80) riskLevel = 'CRITICAL';
  else if (riskScore >= 50) riskLevel = 'HIGH';
  else if (riskScore >= 20) riskLevel = 'MEDIUM';

  const payoutHold = riskLevel === 'CRITICAL' || riskLevel === 'HIGH';

  const profile: UserRiskProfile = {
    userId,
    riskScore,
    riskLevel,
    signalsCount,
    payoutHold,
    updatedAt: new Date().toISOString(),
  };

  await db.collection('userRiskScores').doc(userId).set(profile, { merge: true });
  return profile;
};

export const flagHighRiskPayout = async (
  payoutId: string,
  userId: string,
  reason: string
): Promise<void> => {
  const profile = await evaluateUserRiskScore(userId);
  if (profile.payoutHold) {
    await db.collection('payoutRequests').doc(payoutId).update({
      status: 'HOLD',
      riskHoldReason: reason,
      updatedAt: new Date().toISOString(),
    });
  }
};
