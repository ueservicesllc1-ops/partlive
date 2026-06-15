import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { AppNotification, UserNotificationSettings } from '../../../types/notification';

/**
 * Listens to active notifications in real-time.
 */
export const listenToUserNotifications = (
  userId: string,
  callback: (notifications: AppNotification[]) => void,
  limitCount = 50
) => {
  return firestore()
    .collection(FirestoreCollections.NOTIFICATIONS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .onSnapshot(
      (snapshot) => {
        if (snapshot) {
          const notifications = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as AppNotification)
          );
          callback(notifications);
        }
      },
      (error) => {
        console.error('Error listening to user notifications:', error);
      }
    );
};

/**
 * Listens to unread count in real-time.
 */
export const listenToUnreadNotificationsCount = (
  userId: string,
  callback: (count: number) => void
) => {
  return firestore()
    .collection(FirestoreCollections.NOTIFICATIONS)
    .where('userId', '==', userId)
    .where('status', '==', 'unread')
    .onSnapshot(
      (snapshot) => {
        if (snapshot) {
          callback(snapshot.size);
        }
      },
      (error) => {
        console.error('Error listening to unread notifications count:', error);
      }
    );
};

/**
 * Fetch settings once (read).
 */
export const getNotificationSettings = async (userId: string): Promise<UserNotificationSettings | null> => {
  const doc = await firestore()
    .collection(FirestoreCollections.NOTIFICATION_SETTINGS)
    .doc(userId)
    .get();

  return doc.exists() ? (doc.data() as UserNotificationSettings) : null;
};

/**
 * Creates a notification in Firestore.
 */
export const createNotification = async (
  userId: string,
  notificationData: Omit<AppNotification, 'id' | 'userId' | 'status' | 'createdAt' | 'channel'>
): Promise<string> => {
  const ref = firestore().collection(FirestoreCollections.NOTIFICATIONS).doc();
  const now = firestore.FieldValue.serverTimestamp();
  
  await ref.set({
    userId,
    status: 'unread',
    channel: 'in_app',
    createdAt: now,
    ...notificationData,
  });
  
  return ref.id;
};
