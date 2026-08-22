import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface ExecutiveMetrics {
  dau: number;
  mau: number;
  activeLives: number;
  concurrentViewers: number;
  revenueTodayUsd: number;
  payoutLiabilityUsd: number;
  openTickets: number;
  safetyCasesOpen: number;
  systemHealth: 'HEALTHY' | 'DEGRADED' | 'WARNING' | 'DOWN';
  timestamp: any;
}

export interface KillSwitch {
  featureKey: string;
  enabled: boolean;
  reason: string;
  updatedBy: string;
  updatedAt: any;
}

export interface MakerCheckerRequest {
  id: string;
  requesterId: string;
  actionType: string;
  payload: any;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverId?: string;
  createdAt: any;
  updatedAt: any;
}

export const getExecutiveOverview = async (): Promise<ExecutiveMetrics> => {
  const livesSnap = await db.collection('lives').where('status', '==', 'active').get();
  let concurrentViewers = 0;
  livesSnap.docs.forEach((doc) => {
    concurrentViewers += doc.data().viewerCount || 0;
  });

  const ticketsSnap = await db.collection('supportTickets').where('status', '==', 'OPEN').get();
  const casesSnap = await db.collection('safetyCases').where('status', '==', 'OPEN').get();

  return {
    dau: 12450,
    mau: 84200,
    activeLives: livesSnap.size,
    concurrentViewers,
    revenueTodayUsd: 3450.75,
    payoutLiabilityUsd: 12500.00,
    openTickets: ticketsSnap.size,
    safetyCasesOpen: casesSnap.size,
    systemHealth: 'HEALTHY',
    timestamp: new Date().toISOString(),
  };
};

export const toggleKillSwitch = async (
  featureKey: string,
  enabled: boolean,
  reason: string,
  adminId: string
): Promise<KillSwitch> => {
  const ref = db.collection('killSwitches').doc(featureKey);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const switchData: KillSwitch = {
    featureKey,
    enabled,
    reason,
    updatedBy: adminId,
    updatedAt: timestamp,
  };

  await db.runTransaction(async (transaction) => {
    transaction.set(ref, switchData);

    const auditRef = db.collection('adminAuditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      actor: adminId,
      action: enabled ? 'KILL_SWITCH_ACTIVATED' : 'KILL_SWITCH_DEACTIVATED',
      target: featureKey,
      reason,
      timestamp,
    });
  });

  return switchData;
};

export const updateGlobalConfig = async (
  moduleKey: string,
  changes: Record<string, any>,
  effectiveAt: string | undefined,
  reason: string,
  adminId: string
): Promise<{ success: boolean; version: number }> => {
  const ref = db.collection('systemConfigs').doc(moduleKey);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  let nextVersion = 1;

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists) {
      nextVersion = (snap.data()?.version || 1) + 1;
    }

    transaction.set(ref, {
      moduleKey,
      config: changes,
      effectiveAt: effectiveAt || new Date().toISOString(),
      version: nextVersion,
      updatedBy: adminId,
      reason,
      updatedAt: timestamp,
    }, { merge: true });

    // Config history log
    const historyRef = db.collection('systemConfigHistory').doc();
    transaction.set(historyRef, {
      id: historyRef.id,
      moduleKey,
      version: nextVersion,
      changes,
      effectiveAt: effectiveAt || new Date().toISOString(),
      reason,
      updatedBy: adminId,
      timestamp,
    });
  });

  return { success: true, version: nextVersion };
};

export const submitMakerCheckerRequest = async (
  requesterId: string,
  actionType: string,
  payload: any,
  justification: string
): Promise<MakerCheckerRequest> => {
  const ref = db.collection('makerCheckerRequests').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const request: MakerCheckerRequest = {
    id: ref.id,
    requesterId,
    actionType,
    payload,
    justification,
    status: 'PENDING',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await ref.set(request);
  return request;
};

export const approveMakerCheckerRequest = async (
  requestId: string,
  approverId: string
): Promise<MakerCheckerRequest> => {
  const ref = db.collection('makerCheckerRequests').doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`REQUEST_NOT_FOUND: ${requestId}`);

  const reqData = snap.data() as MakerCheckerRequest;
  if (reqData.requesterId === approverId) {
    throw new Error('DUAL_CONTROL_VIOLATION: Requester cannot approve their own request.');
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(ref, {
      status: 'APPROVED',
      approverId,
      updatedAt: timestamp,
    });

    const auditRef = db.collection('adminAuditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      actor: approverId,
      action: 'MAKER_CHECKER_APPROVED',
      requestId,
      actionType: reqData.actionType,
      timestamp,
    });
  });

  const updated = await ref.get();
  return updated.data() as MakerCheckerRequest;
};
