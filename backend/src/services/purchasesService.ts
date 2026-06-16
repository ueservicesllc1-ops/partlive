import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { verifyAndroidProductPurchase, acknowledgeAndroidPurchase } from './googlePlayService';
import { recordDiamondPurchaseRevenue } from './revenueService';

export interface PurchaseOrder {
  id: string;
  userId: string;
  packageId: string;
  googlePlayProductId: string;
  provider: 'google_play' | 'app_store' | 'stripe' | 'manual' | 'local_gateway';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'disputed' | 'cancelled';
  priceUsd: number;
  diamonds: number;
  bonusDiamonds: number;
  totalDiamonds: number;
  purchaseToken?: string;
  providerOrderId?: string;
  receiptData?: string;
  failureReason?: string;
  refundReason?: string;
  createdAt: any;
  paidAt?: any;
  failedAt?: any;
  refundedAt?: any;
  updatedAt: any;
}

export const createPurchaseOrder = async (
  userId: string,
  packageId: string,
  provider: PurchaseOrder['provider']
): Promise<PurchaseOrder> => {
  // Fetch diamond package
  const packageRef = db.collection('diamondPackages').doc(packageId);
  const packageDoc = await packageRef.get();
  if (!packageDoc.exists) {
    throw new Error(`INVALID_PACKAGE: Diamond package with ID ${packageId} not found`);
  }
  const diamondPackage = packageDoc.data()!;
  const diamonds = diamondPackage.diamonds || 0;
  const bonusDiamonds = diamondPackage.bonusDiamonds || 0;
  const totalDiamonds = diamondPackage.totalDiamonds || (diamonds + bonusDiamonds);
  const priceUsd = diamondPackage.priceUsd || 0;
  const googlePlayProductId = diamondPackage.googlePlayProductId || packageId;

  const orderRef = db.collection('purchaseOrders').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newOrder: PurchaseOrder = {
    id: orderRef.id,
    userId,
    packageId,
    googlePlayProductId,
    provider,
    status: 'pending',
    priceUsd,
    diamonds,
    bonusDiamonds,
    totalDiamonds,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await orderRef.set(newOrder);
  return { ...newOrder, id: orderRef.id };
};

export const verifyGooglePlayPurchase = async (
  userId: string,
  orderId: string,
  purchaseToken: string,
  productId: string
): Promise<{ ok: boolean; status: string; diamondsCredited: number; wallet: any }> => {
  // 1. Check duplicate token
  const tokenRef = db.collection('processedPurchaseTokens').doc(purchaseToken);
  const tokenDoc = await tokenRef.get();
  if (tokenDoc.exists) {
    console.warn(`[IAP] Token already processed for token: ${purchaseToken}`);
    const walletDoc = await db.collection('wallets').doc(userId).get();
    
    // Check if the order was already marked paid
    const orderSnap = await db.collection('purchaseOrders').doc(orderId).get();
    if (orderSnap.exists && orderSnap.data()?.status === 'paid') {
      return {
        ok: true,
        status: 'paid',
        diamondsCredited: orderSnap.data()?.totalDiamonds || 0,
        wallet: walletDoc.data(),
      };
    }
    throw new Error('DUPLICATE_PURCHASE: Purchase token has already been processed');
  }

  // 2. Fetch the order
  const orderRef = db.collection('purchaseOrders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new Error(`ORDER_NOT_FOUND: Purchase order ${orderId} does not exist`);
  }
  const orderData = orderSnap.data() as PurchaseOrder;
  if (orderData.status === 'paid') {
    const walletDoc = await db.collection('wallets').doc(userId).get();
    return {
      ok: true,
      status: 'paid',
      diamondsCredited: orderData.totalDiamonds,
      wallet: walletDoc.data(),
    };
  }

  let googlePurchase;
  try {
    // 3. Verify purchase with Google Play Developer API
    googlePurchase = await verifyAndroidProductPurchase(productId, purchaseToken);
  } catch (err: any) {
    console.error(`[IAP] Google Play verification failed for token: ${purchaseToken}`, err);
    await orderRef.update({
      status: 'failed',
      failureReason: err.message || 'Google Play verification failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw err;
  }

  // Check purchase state (0: Purchased, 1: Canceled, 2: Pending)
  if (googlePurchase.purchaseState !== 0) {
    const stateMsg =
      googlePurchase.purchaseState === 1
        ? 'Purchase was canceled'
        : googlePurchase.purchaseState === 2
        ? 'Purchase is pending approval'
        : `Unknown purchase state: ${googlePurchase.purchaseState}`;
        
    await orderRef.update({
      status: 'failed',
      failureReason: stateMsg,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw new Error(`INVALID_PURCHASE_STATE: ${stateMsg}`);
  }

  const providerOrderId = googlePurchase.orderId || `GPA.mock-${Date.now()}`;

  // 4. Run database transaction
  let updatedWallet: any = null;
  const totalDiamonds = orderData.totalDiamonds;

  await db.runTransaction(async (transaction) => {
    const tokenSnap = await transaction.get(tokenRef);
    if (tokenSnap.exists) {
      throw new Error('DUPLICATE_PURCHASE: Purchase token has already been processed');
    }

    const walletRef = db.collection('wallets').doc(userId);
    const userRef = db.collection('users').doc(userId);
    const txRef = db.collection('walletTransactions').doc();
    const currentTimestamp = admin.firestore.FieldValue.serverTimestamp();

    const walletSnap = await transaction.get(walletRef);
    let wallet: any;

    if (!walletSnap.exists) {
      wallet = {
        id: userId,
        userId,
        diamonds: 0,
        beans: 0,
        lifetimeDiamondsPurchased: 0,
        lifetimeDiamondsSpent: 0,
        lifetimeBeansEarned: 0,
        lifetimeBeansWithdrawn: 0,
        pendingBeans: 0,
        lockedBeans: 0,
        status: 'active',
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
    } else {
      wallet = walletSnap.data()!;
    }

    if (wallet.status !== 'active') {
      throw new Error(`WALLET_BLOCKED: User wallet status is ${wallet.status}`);
    }

    const newDiamonds = (wallet.diamonds || 0) + totalDiamonds;
    const newLifetimePurchased = (wallet.lifetimeDiamondsPurchased || 0) + totalDiamonds;

    const updatedWalletData = {
      diamonds: newDiamonds,
      lifetimeDiamondsPurchased: newLifetimePurchased,
      updatedAt: currentTimestamp,
    };

    if (!walletSnap.exists) {
      transaction.set(walletRef, { ...wallet, ...updatedWalletData });
    } else {
      transaction.update(walletRef, updatedWalletData);
    }

    // Update user cache
    transaction.update(userRef, {
      diamonds: newDiamonds,
      updatedAt: currentTimestamp,
    });

    // Transaction log
    const txData = {
      id: txRef.id,
      userId,
      type: 'diamond_purchase',
      direction: 'credit',
      currencyType: 'diamonds',
      amount: totalDiamonds,
      balanceAfter: newDiamonds,
      status: 'completed',
      description: `Compra de paquete ${orderData.packageId}`,
      relatedUserId: null,
      relatedRoomId: null,
      relatedLiveId: null,
      relatedGiftId: null,
      relatedGiftEventId: null,
      relatedPurchaseId: orderId,
      metadata: {
        platform: 'android',
        productId,
        providerOrderId,
        purchaseToken,
      },
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    transaction.set(txRef, txData);

    // Record token
    transaction.set(tokenRef, {
      processedAt: currentTimestamp,
      userId,
      orderId,
      providerOrderId,
    });

    // Update PurchaseOrder
    transaction.update(orderRef, {
      status: 'paid',
      purchaseToken,
      providerOrderId,
      paidAt: currentTimestamp,
      updatedAt: currentTimestamp,
    });

    updatedWallet = {
      ...wallet,
      ...updatedWalletData,
    };
  });

  // Track Revenue & Analytics in background
  try {
    await recordDiamondPurchaseRevenue(orderData.priceUsd, totalDiamonds);
    const userSnap = await db.collection('users').doc(userId).get();
    const country = userSnap.exists ? (userSnap.data()?.country || 'CL') : 'CL';
    const { recordDiamondPurchase } = await import('./analyticsService');
    await recordDiamondPurchase(userId, totalDiamonds, orderData.priceUsd, country);
  } catch (revErr) {
    console.error('Failed to log platform revenue or analytics:', revErr);
  }

  // Acknowledge the purchase
  try {
    await acknowledgeAndroidPurchase(productId, purchaseToken);
  } catch (ackError) {
    console.error(`[IAP] Failed to acknowledge purchase ${providerOrderId} with Google Play`, ackError);
  }

  return {
    ok: true,
    status: 'paid',
    diamondsCredited: totalDiamonds,
    wallet: updatedWallet,
  };
};

export const markOrderFailed = async (
  userId: string,
  orderId: string,
  failureReason: string
): Promise<void> => {
  const orderRef = db.collection('purchaseOrders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new Error(`ORDER_NOT_FOUND: Order ${orderId} does not exist`);
  }
  const order = orderSnap.data() as PurchaseOrder;
  if (order.userId !== userId) {
    throw new Error('UNAUTHORIZED: Order does not belong to the user');
  }

  await orderRef.update({
    status: 'failed',
    failureReason,
    failedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

export const adminRefundPurchase = async (orderId: string, refundReason: string): Promise<any> => {
  const orderRef = db.collection('purchaseOrders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new Error(`ORDER_NOT_FOUND: Order ${orderId} does not exist`);
  }
  const order = orderSnap.data() as PurchaseOrder;
  if (order.status !== 'paid') {
    throw new Error(`INVALID_STATUS: Can only refund paid orders. Current: ${order.status}`);
  }

  const userId = order.userId;
  const walletRef = db.collection('wallets').doc(userId);
  const userRef = db.collection('users').doc(userId);
  const txRef = db.collection('walletTransactions').doc();

  let updatedWallet: any = null;

  await db.runTransaction(async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new Error('WALLET_NOT_FOUND: User wallet not found');
    }
    const wallet = walletSnap.data()!;
    const totalDiamondsToDeduct = order.totalDiamonds;
    const currentDiamonds = wallet.diamonds || 0;

    // Deduct diamonds. If diamonds insufficient, we allow negative balance or lock wallet
    const newDiamonds = currentDiamonds - totalDiamondsToDeduct;
    const currentTimestamp = admin.firestore.FieldValue.serverTimestamp();

    const walletUpdate: Record<string, any> = {
      diamonds: newDiamonds,
      updatedAt: currentTimestamp,
    };

    // If new balance is negative, block the wallet
    if (newDiamonds < 0) {
      walletUpdate.status = 'locked';
    }

    transaction.update(walletRef, walletUpdate);
    transaction.update(userRef, {
      diamonds: newDiamonds,
      updatedAt: currentTimestamp,
    });

    // Transaction log
    transaction.set(txRef, {
      id: txRef.id,
      userId,
      type: 'refund',
      direction: 'debit',
      currencyType: 'diamonds',
      amount: totalDiamondsToDeduct,
      balanceAfter: newDiamonds,
      status: 'completed',
      description: `Reembolso de compra ${orderId}: ${refundReason}`,
      relatedUserId: null,
      relatedRoomId: null,
      relatedLiveId: null,
      relatedGiftId: null,
      relatedGiftEventId: null,
      relatedPurchaseId: orderId,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    });

    transaction.update(orderRef, {
      status: 'refunded',
      refundReason,
      refundedAt: currentTimestamp,
      updatedAt: currentTimestamp,
    });

    updatedWallet = {
      ...wallet,
      ...walletUpdate,
    };
  });

  return updatedWallet;
};

export const adminDisputePurchase = async (orderId: string): Promise<any> => {
  const orderRef = db.collection('purchaseOrders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new Error(`ORDER_NOT_FOUND: Order ${orderId} does not exist`);
  }
  const order = orderSnap.data() as PurchaseOrder;
  if (order.status !== 'paid') {
    throw new Error(`INVALID_STATUS: Can only dispute paid orders. Current: ${order.status}`);
  }

  const userId = order.userId;
  const walletRef = db.collection('wallets').doc(userId);
  const userRef = db.collection('users').doc(userId);
  const txRef = db.collection('walletTransactions').doc();

  let updatedWallet: any = null;

  await db.runTransaction(async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new Error('WALLET_NOT_FOUND: User wallet not found');
    }
    const wallet = walletSnap.data()!;
    const totalDiamondsToDeduct = order.totalDiamonds;
    const currentDiamonds = wallet.diamonds || 0;

    const newDiamonds = currentDiamonds - totalDiamondsToDeduct;
    const currentTimestamp = admin.firestore.FieldValue.serverTimestamp();

    const walletUpdate: Record<string, any> = {
      diamonds: newDiamonds,
      // Dispute locks the wallet immediately for security
      status: 'locked',
      updatedAt: currentTimestamp,
    };

    transaction.update(walletRef, walletUpdate);
    transaction.update(userRef, {
      diamonds: newDiamonds,
      updatedAt: currentTimestamp,
    });

    // Transaction log
    transaction.set(txRef, {
      id: txRef.id,
      userId,
      type: 'dispute_hold',
      direction: 'debit',
      currencyType: 'diamonds',
      amount: totalDiamondsToDeduct,
      balanceAfter: newDiamonds,
      status: 'completed',
      description: `Contracargo / Disputa de compra ${orderId}. Cartera bloqueada por seguridad.`,
      relatedUserId: null,
      relatedRoomId: null,
      relatedLiveId: null,
      relatedGiftId: null,
      relatedGiftEventId: null,
      relatedPurchaseId: orderId,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    });

    transaction.update(orderRef, {
      status: 'disputed',
      updatedAt: currentTimestamp,
    });

    updatedWallet = {
      ...wallet,
      ...walletUpdate,
    };
  });

  return updatedWallet;
};

export const getUserPurchaseHistory = async (userId: string, limit = 50): Promise<PurchaseOrder[]> => {
  const snapshot = await db.collection('purchaseOrders')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
};
