import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { Follow } from '../../../types/social';

export const followUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  const followId = `${currentUserId}_${targetUserId}`;
  await firestore().collection(FirestoreCollections.FOLLOWS).doc(followId).set({
    id: followId,
    followerId: currentUserId,
    followingId: targetUserId,
    status: 'active',
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  const followId = `${currentUserId}_${targetUserId}`;
  await firestore().collection(FirestoreCollections.FOLLOWS).doc(followId).delete();
};

export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  if (!currentUserId || !targetUserId) return false;
  const followId = `${currentUserId}_${targetUserId}`;
  const doc = await firestore().collection(FirestoreCollections.FOLLOWS).doc(followId).get();
  return doc.exists() && doc.data()?.status === 'active';
};

export const listenIsFollowing = (
  currentUserId: string,
  targetUserId: string,
  callback: (isFollowingUser: boolean) => void
): () => void => {
  if (!currentUserId || !targetUserId) {
    callback(false);
    return () => {};
  }
  const followId = `${currentUserId}_${targetUserId}`;
  return firestore()
    .collection(FirestoreCollections.FOLLOWS)
    .doc(followId)
    .onSnapshot(doc => {
      callback(doc.exists() && doc.data()?.status === 'active');
    });
};

export const getFollowers = async (userId: string, limitCount = 50): Promise<Follow[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.FOLLOWS)
    .where('followingId', '==', userId)
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Follow));
};

export const getFollowing = async (userId: string, limitCount = 50): Promise<Follow[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.FOLLOWS)
    .where('followerId', '==', userId)
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Follow));
};

export const listenFollowers = (
  userId: string,
  callback: (followersList: Follow[]) => void,
  limitCount = 50
): () => void => {
  return firestore()
    .collection(FirestoreCollections.FOLLOWS)
    .where('followingId', '==', userId)
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .onSnapshot(snap => {
      if (!snap) return callback([]);
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Follow)));
    });
};

export const listenFollowing = (
  userId: string,
  callback: (followingList: Follow[]) => void,
  limitCount = 50
): () => void => {
  return firestore()
    .collection(FirestoreCollections.FOLLOWS)
    .where('followerId', '==', userId)
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .onSnapshot(snap => {
      if (!snap) return callback([]);
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Follow)));
    });
};

export const getFollowersCount = async (userId: string): Promise<number> => {
  const doc = await firestore().collection(FirestoreCollections.USERS).doc(userId).get();
  return doc.exists() ? doc.data()?.followersCount || 0 : 0;
};

export const getFollowingCount = async (userId: string): Promise<number> => {
  const doc = await firestore().collection(FirestoreCollections.USERS).doc(userId).get();
  return doc.exists() ? doc.data()?.followingCount || 0 : 0;
};
