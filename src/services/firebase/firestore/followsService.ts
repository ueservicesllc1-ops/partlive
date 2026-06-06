import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { Follow } from '../../../types';
import { nowServerTimestamp } from '../../../utils/firestoreDates';

export const followUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  const followId = `${currentUserId}_${targetUserId}`;
  await firestore().collection(FirestoreCollections.FOLLOWS).doc(followId).set({
    followerId: currentUserId,
    followingId: targetUserId,
    createdAt: nowServerTimestamp(),
  });
};

export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  const followId = `${currentUserId}_${targetUserId}`;
  await firestore().collection(FirestoreCollections.FOLLOWS).doc(followId).delete();
};

export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  const followId = `${currentUserId}_${targetUserId}`;
  const doc = await firestore().collection(FirestoreCollections.FOLLOWS).doc(followId).get();
  return doc.exists();
};

export const getFollowers = async (userId: string): Promise<Follow[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.FOLLOWS)
    .where('followingId', '==', userId)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Follow));
};

export const getFollowing = async (userId: string): Promise<Follow[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.FOLLOWS)
    .where('followerId', '==', userId)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Follow));
};
