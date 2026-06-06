import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { AppEvent } from '../../../types';

export const getActiveEvents = async (): Promise<AppEvent[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.EVENTS)
    .where('isActive', '==', true)
    .get();
    
  // Client-side filtering by dates if needed, or rely on active flag
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent));
};

export const getEventById = async (eventId: string): Promise<AppEvent | null> => {
  const doc = await firestore().collection(FirestoreCollections.EVENTS).doc(eventId).get();
  return doc.exists() ? ({ id: doc.id, ...doc.data() } as AppEvent) : null;
};
