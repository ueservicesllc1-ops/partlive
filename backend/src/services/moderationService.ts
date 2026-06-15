import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { logAdminAction } from './adminLogService';

const db = getFirestore();

interface ModerationLogData {
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  targetOwnerId?: string;
  reason?: string;
  reportId?: string;
  roomId?: string;
  liveId?: string;
  metadata?: Record<string, any>;
}

export const createModerationLog = async (data: ModerationLogData) => {
  const id = uuidv4();
  await db.collection('moderationLogs').doc(id).set({
    id,
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
};

export const getReports = async (filters: any) => {
  let query: any = db.collection('reports');

  if (filters.status) query = query.where('status', '==', filters.status);
  if (filters.targetType) query = query.where('targetType', '==', filters.targetType);
  if (filters.reason) query = query.where('reason', '==', filters.reason);

  query = query.orderBy('createdAt', 'desc').limit(filters.limit || 50);

  const snap = await query.get();
  return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};

export const getReportById = async (reportId: string) => {
  const doc = await db.collection('reports').doc(reportId).get();
  if (!doc.exists) throw new Error('Report not found');
  return { id: doc.id, ...doc.data() };
};

export const updateReportStatus = async (reportId: string, adminId: string, status: string, note?: string) => {
  await db.collection('reports').doc(reportId).update({
    status,
    reviewedBy: adminId,
    reviewedAt: FieldValue.serverTimestamp(),
    resolutionNote: note,
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  await logAdminAction({
    adminId,
    action: `UPDATE_REPORT_STATUS_${status.toUpperCase()}`,
    targetType: 'report',
    targetId: reportId,
    details: note ? { note } : undefined,
  });
};

export const resolveReport = async (reportId: string, adminId: string, actionTaken: string, note?: string) => {
  await db.collection('reports').doc(reportId).update({
    status: 'resolved',
    actionTaken,
    reviewedBy: adminId,
    reviewedAt: FieldValue.serverTimestamp(),
    resolutionNote: note,
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  await logAdminAction({
    adminId,
    action: 'RESOLVE_REPORT',
    targetType: 'report',
    targetId: reportId,
    details: { actionTaken, note },
  });
};

export const rejectReport = async (reportId: string, adminId: string, note?: string) => {
  await updateReportStatus(reportId, adminId, 'rejected', note);
};

// --- User Actions ---

const updateUserModerationState = async (userId: string, updates: any) => {
  const ref = db.collection('userModeration').doc(userId);
  await ref.set({ ...updates, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
};

const updateUserStatus = async (userId: string, status: string) => {
  await db.collection('users').doc(userId).update({ status });
};

export const warnUser = async (targetUserId: string, adminId: string, reason: string, reportId?: string) => {
  await updateUserStatus(targetUserId, 'warning');
  await updateUserModerationState(targetUserId, {
    userId: targetUserId,
    status: 'warning',
    warningsCount: FieldValue.increment(1),
    lastWarningAt: FieldValue.serverTimestamp(),
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'warn_user',
    targetType: 'user',
    targetId: targetUserId,
    reason,
    reportId,
  });
  
  await logAdminAction({ adminId, action: 'WARN_USER', targetType: 'user', targetId: targetUserId, details: { reason } });

  // Trigger moderation warnings via push
  try {
    const { createNotificationAndPush } = await import('./notificationService');
    await createNotificationAndPush({
      userId: targetUserId,
      type: 'moderation',
      channel: 'both',
      title: 'Advertencia de Moderación 🚨',
      body: `Atención: Has recibido una advertencia por: ${reason}. Por favor sigue las normas comunitarias.`,
      actionType: 'none',
    });
  } catch (err) {
    console.error('Failed to send warn user notification:', err);
  }
};

export const suspendUser = async (targetUserId: string, adminId: string, reason: string, durationHours: number = 24, reportId?: string) => {
  await updateUserStatus(targetUserId, 'suspended');
  
  const suspendedUntil = new Date();
  suspendedUntil.setHours(suspendedUntil.getHours() + durationHours);

  await updateUserModerationState(targetUserId, {
    userId: targetUserId,
    status: 'suspended',
    suspensionsCount: FieldValue.increment(1),
    suspendedUntil: suspendedUntil,
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'suspend_user',
    targetType: 'user',
    targetId: targetUserId,
    reason,
    reportId,
    metadata: { durationHours, suspendedUntil },
  });
  
  await logAdminAction({ adminId, action: 'SUSPEND_USER', targetType: 'user', targetId: targetUserId, details: { reason, durationHours } });

  // Trigger suspension notice
  try {
    const { createNotificationAndPush } = await import('./notificationService');
    await createNotificationAndPush({
      userId: targetUserId,
      type: 'moderation',
      channel: 'both',
      title: 'Tu Cuenta ha sido Suspendida 🚨',
      body: `Tu cuenta fue suspendida temporalmente por: ${reason} hasta ${suspendedUntil.toLocaleString()}.`,
      actionType: 'none',
    });
  } catch (err) {
    console.error('Failed to send suspend notification:', err);
  }
};

export const unsuspendUser = async (targetUserId: string, adminId: string, reason?: string) => {
  await updateUserStatus(targetUserId, 'active');
  await updateUserModerationState(targetUserId, {
    userId: targetUserId,
    status: 'active',
    suspendedUntil: null,
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'unsuspend_user',
    targetType: 'user',
    targetId: targetUserId,
    reason,
  });
  
  await logAdminAction({ adminId, action: 'UNSUSPEND_USER', targetType: 'user', targetId: targetUserId, details: { reason } });
};

export const banUser = async (targetUserId: string, adminId: string, reason: string, reportId?: string) => {
  await updateUserStatus(targetUserId, 'banned');
  await updateUserModerationState(targetUserId, {
    userId: targetUserId,
    status: 'banned',
    bansCount: FieldValue.increment(1),
    bannedAt: FieldValue.serverTimestamp(),
    bannedReason: reason,
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'ban_user',
    targetType: 'user',
    targetId: targetUserId,
    reason,
    reportId,
  });
  
  await logAdminAction({ adminId, action: 'BAN_USER', targetType: 'user', targetId: targetUserId, details: { reason } });
};

export const unbanUser = async (targetUserId: string, adminId: string, reason?: string) => {
  await updateUserStatus(targetUserId, 'active');
  await updateUserModerationState(targetUserId, {
    userId: targetUserId,
    status: 'active',
    bannedAt: null,
    bannedReason: null,
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'unban_user',
    targetType: 'user',
    targetId: targetUserId,
    reason,
  });
  
  await logAdminAction({ adminId, action: 'UNBAN_USER', targetType: 'user', targetId: targetUserId, details: { reason } });
};

// --- Content Actions ---

export const hideMessage = async (targetType: 'room' | 'live', parentId: string, messageId: string, adminId: string, reason: string, reportId?: string) => {
  const collectionPath = targetType === 'room' ? `rooms/${parentId}/messages` : `lives/${parentId}/messages`;
  
  await db.collection(collectionPath).doc(messageId).update({
    status: 'hidden',
    hiddenBy: adminId,
    hiddenReason: reason,
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'hide_message',
    targetType: 'message',
    targetId: messageId,
    roomId: targetType === 'room' ? parentId : undefined,
    liveId: targetType === 'live' ? parentId : undefined,
    reason,
    reportId,
  });
  
  await logAdminAction({ adminId, action: 'HIDE_MESSAGE', targetType: 'message', targetId: messageId, details: { reason, targetType, parentId } });
};

export const closeRoom = async (roomId: string, adminId: string, reason: string, reportId?: string) => {
  await db.collection('rooms').doc(roomId).update({
    status: 'closed',
    closedReason: reason,
    closedBy: adminId,
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'close_room',
    targetType: 'room',
    targetId: roomId,
    reason,
    reportId,
  });
  
  await logAdminAction({ adminId, action: 'CLOSE_ROOM', targetType: 'room', targetId: roomId, details: { reason } });
};

export const suspendRoom = async (roomId: string, adminId: string, reason: string, reportId?: string) => {
  await db.collection('rooms').doc(roomId).update({
    status: 'suspended',
    suspendedReason: reason,
    suspendedBy: adminId,
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'suspend_room',
    targetType: 'room',
    targetId: roomId,
    reason,
    reportId,
  });
  
  await logAdminAction({ adminId, action: 'SUSPEND_ROOM', targetType: 'room', targetId: roomId, details: { reason } });
};

export const endLive = async (liveId: string, adminId: string, reason: string, reportId?: string) => {
  await db.collection('lives').doc(liveId).update({
    status: 'ended',
    endedReason: reason,
    endedBy: adminId,
    endedAt: FieldValue.serverTimestamp(),
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'end_live',
    targetType: 'live',
    targetId: liveId,
    reason,
    reportId,
  });
  
  await logAdminAction({ adminId, action: 'END_LIVE', targetType: 'live', targetId: liveId, details: { reason } });
};

export const lockWallet = async (userId: string, adminId: string, reason: string, reportId?: string) => {
  await db.collection('wallets').doc(userId).update({
    status: 'locked',
    lockedReason: reason,
    lockedBy: adminId,
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'lock_wallet',
    targetType: 'wallet',
    targetId: userId,
    reason,
    reportId,
  });
  
  await logAdminAction({ adminId, action: 'LOCK_WALLET', targetType: 'wallet', targetId: userId, details: { reason } });
};

export const unlockWallet = async (userId: string, adminId: string, reason?: string) => {
  await db.collection('wallets').doc(userId).update({
    status: 'active',
    lockedReason: FieldValue.delete(),
    lockedBy: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  await createModerationLog({
    actorId: adminId,
    actorRole: 'admin',
    action: 'unlock_wallet',
    targetType: 'wallet',
    targetId: userId,
    reason,
  });
  
  await logAdminAction({ adminId, action: 'UNLOCK_WALLET', targetType: 'wallet', targetId: userId, details: { reason } });
};

export const getModerationLogs = async (limit: number = 50) => {
  const snap = await db.collection('moderationLogs').orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
};
