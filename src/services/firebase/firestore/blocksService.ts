import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { nowServerTimestamp } from '../../../utils/firestoreDates';

export const blockUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  const blockId = `${currentUserId}_${targetUserId}`;
  await firestore().collection(FirestoreCollections.BLOCKS).doc(blockId).set({
    blockerId: currentUserId,
    blockedUserId: targetUserId,
    createdAt: nowServerTimestamp(),
  });
};

export const unblockUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  const blockId = `${currentUserId}_${targetUserId}`;
  await firestore().collection(FirestoreCollections.BLOCKS).doc(blockId).delete();
};

export const isUserBlocked = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  const blockId = `${currentUserId}_${targetUserId}`;
  const doc = await firestore().collection(FirestoreCollections.BLOCKS).doc(blockId).get();
  return doc.exists();
};
