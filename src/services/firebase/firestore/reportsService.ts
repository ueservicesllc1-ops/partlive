import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { Report, ReportReason, ReportTargetType } from '../../../types';
import { nowServerTimestamp } from '../../../utils/firestoreDates';
import { DEFAULT_REPORT_PRIORITY, MAX_REPORT_DESCRIPTION_LENGTH } from '../../../constants/moderation';

export const createReport = async (data: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'priority'>): Promise<string> => {
  if (data.description && data.description.length > MAX_REPORT_DESCRIPTION_LENGTH) {
    throw new Error(`La descripción no puede exceder los ${MAX_REPORT_DESCRIPTION_LENGTH} caracteres.`);
  }

  if (data.reporterId === data.targetId && data.targetType === 'user') {
    throw new Error('No puedes reportarte a ti mismo.');
  }

  // Determine priority
  let priority: Report['priority'] = DEFAULT_REPORT_PRIORITY;
  if (['sexual_content', 'underage', 'illegal_activity', 'self_harm'].includes(data.reason)) {
    priority = 'high';
  }

  const ref = await firestore().collection(FirestoreCollections.REPORTS).add({
    ...data,
    status: 'pending',
    priority,
    createdAt: nowServerTimestamp(),
    updatedAt: nowServerTimestamp(),
  });
  return ref.id;
};

export const getMyReports = async (userId: string, limitCount = 20): Promise<Report[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.REPORTS)
    .where('reporterId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
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
    reviewedBy: reviewerId,
    resolutionNote: note,
    updatedAt: nowServerTimestamp(),
  });
};

export const reportUser = async (reporterProfile: any, targetUserId: string, reason: ReportReason, description?: string): Promise<string> => {
  return createReport({
    reporterId: reporterProfile.uid,
    reporterName: reporterProfile.displayName || reporterProfile.username,
    targetType: 'user',
    targetId: targetUserId,
    reason,
    description,
  });
};

export const reportRoom = async (reporterProfile: any, roomId: string, targetOwnerId: string, reason: ReportReason, description?: string): Promise<string> => {
  return createReport({
    reporterId: reporterProfile.uid,
    reporterName: reporterProfile.displayName || reporterProfile.username,
    targetType: 'room',
    targetId: roomId,
    targetOwnerId,
    roomId,
    reason,
    description,
  });
};

export const reportLive = async (reporterProfile: any, liveId: string, targetOwnerId: string, reason: ReportReason, description?: string): Promise<string> => {
  return createReport({
    reporterId: reporterProfile.uid,
    reporterName: reporterProfile.displayName || reporterProfile.username,
    targetType: 'live',
    targetId: liveId,
    targetOwnerId,
    liveId,
    reason,
    description,
  });
};

export const reportMessage = async (
  reporterProfile: any, 
  targetType: ReportTargetType, 
  parentId: string, 
  messageId: string, 
  messageOwnerId: string, 
  reason: ReportReason, 
  description?: string
): Promise<string> => {
  return createReport({
    reporterId: reporterProfile.uid,
    reporterName: reporterProfile.displayName || reporterProfile.username,
    targetType,
    targetId: messageId,
    targetOwnerId: messageOwnerId,
    messageId,
    roomId: targetType === 'room' ? parentId : undefined,
    liveId: targetType === 'live' ? parentId : undefined,
    reason,
    description,
  });
};
