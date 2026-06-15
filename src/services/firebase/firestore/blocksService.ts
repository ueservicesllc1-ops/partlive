import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { nowServerTimestamp } from '../../../utils/firestoreDates';
import { Block } from '../../../types/block';

export const blockUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  if (currentUserId === targetUserId) {
    throw new Error('No puedes bloquearte a ti mismo.');
  }
  const blockId = `${currentUserId}_${targetUserId}`;
  await firestore().collection(FirestoreCollections.BLOCKS).doc(blockId).set({
    id: blockId,
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

export const getBlockedUsers = async (currentUserId: string): Promise<string[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.BLOCKS)
    .where('blockerId', '==', currentUserId)
    .get();
  
  return snap.docs.map((doc) => {
    const data = doc.data() as Block;
    return data.blockedUserId;
  });
};

export const listenToBlockedUsers = (currentUserId: string, callback: (blockedUserIds: string[]) => void): () => void => {
  return firestore()
    .collection(FirestoreCollections.BLOCKS)
    .where('blockerId', '==', currentUserId)
    .onSnapshot((snap) => {
      if (!snap) {
        callback([]);
        return;
      }
      const blockedUserIds = snap.docs.map((doc) => {
        const data = doc.data() as Block;
        return data.blockedUserId;
      });
      callback(blockedUserIds);
    }, (error) => {
      console.error('Error listening to blocked users:', error);
    });
};
