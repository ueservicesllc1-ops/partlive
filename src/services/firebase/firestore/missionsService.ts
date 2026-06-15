import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { Mission, UserMissionProgress } from '../../../types/mission';

/**
 * Listens to active missions in real-time.
 */
export const listenToActiveMissions = (callback: (missions: Mission[]) => void) => {
  return firestore()
    .collection(FirestoreCollections.MISSIONS)
    .where('status', '==', 'active')
    .orderBy('sortOrder', 'asc')
    .onSnapshot(
      (snapshot) => {
        const missions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Mission));
        callback(missions);
      },
      (error) => {
        console.error('Error listening to active missions:', error);
      }
    );
};

/**
 * Listens to user mission progress in real-time.
 */
export const listenToUserMissionProgress = (
  userId: string,
  periodKey: string,
  callback: (progress: UserMissionProgress[]) => void
) => {
  return firestore()
    .collection(FirestoreCollections.USER_MISSION_PROGRESS)
    .where('userId', '==', userId)
    .where('periodKey', '==', periodKey)
    .onSnapshot(
      (snapshot) => {
        const progress = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserMissionProgress));
        callback(progress);
      },
      (error) => {
        console.error('Error listening to user mission progress:', error);
      }
    );
};

/**
 * Retrieves a specific mission by its ID.
 */
export const getMissionById = async (missionId: string): Promise<Mission | null> => {
  const doc = await firestore().collection(FirestoreCollections.MISSIONS).doc(missionId).get();
  return doc.exists() ? ({ id: doc.id, ...doc.data() } as Mission) : null;
};
