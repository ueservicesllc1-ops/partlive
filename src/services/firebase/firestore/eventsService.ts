import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { SpecialEvent } from '../../../types';

export const getActiveEvents = async (): Promise<SpecialEvent[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.EVENTS)
    .where('isActive', '==', true)
    .get();
    
  // Client-side filtering by dates if needed, or rely on active flag
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialEvent));
};

export const getEventById = async (eventId: string): Promise<SpecialEvent | null> => {
  const doc = await firestore().collection(FirestoreCollections.EVENTS).doc(eventId).get();
  return doc.exists() ? ({ id: doc.id, ...doc.data() } as SpecialEvent) : null;
};
