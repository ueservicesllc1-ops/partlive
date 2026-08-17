import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface AdminAuditLog {
  id: string;
  adminId: string;
  role: string;
  action: string;
  targetType: string;
  targetId: string;
  before: any;
  after: any;
  reason: string;
  timestamp: any;
}

export interface TwoPersonApprovalRequest {
  id: string;
  makerAdminId: string;
  checkerAdminId?: string;
  actionType: string;
  payloadUsd: number;
  targetId: string;
  status: 'PENDING_CHECKER_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: any;
  approvedAt?: any;
}

export const logAdminAuditAction = async (
  adminId: string,
  role: string = 'SUPER_ADMIN',
  action: string,
  targetType: string,
  targetId: string,
  before: any = null,
  after: any = null,
  reason: string = ''
): Promise<AdminAuditLog> => {
  const auditRef = db.collection('adminAuditLogs').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const log: AdminAuditLog = {
    id: auditRef.id,
    adminId,
    role,
    action,
    targetType,
    targetId,
    before: before ? JSON.parse(JSON.stringify(before)) : null,
    after: after ? JSON.parse(JSON.stringify(after)) : null,
    reason,
    timestamp,
  };

  await auditRef.set(log);
  return log;
};

export const requestTwoPersonApproval = async (
  makerAdminId: string,
  actionType: string,
  payloadUsd: number,
  targetId: string
): Promise<TwoPersonApprovalRequest> => {
  const reqRef = db.collection('twoPersonApprovals').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const request: TwoPersonApprovalRequest = {
    id: reqRef.id,
    makerAdminId,
    actionType,
    payloadUsd,
    targetId,
    status: 'PENDING_CHECKER_APPROVAL',
    createdAt: timestamp,
  };

  await reqRef.set(request);

  await logAdminAuditAction(
    makerAdminId,
    'FINANCE_ADMIN',
    'REQUEST_TWO_PERSON_APPROVAL',
    'APPROVAL_REQUEST',
    reqRef.id,
    null,
    { payloadUsd, actionType },
    'Monto excede el umbral directo'
  );

  return request;
};

export const approveTwoPersonAction = async (
  checkerAdminId: string,
  approvalId: string
): Promise<void> => {
  const reqRef = db.collection('twoPersonApprovals').doc(approvalId);

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(reqRef);
    if (!snap.exists) throw new Error('Solicitud de aprobación no encontrada.');
    const reqData = snap.data() as TwoPersonApprovalRequest;

    if (reqData.makerAdminId === checkerAdminId) {
      throw new Error('El creador de la solicitud no puede aprobar su propia operación (Principio Maker/Checker).');
    }

    if (reqData.status !== 'PENDING_CHECKER_APPROVAL') {
      throw new Error('La solicitud ya fue procesada.');
    }

    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    transaction.update(reqRef, {
      status: 'APPROVED',
      checkerAdminId,
      approvedAt: timestamp,
    });
  });

  await logAdminAuditAction(
    checkerAdminId,
    'SUPER_ADMIN',
    'APPROVE_TWO_PERSON_ACTION',
    'APPROVAL_REQUEST',
    approvalId,
    { status: 'PENDING_CHECKER_APPROVAL' },
    { status: 'APPROVED' },
    'Aprobado por segundo administrador'
  );
};

export const getAdminOverviewMetrics = async (): Promise<any> => {
  const usersSnap = await db.collection('users').limit(200).get();
  const hostsSnap = await db.collection('users').where('isHost', '==', true).limit(200).get();
  const revenueSnap = await db.collection('revenueLedger').where('status', '==', 'COMPLETED').limit(200).get();

  let grossRevenue = 0;
  let netRevenue = 0;

  revenueSnap.docs.forEach((doc) => {
    const data = doc.data();
    grossRevenue += data.grossAmount || 0;
    netRevenue += data.netAmount || 0;
  });

  return {
    totalUsers: usersSnap.size,
    totalHosts: hostsSnap.size,
    grossRevenue,
    netRevenue,
    systemStatus: 'HEALTHY',
  };
};
