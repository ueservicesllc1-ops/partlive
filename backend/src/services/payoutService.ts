import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { PAYOUT_CONFIG } from '../config/payoutConfig';
import { ensureHostStats, createHostActivity } from './hostAdminService';

const HOST_PAYOUT_METHODS = 'hostPayoutMethods';
const HOST_PAYOUTS = 'hostPayouts';
const WALLETS = 'wallets';
const WALLET_TRANSACTIONS = 'walletTransactions';
const USERS = 'users';
const HOST_STATS = 'hostStats';

// Helper to mask details
const getMaskedDetails = (type: string, details: any): string => {
  if (type === 'paypal' && details.email) {
    const email = details.email;
    const parts = email.split('@');
    if (parts.length === 2) {
      const local = parts[0];
      const domain = parts[1];
      const maskedLocal = local.length > 3 
        ? local.substring(0, 3) + '*'.repeat(local.length - 3)
        : local[0] + '*'.repeat(local.length - 1);
      return `${maskedLocal}@${domain}`;
    }
    return '***';
  } else if (type === 'bank_transfer' && details.accountNumber) {
    const acc = details.accountNumber.toString();
    return acc.length > 4 ? '*'.repeat(acc.length - 4) + acc.substring(acc.length - 4) : '****';
  } else if (type === 'payoneer' && details.email) {
    const email = details.email;
    const parts = email.split('@');
    if (parts.length === 2) {
      const local = parts[0];
      const domain = parts[1];
      const maskedLocal = local.length > 3 
        ? local.substring(0, 3) + '*'.repeat(local.length - 3)
        : local[0] + '*'.repeat(local.length - 1);
      return `Payoneer: ${maskedLocal}@${domain}`;
    }
    return 'Payoneer: ***';
  }
  return 'Detalles Guardados';
};

// ─── Payout Methods CRUD ──────────────────────────────────────────────────────

export const getPayoutMethods = async (hostId: string) => {
  const snapshot = await db.collection(HOST_PAYOUT_METHODS)
    .where('hostId', '==', hostId)
    .where('isActive', '==', true)
    .get();

  const methods: any[] = [];
  snapshot.forEach(doc => {
    methods.push({ id: doc.id, ...doc.data() });
  });
  return methods;
};

export const createPayoutMethod = async (hostId: string, data: any) => {
  const methodRef = db.collection(HOST_PAYOUT_METHODS).doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  
  const maskedDetails = getMaskedDetails(data.type, data.details);

  const newMethod = {
    id: methodRef.id,
    hostId,
    type: data.type,
    label: data.label || `Mi ${data.type}`,
    details: data.details,
    maskedDetails,
    isDefault: data.isDefault || false,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runTransaction(async (transaction) => {
    if (newMethod.isDefault) {
      const defaults = await db.collection(HOST_PAYOUT_METHODS)
        .where('hostId', '==', hostId)
        .where('isDefault', '==', true)
        .where('isActive', '==', true)
        .get();

      defaults.forEach(doc => {
        transaction.update(doc.ref, { 
          isDefault: false, 
          updatedAt: admin.firestore.FieldValue.serverTimestamp() 
        });
      });
    }
    transaction.set(methodRef, newMethod);
  });

  return newMethod;
};

export const updatePayoutMethod = async (hostId: string, methodId: string, data: any) => {
  const methodRef = db.collection(HOST_PAYOUT_METHODS).doc(methodId);
  const doc = await methodRef.get();

  if (!doc.exists) throw new Error('Payment method not found');
  if (doc.data()?.hostId !== hostId) throw new Error('Unauthorized');

  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (data.label !== undefined) updateData.label = data.label;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
  if (data.details !== undefined) {
    updateData.details = data.details;
    updateData.maskedDetails = getMaskedDetails(doc.data()?.type, data.details);
  }

  await db.runTransaction(async (transaction) => {
    if (data.isDefault) {
      const defaults = await db.collection(HOST_PAYOUT_METHODS)
        .where('hostId', '==', hostId)
        .where('isDefault', '==', true)
        .where('isActive', '==', true)
        .get();

      defaults.forEach(dDoc => {
        if (dDoc.id !== methodId) {
          transaction.update(dDoc.ref, { 
            isDefault: false, 
            updatedAt: admin.firestore.FieldValue.serverTimestamp() 
          });
        }
      });
    }
    transaction.update(methodRef, updateData);
  });

  return { id: methodId, ...(doc.data()), ...updateData };
};

export const deletePayoutMethod = async (hostId: string, methodId: string) => {
  const methodRef = db.collection(HOST_PAYOUT_METHODS).doc(methodId);
  const doc = await methodRef.get();

  if (!doc.exists) throw new Error('Payment method not found');
  if (doc.data()?.hostId !== hostId) throw new Error('Unauthorized');

  await methodRef.update({
    isActive: false,
    isDefault: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: methodId, success: true };
};

// ─── Payout Request & Workflows ────────────────────────────────────────────────

export const requestHostPayout = async (hostId: string, diamondsConverted: number, payoutMethodId: string) => {
  if (!PAYOUT_CONFIG.PAYOUTS_ENABLED) {
    throw new Error('El sistema de retiros está desactivado temporalmente.');
  }

  if (diamondsConverted < PAYOUT_CONFIG.MIN_PAYOUT_DIAMONDS) {
    throw new Error(`El retiro mínimo es de ${PAYOUT_CONFIG.MIN_PAYOUT_DIAMONDS} diamantes.`);
  }

  // 1. Get and verify payout method
  const methodSnap = await db.collection(HOST_PAYOUT_METHODS).doc(payoutMethodId).get();
  if (!methodSnap.exists) throw new Error('Método de pago no encontrado.');
  
  const methodData = methodSnap.data()!;
  if (methodData.hostId !== hostId || !methodData.isActive) {
    throw new Error('Método de pago inválido o no autorizado.');
  }

  const amountUsd = diamondsConverted * PAYOUT_CONFIG.DIAMONDS_TO_USD_RATE;
  const netAmountUsd = amountUsd - PAYOUT_CONFIG.PAYOUT_FEE_USD;

  const payoutRef = db.collection(HOST_PAYOUTS).doc();
  const txRef = db.collection(WALLET_TRANSACTIONS).doc();
  const walletRef = db.collection(WALLETS).doc(hostId);
  const userRef = db.collection(USERS).doc(hostId);
  const statsRef = db.collection(HOST_STATS).doc(hostId);

  await ensureHostStats(hostId);

  let newBalance = 0;

  await db.runTransaction(async (transaction) => {
    // A. Check balance in wallet
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) throw new Error('Billetera no encontrada.');

    const walletData = walletSnap.data()!;
    if (walletData.status !== 'active') {
      throw new Error('Tu billetera está bloqueada o suspendida.');
    }

    const currentDiamonds = walletData.diamonds || 0;
    if (currentDiamonds < diamondsConverted) {
      throw new Error('Saldo de diamantes insuficiente.');
    }

    // B. Calculate new balances
    newBalance = currentDiamonds - diamondsConverted;
    const newLocked = (walletData.lockedDiamonds || 0) + diamondsConverted;

    // C. Update Wallet
    transaction.update(walletRef, {
      diamonds: newBalance,
      lockedDiamonds: newLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // D. Update User cache
    transaction.update(userRef, {
      diamonds: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // E. Update HostStats
    transaction.update(statsRef, {
      availableDiamonds: newBalance,
      lockedDiamonds: newLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // F. Create HostPayout document
    const payoutData = {
      id: payoutRef.id,
      hostId,
      amount: amountUsd,
      diamondsConverted,
      status: 'pending',
      payoutMethodId,
      payoutMethodType: methodData.type,
      payoutMethodLabel: methodData.label,
      payoutDetailsMasked: methodData.maskedDetails,
      fee: PAYOUT_CONFIG.PAYOUT_FEE_USD,
      netAmount: netAmountUsd,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    transaction.set(payoutRef, payoutData);

    // G. Create pending walletTransaction for transparency
    const txData = {
      id: txRef.id,
      userId: hostId,
      type: 'withdrawal',
      direction: 'debit',
      currencyType: 'diamonds',
      amount: diamondsConverted,
      balanceAfter: newBalance,
      status: 'pending',
      description: `Retiro de diamantes a ${methodData.label}`,
      metadata: {
        payoutId: payoutRef.id,
        methodType: methodData.type,
        maskedDetails: methodData.maskedDetails,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    transaction.set(txRef, txData);
  });

  // Create Activity log (outside transaction to avoid lock contention if it takes too long)
  await createHostActivity({
    hostId,
    type: 'payout_requested',
    title: 'Retiro Solicitado',
    description: `Solicitud de retiro creada por $${amountUsd} USD (${diamondsConverted} diamantes)`,
    diamondsDelta: -diamondsConverted,
  });

  const finalPayoutSnap = await payoutRef.get();
  return finalPayoutSnap.data();
};

export const cancelPayout = async (payoutId: string, hostId: string) => {
  const payoutRef = db.collection(HOST_PAYOUTS).doc(payoutId);
  const walletRef = db.collection(WALLETS).doc(hostId);
  const userRef = db.collection(USERS).doc(hostId);
  const statsRef = db.collection(HOST_STATS).doc(hostId);

  await ensureHostStats(hostId);

  await db.runTransaction(async (transaction) => {
    const payoutSnap = await transaction.get(payoutRef);
    if (!payoutSnap.exists) throw new Error('Solicitud de retiro no encontrada.');

    const payoutData = payoutSnap.data()!;
    if (payoutData.hostId !== hostId) throw new Error('No autorizado.');
    if (payoutData.status !== 'pending') {
      throw new Error('Solo se pueden cancelar solicitudes pendientes.');
    }

    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) throw new Error('Billetera no encontrada.');

    const walletData = walletSnap.data()!;
    const diamondsConverted = payoutData.diamondsConverted;

    const newBalance = (walletData.diamonds || 0) + diamondsConverted;
    const newLocked = Math.max(0, (walletData.lockedDiamonds || 0) - diamondsConverted);

    // Update Wallet
    transaction.update(walletRef, {
      diamonds: newBalance,
      lockedDiamonds: newLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update User
    transaction.update(userRef, {
      diamonds: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update HostStats
    transaction.update(statsRef, {
      availableDiamonds: newBalance,
      lockedDiamonds: newLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update Payout Status
    transaction.update(payoutRef, {
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Find and update wallet transaction to cancelled
    const txQuery = await db.collection(WALLET_TRANSACTIONS)
      .where('userId', '==', hostId)
      .where('metadata.payoutId', '==', payoutId)
      .limit(1)
      .get();

    txQuery.forEach(txDoc => {
      transaction.update(txDoc.ref, {
        status: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  });

  await createHostActivity({
    hostId,
    type: 'system',
    title: 'Retiro Cancelado',
    description: `Cancelaste el retiro de ${payoutId.substring(0, 8)}`,
  });

  return { success: true };
};

// ─── Admin Workflows ─────────────────────────────────────────────────────────

export const approvePayout = async (payoutId: string, adminId: string, adminNotes?: string) => {
  const payoutRef = db.collection(HOST_PAYOUTS).doc(payoutId);
  const payoutSnap = await payoutRef.get();
  if (!payoutSnap.exists) throw new Error('Payout not found');

  const payoutData = payoutSnap.data()!;
  if (payoutData.status !== 'pending') {
    throw new Error('Solo se pueden aprobar solicitudes pendientes.');
  }

  await payoutRef.update({
    status: 'approved',
    reviewedBy: adminId,
    adminNotes: adminNotes || 'Solicitud aprobada para pago.',
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await createHostActivity({
    hostId: payoutData.hostId,
    type: 'payout_approved',
    title: 'Retiro Aprobado',
    description: `Tu retiro de $${payoutData.amount} USD ha sido aprobado y está en proceso de pago.`,
  });

  return { id: payoutId, status: 'approved' };
};

export const rejectPayout = async (payoutId: string, adminId: string, adminNotes?: string) => {
  const payoutRef = db.collection(HOST_PAYOUTS).doc(payoutId);
  const payoutSnap = await payoutRef.get();
  if (!payoutSnap.exists) throw new Error('Payout not found');

  const payoutData = payoutSnap.data()!;
  if (payoutData.status !== 'pending' && payoutData.status !== 'approved') {
    throw new Error('No se puede rechazar una solicitud que ya está procesada/pagada.');
  }

  const hostId = payoutData.hostId;
  const walletRef = db.collection(WALLETS).doc(hostId);
  const userRef = db.collection(USERS).doc(hostId);
  const statsRef = db.collection(HOST_STATS).doc(hostId);

  await ensureHostStats(hostId);

  await db.runTransaction(async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) throw new Error('Billetera no encontrada.');

    const walletData = walletSnap.data()!;
    const diamondsConverted = payoutData.diamondsConverted;

    const newBalance = (walletData.diamonds || 0) + diamondsConverted;
    const newLocked = Math.max(0, (walletData.lockedDiamonds || 0) - diamondsConverted);

    // Update Wallet
    transaction.update(walletRef, {
      diamonds: newBalance,
      lockedDiamonds: newLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update User
    transaction.update(userRef, {
      diamonds: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update HostStats
    transaction.update(statsRef, {
      availableDiamonds: newBalance,
      lockedDiamonds: newLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update Payout Status
    transaction.update(payoutRef, {
      status: 'rejected',
      reviewedBy: adminId,
      adminNotes: adminNotes || 'Rechazado por el administrador.',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Find and update wallet transaction to failed
    const txQuery = await db.collection(WALLET_TRANSACTIONS)
      .where('userId', '==', hostId)
      .where('metadata.payoutId', '==', payoutId)
      .limit(1)
      .get();

    txQuery.forEach(txDoc => {
      transaction.update(txDoc.ref, {
        status: 'failed',
        description: `Retiro Rechazado: ${adminNotes || 'Rechazado por admin'}`,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  });

  await createHostActivity({
    hostId,
    type: 'payout_rejected',
    title: 'Retiro Rechazado',
    description: `Rechazado: ${adminNotes || 'No cumple los requisitos de retiro.'}`,
  });

  return { id: payoutId, status: 'rejected' };
};

export const markPayoutAsPaid = async (payoutId: string, adminId: string, adminNotes?: string) => {
  const payoutRef = db.collection(HOST_PAYOUTS).doc(payoutId);
  const payoutSnap = await payoutRef.get();
  if (!payoutSnap.exists) throw new Error('Payout not found');

  const payoutData = payoutSnap.data()!;
  if (payoutData.status !== 'approved' && payoutData.status !== 'pending') {
    throw new Error('Solo se pueden pagar solicitudes pendientes o aprobadas.');
  }

  const hostId = payoutData.hostId;
  const walletRef = db.collection(WALLETS).doc(hostId);
  const statsRef = db.collection(HOST_STATS).doc(hostId);

  await ensureHostStats(hostId);

  await db.runTransaction(async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) throw new Error('Billetera no encontrada.');

    const walletData = walletSnap.data()!;
    const diamondsConverted = payoutData.diamondsConverted;

    const newLocked = Math.max(0, (walletData.lockedDiamonds || 0) - diamondsConverted);
    const newWithdrawn = (walletData.lifetimeDiamondsWithdrawn || 0) + diamondsConverted;

    // Update Wallet
    transaction.update(walletRef, {
      lockedDiamonds: newLocked,
      lifetimeDiamondsWithdrawn: newWithdrawn,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update HostStats
    transaction.update(statsRef, {
      lockedDiamonds: newLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update Payout Status
    transaction.update(payoutRef, {
      status: 'paid',
      reviewedBy: adminId,
      adminNotes: adminNotes || 'Pago completado con éxito.',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Find and update wallet transaction to completed
    const txQuery = await db.collection(WALLET_TRANSACTIONS)
      .where('userId', '==', hostId)
      .where('metadata.payoutId', '==', payoutId)
      .limit(1)
      .get();

    txQuery.forEach(txDoc => {
      transaction.update(txDoc.ref, {
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  });

  await createHostActivity({
    hostId,
    type: 'payout_paid',
    title: 'Retiro Pagado',
    description: `Se han transferido $${payoutData.amount} USD a tu cuenta.`,
  });

  return { id: payoutId, status: 'paid' };
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getMyPayouts = async (hostId: string) => {
  const snapshot = await db.collection(HOST_PAYOUTS)
    .where('hostId', '==', hostId)
    .orderBy('createdAt', 'desc')
    .get();

  const payouts: any[] = [];
  snapshot.forEach(doc => {
    payouts.push({ id: doc.id, ...doc.data() });
  });
  return payouts;
};

export const getAdminPendingPayouts = async () => {
  const snapshot = await db.collection(HOST_PAYOUTS)
    .where('status', 'in', ['pending', 'approved'])
    .orderBy('createdAt', 'desc')
    .get();

  const payouts: any[] = [];
  snapshot.forEach(doc => {
    payouts.push({ id: doc.id, ...doc.data() });
  });
  return payouts;
};
