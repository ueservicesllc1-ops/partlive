import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { Report } from '../../../types';
import { nowServerTimestamp } from '../../../utils/firestoreDates';

export const createReport = async (data: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> => {
  const ref = await firestore().collection(FirestoreCollections.REPORTS).add({
    ...data,
    status: 'pending',
    createdAt: nowServerTimestamp(),
    updatedAt: nowServerTimestamp(),
  });
  return ref.id;
};

export const getPendingReports = async (): Promise<Report[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.REPORTS)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'asc')
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
};

export const updateReportStatus = async (reportId: string, status: Report['status'], reviewerId?: string, note?: string): Promise<void> => {
  await firestore().collection(FirestoreCollections.REPORTS).doc(reportId).update({
    status,
    resolvedBy: reviewerId,
    resolutionNote: note,
    updatedAt: nowServerTimestamp(),
  });
};
