import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface UserFeedback {
  id: string;
  userId: string;
  targetHostId: string;
  targetContentId?: string;
  action: 'NOT_INTERESTED' | 'HIDE_CREATOR';
  createdAt: any;
}

export const hideCreator = async (userId: string, targetHostId: string): Promise<void> => {
  const ref = db.collection('userFeedbacks').doc(`${userId}_hide_${targetHostId}`);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await ref.set({
    id: ref.id,
    userId,
    targetHostId,
    action: 'HIDE_CREATOR',
    createdAt: timestamp,
  });
};

export const markNotInterested = async (
  userId: string,
  targetHostId: string,
  targetContentId?: string
): Promise<void> => {
  const ref = db.collection('userFeedbacks').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await ref.set({
    id: ref.id,
    userId,
    targetHostId,
    targetContentId: targetContentId || '',
    action: 'NOT_INTERESTED',
    createdAt: timestamp,
  });
};

export const getUserHiddenCreators = async (userId: string): Promise<Set<string>> => {
  const snap = await db.collection('userFeedbacks')
    .where('userId', '==', userId)
    .get();

  const hidden = new Set<string>();
  snap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.targetHostId) hidden.add(data.targetHostId);
  });

  return hidden;
};
