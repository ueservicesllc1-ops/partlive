import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface PaymentLedgerEntry {
  id: string;
  userId: string;
  purchaseOrderId: string;
  walletTransactionId?: string;
  giftTransactionId?: string;
  payoutId?: string;
  platform: 'ios' | 'android' | 'manual';
  productId: string;
  grossAmountUsd: number;
  coinsCredited: number;
  diamondsGenerated: number;
  status: 'PURCHASE' | 'GIFT_SPEND' | 'DIAMOND_CREDIT' | 'PAYOUT';
  createdAt: any;
}

export const createPaymentLedgerEntry = async (
  entry: Omit<PaymentLedgerEntry, 'id' | 'createdAt'>
): Promise<PaymentLedgerEntry> => {
  const ref = db.collection('paymentLedger').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const ledgerEntry: PaymentLedgerEntry = {
    ...entry,
    id: ref.id,
    createdAt: timestamp,
  };

  await ref.set(ledgerEntry);
  return ledgerEntry;
};

export const getPaymentLedgerEntry = async (purchaseOrderId: string): Promise<PaymentLedgerEntry | null> => {
  const snap = await db.collection('paymentLedger')
    .where('purchaseOrderId', '==', purchaseOrderId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data() as PaymentLedgerEntry;
};

export const recordChargeback = async (
  orderId: string,
  reason: string,
  amountUsd: number
): Promise<void> => {
  const orderRef = db.collection('purchaseOrders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new Error(`ORDER_NOT_FOUND: ${orderId}`);

  const order = orderSnap.data()!;
  const userId = order.userId;

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const chargebackRef = db.collection('chargebacks').doc();

  await db.runTransaction(async (transaction) => {
    const walletRef = db.collection('wallets').doc(userId);
    const walletSnap = await transaction.get(walletRef);

    // Create chargeback record
    transaction.set(chargebackRef, {
      id: chargebackRef.id,
      orderId,
      userId,
      amountUsd,
      reason,
      status: 'OPEN',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Lock wallet for security review
    if (walletSnap.exists) {
      transaction.update(walletRef, {
        status: 'locked',
        lockedReason: `CHARGEBACK:${chargebackRef.id}`,
        updatedAt: timestamp,
      });
    }

    // Update purchase order status
    transaction.update(orderRef, {
      status: 'chargeback',
      chargebackId: chargebackRef.id,
      updatedAt: timestamp,
    });

    // Audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      actor: 'SYSTEM',
      action: 'CHARGEBACK_RECORDED',
      transactionId: orderId,
      chargebackId: chargebackRef.id,
      userId,
      amountUsd,
      reason,
      timestamp,
    });
  });
};
