import { db } from '../config/firebase';

export type ContentVisibility = 'PUBLIC' | 'FOLLOWER' | 'SUBSCRIBER' | 'CLUB' | 'PRIVATE';

export const canUserAccessContent = async (
  userId: string,
  authorId: string,
  visibility: ContentVisibility
): Promise<boolean> => {
  // Author can always view own content
  if (userId === authorId) return true;

  if (visibility === 'PUBLIC') return true;
  if (visibility === 'PRIVATE') return false;

  if (visibility === 'FOLLOWER') {
    const followDoc = await db.collection('follows').doc(`${userId}_${authorId}`).get();
    return followDoc.exists;
  }

  if (visibility === 'SUBSCRIBER') {
    const subSnap = await db.collection('hostSubscriptions')
      .where('userId', '==', userId)
      .where('hostId', '==', authorId)
      .where('status', '==', 'ACTIVE')
      .get();
    return !subSnap.empty;
  }

  return true;
};
