import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface SafetyCase {
  id: string;
  reporterId: string;
  targetUserId: string;
  targetContentId?: string;
  category: 'HARASSMENT' | 'BULLYING' | 'SEXUAL_CONTENT' | 'CHILD_SAFETY' | 'VIOLENCE' | 'THREATS' | 'SCAM' | 'FRAUD' | 'SPAM' | 'IMPERSONATION' | 'COPYRIGHT' | 'OTHER';
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'ACTION_REQUIRED' | 'MONITORING' | 'RESOLVED' | 'CLOSED';
  description: string;
  reportCount: number;
  assignedTeam: 'SAFETY' | 'FINANCE' | 'COPYRIGHT' | 'GENERAL';
  createdAt: any;
  updatedAt: any;
}

export interface CaseAppeal {
  id: string;
  caseId: string;
  userId: string;
  reason: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'UPHELD' | 'REVERSED';
  reviewerId?: string;
  resolutionNotes?: string;
  createdAt: any;
  updatedAt: any;
}

export const createSafetyReport = async (
  reporterId: string,
  data: {
    targetUserId: string;
    targetContentId?: string;
    category: SafetyCase['category'];
    description: string;
  }
): Promise<SafetyCase> => {
  // Deduplication check: Check if open case exists for target
  const existingSnap = await db.collection('safetyCases')
    .where('targetUserId', '==', data.targetUserId)
    .where('category', '==', data.category)
    .where('status', 'in', ['OPEN', 'INVESTIGATING'])
    .limit(1)
    .get();

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  if (!existingSnap.empty) {
    const existingRef = existingSnap.docs[0].ref;
    await existingRef.update({
      reportCount: admin.firestore.FieldValue.increment(1),
      updatedAt: timestamp,
    });
    const updated = await existingRef.get();
    return updated.data() as SafetyCase;
  }

  // Severity & Team calculation
  let severity: SafetyCase['severity'] = 'NORMAL';
  if (data.category === 'CHILD_SAFETY' || data.category === 'THREATS' || data.category === 'VIOLENCE') {
    severity = 'CRITICAL';
  } else if (data.category === 'FRAUD' || data.category === 'SCAM' || data.category === 'IMPERSONATION') {
    severity = 'HIGH';
  } else if (data.category === 'SPAM') {
    severity = 'LOW';
  }

  let assignedTeam: SafetyCase['assignedTeam'] = 'SAFETY';
  if (data.category === 'FRAUD' || data.category === 'SCAM') {
    assignedTeam = 'FINANCE';
  } else if (data.category === 'COPYRIGHT') {
    assignedTeam = 'COPYRIGHT';
  }

  const caseRef = db.collection('safetyCases').doc();
  const newCase: SafetyCase = {
    id: caseRef.id,
    reporterId,
    targetUserId: data.targetUserId,
    targetContentId: data.targetContentId || '',
    category: data.category,
    severity,
    status: 'OPEN',
    description: data.description,
    reportCount: 1,
    assignedTeam,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await caseRef.set(newCase);
  return newCase;
};

export const getModerationQueue = async (
  statusFilter: string = 'OPEN'
): Promise<SafetyCase[]> => {
  let query: admin.firestore.Query = db.collection('safetyCases');

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.where('status', '==', statusFilter);
  }

  const snap = await query.limit(100).get();
  const cases = snap.docs.map((d) => d.data() as SafetyCase);

  const prioRank: Record<string, number> = { CRITICAL: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
  cases.sort((a, b) => (prioRank[b.severity] || 0) - (prioRank[a.severity] || 0));

  return cases;
};

export const submitCaseAppeal = async (
  userId: string,
  caseId: string,
  reason: string
): Promise<CaseAppeal> => {
  const appealRef = db.collection('caseAppeals').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const appeal: CaseAppeal = {
    id: appealRef.id,
    caseId,
    userId,
    reason,
    status: 'SUBMITTED',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await appealRef.set(appeal);
  return appeal;
};

export const reviewCaseAppeal = async (
  appealId: string,
  status: 'UPHELD' | 'REVERSED',
  resolutionNotes: string,
  adminId: string
): Promise<CaseAppeal> => {
  const appealRef = db.collection('caseAppeals').doc(appealId);
  const snap = await appealRef.get();
  if (!snap.exists) throw new Error(`APPEAL_NOT_FOUND: ${appealId}`);

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(appealRef, {
      status,
      reviewerId: adminId,
      resolutionNotes,
      updatedAt: timestamp,
    });

    // Audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      actor: adminId,
      action: status === 'REVERSED' ? 'SAFETY_APPEAL_REVERSED' : 'SAFETY_APPEAL_UPHELD',
      appealId,
      timestamp,
    });
  });

  const updatedSnap = await appealRef.get();
  return updatedSnap.data() as CaseAppeal;
};
