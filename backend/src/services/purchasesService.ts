import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { verifyAndroidProductPurchase, acknowledgeAndroidPurchase } from './googlePlayService';
import { recordDiamondPurchaseRevenue } from './revenueService';

export interface PurchaseData {
  id: string;
  userId: string;
  platform: 'android';
  productId: string;
  googlePlayProductId: string;
  purchaseToken: string;
  orderId?: string;
  packageId: string;
  diamonds: number;
  bonusDiamonds: number;
  totalDiamonds: number;
  priceUsd?: number;
  currency?: string;
  status: 'pending' | 'validated' | 'credited' | 'failed' | 'refunded' | 'duplicate';
  validationResponse?: Record<string, any>;
  errorMessage?: string;
  createdAt: any;
  updatedAt: any;
  creditedAt?: any;
}

/**
 * Validates an Android In-App Purchase and credits diamonds to the user's wallet in a transaction.
 */
export const validateAndCreditAndroidPurchase = async (
  userId: string,
  productId: string,
  purchaseToken: string,
  packageId: string
): Promise<{ purchase: PurchaseData; wallet: any }> => {
  // 1. Check for duplicate token
  const tokenRef = db.collection('processedPurchaseTokens').doc(purchaseToken);
  const tokenDoc = await tokenRef.get();
  if (tokenDoc.exists) {
    console.warn(`[IAP] Token already processed for user ${tokenDoc.data()?.userId}`);
    
    const existingPurchases = await db.collection('purchases')
      .where('purchaseToken', '==', purchaseToken)
      .where('status', '==', 'credited')
      .limit(1)
      .get();
      
    if (!existingPurchases.empty) {
      const purchase = { id: existingPurchases.docs[0].id, ...existingPurchases.docs[0].data() } as PurchaseData;
      const walletDoc = await db.collection('wallets').doc(userId).get();
      return { purchase, wallet: walletDoc.data() };
    }
    
    throw new Error('DUPLICATE_PURCHASE: Purchase token has already been processed');
  }

  // 2. Fetch the diamond package from Firestore
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

  // 3. Create a pending purchase record
  const purchaseRef = db.collection('purchases').doc();
  const purchaseId = purchaseRef.id;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const pendingPurchase: PurchaseData = {
    id: purchaseId,
    userId,
    platform: 'android',
    productId,
    googlePlayProductId: productId,
    purchaseToken,
    packageId,
    diamonds,
    bonusDiamonds,
    totalDiamonds,
    priceUsd,
    status: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await purchaseRef.set(pendingPurchase);

  let googlePurchase;
  try {
    // 4. Verify purchase with Google Play Developer API
    googlePurchase = await verifyAndroidProductPurchase(productId, purchaseToken);
  } catch (err: any) {
    console.error(`[IAP] Google Play verification failed for token: ${purchaseToken}`, err);
    await purchaseRef.update({
      status: 'failed',
      errorMessage: err.message || 'Google Play verification failed',
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
        
    await purchaseRef.update({
      status: 'failed',
      errorMessage: stateMsg,
      validationResponse: googlePurchase as Record<string, any>,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw new Error(`INVALID_PURCHASE_STATE: ${stateMsg}`);
  }

  const orderId = googlePurchase.orderId || `GPA.mock-${Date.now()}`;

  // 5. Execute DB transaction
  let updatedWallet: any = null;
  let finalPurchase: PurchaseData | null = null;

  try {
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

      // Update cache
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
        description: `Compra de paquete ${diamondPackage.title}`,
        relatedUserId: null,
        relatedRoomId: null,
        relatedLiveId: null,
        relatedGiftId: null,
        relatedGiftEventId: null,
        relatedPurchaseId: purchaseId,
        metadata: {
          platform: 'android',
          productId,
          orderId,
          purchaseToken,
        },
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
      transaction.set(txRef, txData);

      transaction.set(tokenRef, {
        processedAt: currentTimestamp,
        userId,
        orderId,
        purchaseId,
      });

      const purchaseUpdate: Partial<PurchaseData> = {
        status: 'credited',
        orderId,
        validationResponse: googlePurchase as Record<string, any>,
        creditedAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
      transaction.update(purchaseRef, purchaseUpdate);

      updatedWallet = {
        ...wallet,
        ...updatedWalletData,
      };

      finalPurchase = {
        ...pendingPurchase,
        ...purchaseUpdate,
      } as PurchaseData;
    });

    console.log(`[IAP] Successfully credited ${totalDiamonds} diamonds to user ${userId} for order ${orderId}`);

    // Track Revenue in analytics
    try {
      await recordDiamondPurchaseRevenue(priceUsd, totalDiamonds);
      
      // Fetch user profile to get country code
      const userSnap = await db.collection('users').doc(userId).get();
      const country = userSnap.exists ? (userSnap.data()?.country || 'CL') : 'CL';
      
      const { recordDiamondPurchase } = await import('./analyticsService');
      await recordDiamondPurchase(userId, totalDiamonds, priceUsd, country);
    } catch (revErr) {
      console.error('Failed to log platform revenue summary or analytics purchase:', revErr);
    }

    // Acknowledge the purchase
    try {
      await acknowledgeAndroidPurchase(productId, purchaseToken);
    } catch (ackError) {
      console.error(`[IAP] Failed to acknowledge purchase ${orderId} with Google Play`, ackError);
    }

    return { purchase: finalPurchase!, wallet: updatedWallet! };
  } catch (txError: any) {
    console.error('[IAP] Transaction failed while crediting purchase:', txError);
    if (!txError.message?.includes('DUPLICATE_PURCHASE')) {
      await purchaseRef.update({
        status: 'failed',
        errorMessage: txError.message || 'Transaction failed in database',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    throw txError;
  }
};

export const getUserPurchaseHistory = async (userId: string, limit = 50): Promise<PurchaseData[]> => {
  const snapshot = await db.collection('purchases')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseData));
};
