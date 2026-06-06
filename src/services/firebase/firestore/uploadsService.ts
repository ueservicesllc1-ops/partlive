import firestore from '@react-native-firebase/firestore';
import { UploadFileRecord } from '../../../types/upload';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

export const getUploadById = async (uploadId: string): Promise<UploadFileRecord | null> => {
  const doc = await firestore().collection(FirestoreCollections.UPLOADS).doc(uploadId).get();
  if (doc.exists()) {
    return doc.data() as UploadFileRecord;
  }
  return null;
};

export const getMyRecentUploads = async (userId: string): Promise<UploadFileRecord[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.UPLOADS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  return snapshot.docs.map(doc => doc.data() as UploadFileRecord);
};

export const listenToUpload = (uploadId: string, callback: (data: UploadFileRecord | null) => void) => {
  return firestore()
    .collection(FirestoreCollections.UPLOADS)
    .doc(uploadId)
    .onSnapshot((doc) => {
      callback(doc.exists() ? (doc.data() as UploadFileRecord) : null);
    });
};
