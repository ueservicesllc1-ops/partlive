import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { Mission, UserDailyMission } from '../../../types';

export const getActiveMissions = async (): Promise<Mission[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.MISSIONS)
    .where('isActive', '==', true)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
};

export const getUserDailyMissions = async (userId: string, dateKey: string): Promise<UserDailyMission[]> => {
  // Use a subcollection helper or query the root collection
  const snap = await firestore()
    .collection(FirestoreCollections.USERS)
    .doc(userId)
    .collection('dailyMissions')
    .where('dateKey', '==', dateKey)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserDailyMission));
};

export const updateMissionProgress = async (userId: string, missionId: string, incrementBy: number): Promise<void> => {
  // Logic to increment progress... (omitted full logic for brevity)
  console.log(`Mission ${missionId} for user ${userId} incremented by ${incrementBy}`);
};

export const claimMissionReward = async (userId: string, missionId: string): Promise<void> => {
  // Logic to claim reward...
  console.log(`Mission ${missionId} reward claimed by ${userId}`);
};
