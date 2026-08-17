import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface Story {
  id: string;
  authorId: string;
  mediaUrl: string;
  type: 'IMAGE' | 'VIDEO' | 'LIVE_ANNOUNCEMENT';
  viewsCount: number;
  status: 'PUBLISHED' | 'EXPIRED';
  createdAt: any;
  expiresAt: any;
}

export const createStory = async (
  authorId: string,
  mediaUrl: string,
  type: 'IMAGE' | 'VIDEO' | 'LIVE_ANNOUNCEMENT' = 'IMAGE',
  durationHours: number = 24
): Promise<Story> => {
  const storyRef = db.collection('stories').doc();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const story: Story = {
    id: storyRef.id,
    authorId,
    mediaUrl,
    type,
    viewsCount: 0,
    status: 'PUBLISHED',
    createdAt: timestamp,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  };

  await storyRef.set(story);
  return story;
};

export const recordStoryView = async (userId: string, storyId: string): Promise<void> => {
  const viewRef = db.collection('storyViews').doc(`${userId}_${storyId}`);
  const viewDoc = await viewRef.get();

  if (!viewDoc.exists) {
    await viewRef.set({
      userId,
      storyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const storyRef = db.collection('stories').doc(storyId);
    await storyRef.update({ viewsCount: admin.firestore.FieldValue.increment(1) });
  }
};

export const getActiveStoriesFeed = async (userId: string): Promise<Story[]> => {
  const nowMs = Date.now();

  const snap = await db.collection('stories')
    .where('status', '==', 'PUBLISHED')
    .limit(50)
    .get();

  return snap.docs
    .map((doc) => doc.data() as Story)
    .filter((s) => {
      if (!s.expiresAt) return true;
      const expDate = s.expiresAt.toDate ? s.expiresAt.toDate() : new Date(s.expiresAt);
      return expDate.getTime() > nowMs;
    });
};
