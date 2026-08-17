import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface RevenueLedgerEntry {
  revenueId: string;
  source: 'COIN_PURCHASE' | 'VIP_SUBSCRIPTION' | 'HOST_SUBSCRIPTION' | 'CLUB_MEMBERSHIP' | 'PREMIUM_EVENT' | 'PROMOTION';
  sourceTransactionId: string;
  userId: string;
  hostId?: string;
  agencyId?: string;
  grossAmount: number;
  paymentFees: number;
  refundAmount: number;
  hostAmount: number;
  agencyAmount: number;
  platformAmount: number;
  netAmount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'REVERSED';
  createdAt: any;
}

export const recordRevenueEvent = async (
  source: 'COIN_PURCHASE' | 'VIP_SUBSCRIPTION' | 'HOST_SUBSCRIPTION' | 'CLUB_MEMBERSHIP' | 'PREMIUM_EVENT' | 'PROMOTION',
  sourceTransactionId: string,
  userId: string,
  grossAmount: number, // In cents or USD
  paymentFeePercent: number = 3.0, // Standard app store fee estimation
  hostSharePercent: number = 0,
  agencySharePercent: number = 0,
  hostId?: string,
  agencyId?: string,
  currency: string = 'USD'
): Promise<RevenueLedgerEntry> => {
  const ledgerRef = db.collection('revenueLedger').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const paymentFees = Number((grossAmount * (paymentFeePercent / 100)).toFixed(2));
  const afterFees = Math.max(0, grossAmount - paymentFees);

  const hostAmount = Number((afterFees * (hostSharePercent / 100)).toFixed(2));
  const agencyAmount = Number((afterFees * (agencySharePercent / 100)).toFixed(2));
  const platformAmount = Number((afterFees - hostAmount - agencyAmount).toFixed(2));
  const netAmount = platformAmount;

  const entry: RevenueLedgerEntry = {
    revenueId: ledgerRef.id,
    source,
    sourceTransactionId,
    userId,
    hostId: hostId || '',
    agencyId: agencyId || '',
    grossAmount,
    paymentFees,
    refundAmount: 0,
    hostAmount,
    agencyAmount,
    platformAmount,
    netAmount,
    currency,
    status: 'COMPLETED',
    createdAt: timestamp,
  };

  await ledgerRef.set(entry);
  return entry;
};

export const processRefundReversal = async (revenueId: string, reason?: string): Promise<void> => {
  const ledgerRef = db.collection('revenueLedger').doc(revenueId);

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ledgerRef);
    if (!snap.exists) throw new Error('Registro de ingresos no encontrado.');
    const entry = snap.data() as RevenueLedgerEntry;

    if (entry.status === 'REFUNDED') throw new Error('Este ingreso ya fue reembolsado.');

    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    transaction.update(ledgerRef, {
      status: 'REFUNDED',
      refundAmount: entry.grossAmount,
      netAmount: 0,
      refundReason: reason || 'Solicitud de reembolso procesada',
      updatedAt: timestamp,
    });

    // Write audit log
    const auditRef = db.collection('refundAuditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      revenueId,
      originalSourceTxId: entry.sourceTransactionId,
      userId: entry.userId,
      refundAmount: entry.grossAmount,
      reason: reason || '',
      createdAt: timestamp,
    });
  });
};

export const getPlatformRevenueDashboard = async (): Promise<any> => {
  const snap = await db.collection('revenueLedger')
    .where('status', '==', 'COMPLETED')
    .limit(100)
    .get();

  let grossRevenue = 0;
  let totalPaymentFees = 0;
  let totalHostPayouts = 0;
  let totalAgencyCommissions = 0;
  let netPlatformRevenue = 0;

  snap.docs.forEach((doc) => {
    const data = doc.data() as RevenueLedgerEntry;
    grossRevenue += data.grossAmount || 0;
    totalPaymentFees += data.paymentFees || 0;
    totalHostPayouts += data.hostAmount || 0;
    totalAgencyCommissions += data.agencyAmount || 0;
    netPlatformRevenue += data.netAmount || 0;
  });

  return {
    totalTransactions: snap.size,
    grossRevenue,
    totalPaymentFees,
    totalHostPayouts,
    totalAgencyCommissions,
    netPlatformRevenue,
  };
};
