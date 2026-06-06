import firestore from '@react-native-firebase/firestore';
import { RankingEntry } from '../../../types/ranking';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

export const getRankingByType = async (type: string, period: string = 'daily'): Promise<RankingEntry[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.RANKINGS)
    .where('rankingType', '==', type)
    .where('period', '==', period)
    .orderBy('position', 'asc')
    .limit(100)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RankingEntry));
};
