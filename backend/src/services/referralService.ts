import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerCode: string;
  referredUserId: string;
  status: 'PENDING' | 'QUALIFIED' | 'REJECTED';
  createdAt: any;
  qualifiedAt?: any;
}

export const generateUserReferralCode = async (userId: string): Promise<string> => {
  const userRef = db.collection('users').doc(userId);
  const snap = await userRef.get();
  if (!snap.exists) throw new Error('Usuario no encontrado.');

  const existingCode = snap.data()?.referralCode;
  if (existingCode) return existingCode;

  const code = 'PARTY' + userId.slice(-5).toUpperCase();
  await userRef.set({ referralCode: code }, { merge: true });

  await db.collection('referralCodes').doc(code).set({
    code,
    userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return code;
};

export const registerReferral = async (referrerCode: string, referredUserId: string): Promise<ReferralRecord> => {
  const codeSnap = await db.collection('referralCodes').doc(referrerCode.toUpperCase()).get();
  if (!codeSnap.exists) throw new Error('Código de referido no válido.');

  const referrerId = codeSnap.data()?.userId;

  // Anti-fraud check: Prevent self-referrals
  if (referrerId === referredUserId) {
    throw new Error('No puedes referirte a ti mismo.');
  }

  const existingRef = await db.collection('referrals')
    .where('referredUserId', '==', referredUserId)
    .get();

  if (existingRef.size > 0) {
    throw new Error('Este usuario ya fue referido anteriormente.');
  }

  const refDoc = db.collection('referrals').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const record: ReferralRecord = {
    id: refDoc.id,
    referrerId,
    referrerCode: referrerCode.toUpperCase(),
    referredUserId,
    status: 'PENDING',
    createdAt: timestamp,
  };

  await refDoc.set(record);
  return record;
};

export const qualifyReferral = async (referredUserId: string): Promise<void> => {
  const refSnap = await db.collection('referrals')
    .where('referredUserId', '==', referredUserId)
    .get();

  if (refSnap.empty) return;

  const refDoc = refSnap.docs[0];
  const data = refDoc.data() as ReferralRecord;

  if (data.status === 'QUALIFIED') return;

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(refDoc.ref, {
      status: 'QUALIFIED',
      qualifiedAt: timestamp,
    });

    // Grant bonus XP to referrer
    const referrerRef = db.collection('users').doc(data.referrerId);
    transaction.update(referrerRef, {
      xp: admin.firestore.FieldValue.increment(500),
      totalQualifiedReferrals: admin.firestore.FieldValue.increment(1),
    });
  });
};

export const getReferralDashboard = async (userId: string): Promise<any> => {
  const referralCode = await generateUserReferralCode(userId);

  const snap = await db.collection('referrals')
    .where('referrerId', '==', userId)
    .get();

  const referrals = snap.docs.map((doc) => doc.data());
  const qualifiedCount = referrals.filter((r) => r.status === 'QUALIFIED').length;

  return {
    referralCode,
    shareLink: `https://partylive.app/referral/${referralCode}`,
    totalReferrals: snap.size,
    qualifiedReferrals: qualifiedCount,
    earnedXp: qualifiedCount * 500,
    referrals,
  };
};
