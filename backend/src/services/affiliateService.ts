import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface Affiliate {
  id: string;
  name: string;
  ownerId: string;
  trackingCode: string;
  commissionModel: 'CPA' | 'REV_SHARE' | 'HYBRID';
  commissionRate: number; // e.g. 10.0 for 10%
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: any;
}

export interface AffiliateCommissionLedgerEntry {
  id: string;
  affiliateId: string;
  userId: string;
  sourceTransactionId: string;
  grossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REVERSED';
  createdAt: any;
}

export const createAffiliate = async (
  name: string,
  ownerId: string,
  trackingCode: string,
  commissionModel: 'CPA' | 'REV_SHARE' | 'HYBRID' = 'REV_SHARE',
  commissionRate: number = 10.0
): Promise<Affiliate> => {
  const affRef = db.collection('affiliates').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const affiliate: Affiliate = {
    id: affRef.id,
    name,
    ownerId,
    trackingCode: trackingCode.toUpperCase(),
    commissionModel,
    commissionRate,
    status: 'ACTIVE',
    createdAt: timestamp,
  };

  await affRef.set(affiliate);
  return affiliate;
};

export const recordAffiliateCommission = async (
  affiliateId: string,
  userId: string,
  sourceTransactionId: string,
  grossRevenue: number
): Promise<AffiliateCommissionLedgerEntry | null> => {
  const affDoc = await db.collection('affiliates').doc(affiliateId).get();
  if (!affDoc.exists) return null;

  const aff = affDoc.data() as Affiliate;
  if (aff.status !== 'ACTIVE') return null;

  const ledgerRef = db.collection('affiliateCommissionLedger').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const commissionAmount = Number(((grossRevenue * aff.commissionRate) / 100).toFixed(2));

  const entry: AffiliateCommissionLedgerEntry = {
    id: ledgerRef.id,
    affiliateId,
    userId,
    sourceTransactionId,
    grossRevenue,
    commissionRate: aff.commissionRate,
    commissionAmount,
    status: 'APPROVED',
    createdAt: timestamp,
  };

  await ledgerRef.set(entry);
  return entry;
};

export const reverseAffiliateCommission = async (sourceTransactionId: string, reason?: string): Promise<void> => {
  const snap = await db.collection('affiliateCommissionLedger')
    .where('sourceTransactionId', '==', sourceTransactionId)
    .get();

  if (snap.empty) return;

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: 'REVERSED',
      reversalReason: reason || 'Reembolso de transacción origen',
      updatedAt: timestamp,
    });
  });

  await batch.commit();
};

export const getAffiliateDashboard = async (affiliateId: string): Promise<any> => {
  const affDoc = await db.collection('affiliates').doc(affiliateId).get();
  if (!affDoc.exists) throw new Error('Afiliado no encontrado.');

  const snap = await db.collection('affiliateCommissionLedger')
    .where('affiliateId', '==', affiliateId)
    .get();

  let totalEarned = 0;
  let totalReversed = 0;

  snap.docs.forEach((doc) => {
    const data = doc.data() as AffiliateCommissionLedgerEntry;
    if (data.status === 'APPROVED') totalEarned += data.commissionAmount || 0;
    if (data.status === 'REVERSED') totalReversed += data.commissionAmount || 0;
  });

  return {
    affiliate: affDoc.data(),
    totalTransactions: snap.size,
    totalEarned,
    totalReversed,
  };
};
