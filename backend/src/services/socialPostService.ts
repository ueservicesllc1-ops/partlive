import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { canUserAccessContent, ContentVisibility } from './contentAccessService';

export interface SocialPost {
  id: string;
  authorId: string;
  contentType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CLIP_REF' | 'LIVE_REF' | 'EVENT_REF';
  text: string;
  mediaUrl?: string;
  visibility: ContentVisibility;
  likesCount: number;
  commentsCount: number;
  status: 'PUBLISHED' | 'HIDDEN' | 'REMOVED';
  createdAt: any;
}

export const createPost = async (
  authorId: string,
  text: string,
  mediaUrl: string = '',
  visibility: ContentVisibility = 'PUBLIC',
  contentType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CLIP_REF' | 'LIVE_REF' | 'EVENT_REF' = 'TEXT'
): Promise<SocialPost> => {
  const postRef = db.collection('posts').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const post: SocialPost = {
    id: postRef.id,
    authorId,
    contentType,
    text,
    mediaUrl,
    visibility,
    likesCount: 0,
    commentsCount: 0,
    status: 'PUBLISHED',
    createdAt: timestamp,
  };

  await postRef.set(post);
  return post;
};

export const likePost = async (userId: string, postId: string): Promise<boolean> => {
  const likeRef = db.collection('postLikes').doc(`${userId}_${postId}`);

  return await db.runTransaction(async (transaction) => {
    const likeDoc = await transaction.get(likeRef);
    const postRef = db.collection('posts').doc(postId);

    if (likeDoc.exists) {
      transaction.delete(likeRef);
      transaction.update(postRef, { likesCount: admin.firestore.FieldValue.increment(-1) });
      return false; // Unliked
    } else {
      transaction.set(likeRef, {
        userId,
        postId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.update(postRef, { likesCount: admin.firestore.FieldValue.increment(1) });
      return true; // Liked
    }
  });
};

export const commentPost = async (userId: string, postId: string, text: string): Promise<any> => {
  const commentRef = db.collection('comments').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.set(commentRef, {
      id: commentRef.id,
      postId,
      authorId: userId,
      text,
      status: 'PUBLISHED',
      createdAt: timestamp,
    });

    const postRef = db.collection('posts').doc(postId);
    transaction.update(postRef, { commentsCount: admin.firestore.FieldValue.increment(1) });
  });

  return { id: commentRef.id, text, authorId: userId };
};

export const getSocialFeed = async (userId: string, feedType: 'FOR_YOU' | 'FOLLOWING' = 'FOR_YOU'): Promise<SocialPost[]> => {
  const snap = await db.collection('posts')
    .where('status', '==', 'PUBLISHED')
    .limit(50)
    .get();

  const accessiblePosts: SocialPost[] = [];

  for (const doc of snap.docs) {
    const post = doc.data() as SocialPost;
    const canAccess = await canUserAccessContent(userId, post.authorId, post.visibility);
    if (canAccess) {
      accessiblePosts.push(post);
    }
  }

  return accessiblePosts;
};
