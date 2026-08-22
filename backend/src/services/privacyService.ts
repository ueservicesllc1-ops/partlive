import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export const requestAccountDeletion = async (userId: string): Promise<{ scheduledFor: string }> => {
  const userRef = db.collection('users').doc(userId);
  const snap = await userRef.get();
  if (!snap.exists) throw new Error('User not found.');

  const now = new Date();
  const scheduledDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14-day grace period
  const scheduledFor = scheduledDate.toISOString();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await userRef.update({
    status: 'pending_deletion',
    deletionScheduledFor: scheduledFor,
    displayName: 'Usuario Anónimo', // Anonymize profile name
    bio: '',
    avatarUrl: '',
    updatedAt: timestamp,
  });

  // Audit record
  const logRef = db.collection('auditLogs').doc();
  await logRef.set({
    id: logRef.id,
    actor: userId,
    action: 'ACCOUNT_DELETION_REQUESTED',
    userId,
    scheduledFor,
    timestamp,
  });

  return { scheduledFor };
};

export const exportUserData = async (userId: string): Promise<any> => {
  const userSnap = await db.collection('users').doc(userId).get();
  if (!userSnap.exists) throw new Error('User not found.');

  const walletSnap = await db.collection('wallets').doc(userId).get();
  const postsSnap = await db.collection('posts').where('authorId', '==', userId).limit(50).get();
  const claimsSnap = await db.collection('userPolicyAcceptances').where('userId', '==', userId).get();

  return {
    exportedAt: new Date().toISOString(),
    profile: userSnap.data(),
    wallet: walletSnap.exists ? walletSnap.data() : null,
    posts: postsSnap.docs.map((d) => d.data()),
    policyAcceptances: claimsSnap.docs.map((d) => d.data()),
  };
};
