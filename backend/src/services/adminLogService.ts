import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export interface AdminLogPayload {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  metadata?: Record<string, any>;
}

export const createAdminLog = async (logData: AdminLogPayload): Promise<string> => {
  try {
    const logRef = db.collection('adminLogs').doc();
    const newLog = {
      id: logRef.id,
      ...logData,
      createdAt: FieldValue.serverTimestamp(),
    };
    await logRef.set(newLog);
    return logRef.id;
  } catch (error) {
    console.error('Error creating admin log:', error);
    throw error;
  }
};

export const logAdminAction = async (payload: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: any;
}) => {
  return createAdminLog({
    adminId: payload.adminId,
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId,
    description: `Action ${payload.action} on ${payload.targetType} ${payload.targetId}`,
    metadata: payload.details,
  });
};
