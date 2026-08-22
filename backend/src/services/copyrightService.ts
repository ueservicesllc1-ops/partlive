import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface CopyrightClaim {
  id: string;
  contentId: string;
  contentType: 'LIVE' | 'CLIP' | 'STORY' | 'POST' | 'RECORDING';
  claimantId: string;
  creatorId: string;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' | 'APPEALED';
  actionTaken?: 'MUTE' | 'HIDE' | 'RESTRICT' | 'TAKEDOWN' | 'NONE';
  appealReason?: string;
  createdAt: any;
  updatedAt: any;
}

export const submitCopyrightClaim = async (
  contentId: string,
  contentType: CopyrightClaim['contentType'],
  claimantId: string,
  reason: string
): Promise<CopyrightClaim> => {
  const claimRef = db.collection('copyrightClaims').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  // Look up content owner
  let creatorId = 'unknown';
  if (contentType === 'CLIP') {
    const clipSnap = await db.collection('clips').doc(contentId).get();
    if (clipSnap.exists) creatorId = clipSnap.data()?.creatorId || 'unknown';
  } else if (contentType === 'POST') {
    const postSnap = await db.collection('posts').doc(contentId).get();
    if (postSnap.exists) creatorId = postSnap.data()?.authorId || 'unknown';
  }

  const claim: CopyrightClaim = {
    id: claimRef.id,
    contentId,
    contentType,
    claimantId,
    creatorId,
    reason,
    status: 'OPEN',
    actionTaken: 'NONE',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await claimRef.set(claim);
  return claim;
};

export const processTakedownAction = async (
  claimId: string,
  action: 'MUTE' | 'HIDE' | 'RESTRICT' | 'TAKEDOWN' | 'NONE',
  adminId: string
): Promise<CopyrightClaim> => {
  const claimRef = db.collection('copyrightClaims').doc(claimId);
  const snap = await claimRef.get();
  if (!snap.exists) throw new Error(`CLAIM_NOT_FOUND: ${claimId}`);

  const claim = snap.data() as CopyrightClaim;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(claimRef, {
      status: action === 'NONE' ? 'REJECTED' : 'RESOLVED',
      actionTaken: action,
      resolvedBy: adminId,
      updatedAt: timestamp,
    });

    // Update target content status
    if (action === 'MUTE') {
      if (claim.contentType === 'CLIP') {
        const clipRef = db.collection('clips').doc(claim.contentId);
        transaction.update(clipRef, { isMuted: true, updatedAt: timestamp });
      }
    } else if (action === 'TAKEDOWN' || action === 'HIDE') {
      if (claim.contentType === 'CLIP') {
        const clipRef = db.collection('clips').doc(claim.contentId);
        transaction.update(clipRef, { status: 'REMOVED', updatedAt: timestamp });
      } else if (claim.contentType === 'POST') {
        const postRef = db.collection('posts').doc(claim.contentId);
        transaction.update(postRef, { status: 'REMOVED', updatedAt: timestamp });
      }
    }

    // Audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      actor: adminId,
      action: `COPYRIGHT_TAKEDOWN_${action}`,
      transactionId: claimId,
      contentId: claim.contentId,
      timestamp,
    });
  });

  return { ...claim, status: action === 'NONE' ? 'REJECTED' : 'RESOLVED', actionTaken: action };
};

export const fileCopyrightAppeal = async (
  claimId: string,
  creatorId: string,
  appealReason: string
): Promise<void> => {
  const claimRef = db.collection('copyrightClaims').doc(claimId);
  const snap = await claimRef.get();
  if (!snap.exists) throw new Error(`CLAIM_NOT_FOUND: ${claimId}`);

  const claim = snap.data() as CopyrightClaim;
  if (claim.creatorId !== creatorId) throw new Error('UNAUTHORIZED: Claim does not belong to creator');

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await claimRef.update({
    status: 'APPEALED',
    appealReason,
    appealedAt: timestamp,
    updatedAt: timestamp,
  });
};

export const issueCopyrightStrike = async (
  userId: string,
  contentId: string,
  reason: string
): Promise<{ strikeCount: number; strikes: any[] }> => {
  const strikeRef = db.collection('copyrightStrikes').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await strikeRef.set({
    id: strikeRef.id,
    userId,
    contentId,
    reason,
    issuedAt: timestamp,
  });

  const strikesSnap = await db.collection('copyrightStrikes')
    .where('userId', '==', userId)
    .get();

  const strikeCount = strikesSnap.size;

  // Apply progressive restriction
  if (strikeCount >= 3) {
    await db.collection('users').doc(userId).update({
      status: 'suspended',
      suspendedReason: 'COPYRIGHT_STRIKES_EXCEEDED',
      updatedAt: timestamp,
    });
  }

  return { strikeCount, strikes: strikesSnap.docs.map((d) => d.data()) };
};
