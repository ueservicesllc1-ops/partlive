import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { AppNotification } from '../../../types';
import { nowServerTimestamp } from '../../../utils/firestoreDates';

export const createNotification = async (userId: string, data: Omit<AppNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>): Promise<string> => {
  const ref = await firestore().collection(FirestoreCollections.NOTIFICATIONS).add({
    ...data,
    userId,
    isRead: false,
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

export const getUserNotifications = async (userId: string): Promise<AppNotification[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.NOTIFICATIONS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await firestore().collection(FirestoreCollections.NOTIFICATIONS).doc(notificationId).update({
    isRead: true,
  });
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const snap = await firestore()
    .collection(FirestoreCollections.NOTIFICATIONS)
    .where('userId', '==', userId)
    .where('isRead', '==', false)
    .get();
    
  const batch = firestore().batch();
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { isRead: true });
  });
  await batch.commit();
};
