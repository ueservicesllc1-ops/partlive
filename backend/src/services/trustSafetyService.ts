import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface SafetyCase {
  id: string;
  reportId?: string;
  targetUserId: string;
  contentId?: string;
  contentType?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'INVESTIGATING' | 'ACTION_REQUIRED' | 'ACTION_TAKEN' | 'APPEAL' | 'RESOLVED' | 'DISMISSED';
  assignedTo?: string;
  resolutionNotes?: string;
  actionTaken?: 'WARNING' | 'CONTENT_REMOVAL' | 'SUSPENSION' | 'BAN' | 'DISMISSED';
  createdAt: any;
  updatedAt: any;
}

export const createSafetyCase = async (
  reportId: string,
  targetUserId: string,
  contentId: string = '',
  severity: SafetyCase['severity'] = 'MEDIUM'
): Promise<SafetyCase> => {
  const caseRef = db.collection('safetyCases').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const safetyCase: SafetyCase = {
    id: caseRef.id,
    reportId,
    targetUserId,
    contentId,
    severity,
    status: 'OPEN',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await caseRef.set(safetyCase);
  return safetyCase;
};

export const getTrustSafetyQueue = async (
  severityFilter?: string,
  statusFilter: string = 'OPEN'
): Promise<SafetyCase[]> => {
  let query: admin.firestore.Query = db.collection('safetyCases');

  if (statusFilter) {
    query = query.where('status', '==', statusFilter);
  }

  const snap = await query.limit(100).get();
  let cases = snap.docs.map((doc) => doc.data() as SafetyCase);

  // Priority sorting: CRITICAL first, then HIGH, MEDIUM, LOW
  const severityRank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  cases.sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));

  if (severityFilter) {
    cases = cases.filter((c) => c.severity === severityFilter);
  }

  return cases;
};

export const resolveSafetyCase = async (
  caseId: string,
  action: SafetyCase['actionTaken'],
  resolutionNotes: string,
  adminId: string
): Promise<SafetyCase> => {
  const caseRef = db.collection('safetyCases').doc(caseId);
  const snap = await caseRef.get();
  if (!snap.exists) throw new Error(`CASE_NOT_FOUND: ${caseId}`);

  const safetyCase = snap.data() as SafetyCase;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(caseRef, {
      status: action === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED',
      actionTaken: action,
      resolutionNotes,
      assignedTo: adminId,
      updatedAt: timestamp,
    });

    if (action === 'SUSPENSION' || action === 'BAN') {
      const userRef = db.collection('users').doc(safetyCase.targetUserId);
      transaction.update(userRef, {
        status: 'suspended',
        suspendedReason: `TRUST_SAFETY_CASE:${caseId}`,
        updatedAt: timestamp,
      });
    }

    // Audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      actor: adminId,
      action: `SAFETY_CASE_RESOLVED_${action}`,
      transactionId: caseId,
      targetUserId: safetyCase.targetUserId,
      timestamp,
    });
  });

  return { ...safetyCase, status: action === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED', actionTaken: action };
};
