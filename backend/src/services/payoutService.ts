import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { PAYOUT_CONFIG } from '../config/payoutConfig';
import { ensureHostStats, createHostActivity } from './hostAdminService';
import { checkPayoutFraud } from './fraudService';

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
  } else if (type === 'binance' && details.binanceId) {
    const bid = details.binanceId.toString();
    return bid.length > 4 ? 'Binance: ' + '*'.repeat(bid.length - 4) + bid.substring(bid.length - 4) : 'Binance: ****';
  } else if (type === 'payphone' && details.payphonePhone) {
    const phone = details.payphonePhone.toString();
    return phone.length > 4 ? 'PayPhone: ' + '*'.repeat(phone.length - 4) + phone.substring(phone.length - 4) : 'PayPhone: ****';
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

export const requestHostPayout = async (hostId: string, beansConverted: number, payoutMethodId: string) => {
  if (!PAYOUT_CONFIG.PAYOUTS_ENABLED) {
    throw new Error('El sistema de retiros está desactivado temporalmente.');
  }

  if (beansConverted < PAYOUT_CONFIG.MIN_PAYOUT_BEANS) {
    throw new Error(`El retiro mínimo es de ${PAYOUT_CONFIG.MIN_PAYOUT_BEANS} beans ($20 USD).`);
  }

  // 1. Get and verify payout method
  const methodSnap = await db.collection(HOST_PAYOUT_METHODS).doc(payoutMethodId).get();
  if (!methodSnap.exists) throw new Error('Método de pago no encontrado.');
  
  const methodData = methodSnap.data()!;
  if (methodData.hostId !== hostId || !methodData.isActive) {
    throw new Error('Método de pago inválido o no autorizado.');
  }

  // 2. Anti-fraud check
  await checkPayoutFraud(hostId, beansConverted);

  // 3. User verification and wait time checks
  const userSnap = await db.collection(USERS).doc(hostId).get();
  if (!userSnap.exists) throw new Error('Usuario no encontrado.');
  const user = userSnap.data()!;
  
  if (user.role !== 'host' && user.role !== 'agency') {
    throw new Error('Solo los hosts o agencias aprobadas pueden retirar.');
  }
  if (!user.isKycVerified && !user.isVerified) {
    throw new Error('Tu cuenta debe estar verificada (KYC) para solicitar retiros.');
  }

  // Wait time check: 15 days since approved/created
  const createdAt = user.createdAt ? (user.createdAt.toMillis ? user.createdAt.toMillis() : new Date(user.createdAt).getTime()) : Date.now();
  const accountAgeDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  if (accountAgeDays < PAYOUT_CONFIG.FIRST_PAYOUT_WAIT_DAYS) {
    throw new Error(`Debes ser host aprobado durante al menos ${PAYOUT_CONFIG.FIRST_PAYOUT_WAIT_DAYS} días antes de tu primer retiro.`);
  }

  // 4. HostStats checklist verification
  const statsRef = db.collection(HOST_STATS).doc(hostId);
  const statsSnap = await statsRef.get();
  if (!statsSnap.exists) {
    throw new Error('Estadísticas de host no encontradas. No elegible para retiro.');
  }
  const stats = statsSnap.data()!;
  if (!stats.eligibleForPayout) {
    throw new Error('No cumples los requisitos mínimos de actividad/viewers mensuales para retirar.');
  }

  const amountUsd = beansConverted * PAYOUT_CONFIG.BEANS_TO_USD_RATE;
  const feeUsd = PAYOUT_CONFIG.PAYOUT_FEE_USD;
  const netAmountUsd = amountUsd - feeUsd;

  const payoutRef = db.collection(HOST_PAYOUTS).doc();
  const txRef = db.collection(WALLET_TRANSACTIONS).doc();
  const walletRef = db.collection(WALLETS).doc(hostId);
  const userRef = db.collection(USERS).doc(hostId);

  await ensureHostStats(hostId);

  let newBalance = 0;

  await db.runTransaction(async (transaction) => {
    // Check balance in wallet
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) throw new Error('Billetera no encontrada.');

    const walletData = walletSnap.data()!;
    if (walletData.status !== 'active') {
      throw new Error('Tu billetera está bloqueada o suspendida.');
    }

    const currentBeans = walletData.beans || 0;
    if (currentBeans < beansConverted) {
      throw new Error('Saldo de beans insuficiente.');
    }

    // Calculate new balances
    newBalance = currentBeans - beansConverted;
    const newLocked = (walletData.lockedBeans || 0) + beansConverted;

    // Update Wallet
    transaction.update(walletRef, {
      beans: newBalance,
      lockedBeans: newLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update User cache
    transaction.update(userRef, {
      beans: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create HostPayout document
    const payoutData = {
      id: payoutRef.id,
      hostId,
      amountBeans: beansConverted,
      conversionRate: PAYOUT_CONFIG.BEANS_TO_USD_RATE,
      amountUsd,
      feeUsd,
      netAmountUsd,
      status: 'pending',
      fraudReviewStatus: 'pending',
      payoutMethodId,
      payoutMethodType: methodData.type,
      payoutMethodLabel: methodData.label,
      payoutDetailsMasked: methodData.maskedDetails,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    transaction.set(payoutRef, payoutData);

    // Create pending walletTransaction for transparency
    const txData = {
      id: txRef.id,
      userId: hostId,
      type: 'payout_requested',
      direction: 'debit',
      currencyType: 'beans',
      amount: beansConverted,
      balanceAfter: newBalance,
      status: 'pending',
      description: `Retiro de beans a ${methodData.label}`,
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

  // Create Activity log
  await createHostActivity({
    hostId,
    type: 'payout_requested',
    title: 'Retiro Solicitado',
    description: `Solicitud de retiro creada por $${amountUsd} USD (${beansConverted} beans)`,
  }).catch(() => {});

  // Track payout request in analytics
  try {
    const { recordPayoutRequested } = await import('./analyticsService');
    await recordPayoutRequested(hostId, netAmountUsd, beansConverted);
  } catch (anErr) {
    console.error('Failed to track payout request in analytics:', anErr);
  }

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
    const beansConverted = payoutData.amountBeans;

    const newBalance = (walletData.beans || 0) + beansConverted;
    const newLocked = Math.max(0, (walletData.lockedBeans || 0) - beansConverted);

    // Update Wallet
    transaction.update(walletRef, {
      beans: newBalance,
      lockedBeans: newLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update User
    transaction.update(userRef, {
      beans: newBalance,
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
  }).catch(() => {});

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
    fraudReviewStatus: 'passed',
    reviewedBy: adminId,
    adminNotes: adminNotes || 'Solicitud aprobada para pago.',
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await createHostActivity({
    hostId: payoutData.hostId,
    type: 'payout_approved',
    title: 'Retiro Aprobado',
    description: `Tu retiro de $${payoutData.amountUsd} USD ha sido aprobado y está en proceso de pago.`,
  }).catch(() => {});

  // Trigger push and in-app notification
  try {
    const { createNotificationAndPush } = await import('./notificationService');
    await createNotificationAndPush({
      userId: payoutData.hostId,
      type: 'payout_update',
      channel: 'both',
      title: 'Retiro Aprobado 💸',
      body: `Tu solicitud de retiro por $${payoutData.amountUsd} USD ha sido aprobada por administración.`,
      actionType: 'open_payout',
      actionValue: payoutId,
    });
  } catch (err) {
    console.error('Failed to send payout approved notification:', err);
  }

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

  await ensureHostStats(hostId);

  await db.runTransaction(async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) throw new Error('Billetera no encontrada.');

    const walletData = walletSnap.data()!;
    const beansConverted = payoutData.amountBeans;

    const newBalance = (walletData.beans || 0) + beansConverted;
    const newLocked = Math.max(0, (walletData.lockedBeans || 0) - beansConverted);

    // Update Wallet
    transaction.update(walletRef, {
      beans: newBalance,
      lockedBeans: newLocked,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update User
    transaction.update(userRef, {
      beans: newBalance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update Payout Status
    transaction.update(payoutRef, {
      status: 'rejected',
      fraudReviewStatus: 'failed',
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
  }).catch(() => {});

  // Trigger push and in-app notification
  try {
    const { createNotificationAndPush } = await import('./notificationService');
    await createNotificationAndPush({
      userId: hostId,
      type: 'payout_update',
      channel: 'both',
      title: 'Retiro Rechazado ❌',
      body: `Tu solicitud de retiro por $${payoutData.amountUsd} USD ha sido rechazada. Revisa las notas de administración.`,
      actionType: 'open_payout',
      actionValue: payoutId,
    });
  } catch (err) {
    console.error('Failed to send payout rejected notification:', err);
  }

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

  await ensureHostStats(hostId);

  await db.runTransaction(async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) throw new Error('Billetera no encontrada.');

    const walletData = walletSnap.data()!;
    const beansConverted = payoutData.amountBeans;

    const newLocked = Math.max(0, (walletData.lockedBeans || 0) - beansConverted);
    const newWithdrawn = (walletData.lifetimeBeansWithdrawn || 0) + beansConverted;

    // Update Wallet
    transaction.update(walletRef, {
      lockedBeans: newLocked,
      lifetimeBeansWithdrawn: newWithdrawn,
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
    description: `Se han transferido $${payoutData.amountUsd} USD a tu cuenta.`,
  }).catch(() => {});

  // Trigger push and in-app notification
  try {
    const { createNotificationAndPush } = await import('./notificationService');
    await createNotificationAndPush({
      userId: hostId,
      type: 'payout_update',
      channel: 'both',
      title: 'Retiro Transferido 🎉',
      body: `¡Éxito! Tu retiro por $${payoutData.amountUsd} USD (${payoutData.amountBeans.toLocaleString()} beans) ha sido transferido.`,
      actionType: 'open_payout',
      actionValue: payoutId,
    });
  } catch (err) {
    console.error('Failed to send payout paid notification:', err);
  }

  // Track payout paid in analytics
  try {
    const { recordPayoutPaid } = await import('./analyticsService');
    await recordPayoutPaid(hostId, payoutData.netAmountUsd || payoutData.amountUsd, payoutData.amountBeans);
  } catch (anErr) {
    console.error('Failed to track payout paid in analytics:', anErr);
  }

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
