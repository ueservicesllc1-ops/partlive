import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { verifyAndroidProductPurchase, acknowledgeAndroidPurchase } from './googlePlayService';

export interface PurchaseData {
  id: string;
  userId: string;
  platform: 'android';
  productId: string;
  googlePlayProductId: string;
  purchaseToken: string;
  orderId?: string;
  packageId: string;
  coins: number;
  bonusCoins: number;
  totalCoins: number;
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
 * Validates an Android In-App Purchase and credits coins to the user's wallet in a transaction.
 */
export const validateAndCreditAndroidPurchase = async (
  userId: string,
  productId: string,
  purchaseToken: string,
  packageId: string
): Promise<{ purchase: PurchaseData; wallet: any }> => {
  // 1. Check for duplicate token before doing anything
  const tokenRef = db.collection('processedPurchaseTokens').doc(purchaseToken);
  const tokenDoc = await tokenRef.get();
  if (tokenDoc.exists) {
    console.warn(`[IAP] Token already processed for user ${tokenDoc.data()?.userId}`);
    
    // Find the original credited purchase to return to user
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

  // 2. Fetch the coin package from Firestore
  const packageRef = db.collection('coinPackages').doc(packageId);
  const packageDoc = await packageRef.get();
  if (!packageDoc.exists) {
    throw new Error(`INVALID_PACKAGE: Coin package with ID ${packageId} not found`);
  }
  const coinPackage = packageDoc.data()!;
  const coins = coinPackage.coins || 0;
  const bonusCoins = coinPackage.bonusCoins || 0;
  const totalCoins = coinPackage.totalCoins || (coins + bonusCoins);
  const priceUsd = coinPackage.priceUsd || 0;

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
    coins,
    bonusCoins,
    totalCoins,
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

  // 5. Execute DB transaction to credit wallet, write transaction audit log, and update status
  let updatedWallet: any = null;
  let finalPurchase: PurchaseData | null = null;

  try {
    await db.runTransaction(async (transaction) => {
      // Re-verify processed token inside the transaction
      const tokenSnap = await transaction.get(tokenRef);
      if (tokenSnap.exists) {
        throw new Error('DUPLICATE_PURCHASE: Purchase token has already been processed');
      }

      const walletRef = db.collection('wallets').doc(userId);
      const userRef = db.collection('users').doc(userId);
      const txRef = db.collection('walletTransactions').doc();
      const currentTimestamp = admin.firestore.FieldValue.serverTimestamp();

      // Get current wallet state
      const walletSnap = await transaction.get(walletRef);
      let wallet: any;

      if (!walletSnap.exists) {
        wallet = {
          id: userId,
          userId,
          coins: 0,
          diamonds: 0,
          lifetimeCoinsPurchased: 0,
          lifetimeCoinsSpent: 0,
          lifetimeDiamondsEarned: 0,
          lifetimeDiamondsWithdrawn: 0,
          pendingDiamonds: 0,
          lockedDiamonds: 0,
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

      // Calculate new balances
      const newCoins = (wallet.coins || 0) + totalCoins;
      const newLifetimeCoinsPurchased = (wallet.lifetimeCoinsPurchased || 0) + totalCoins;

      // Update wallet
      const updatedWalletData = {
        coins: newCoins,
        lifetimeCoinsPurchased: newLifetimeCoinsPurchased,
        updatedAt: currentTimestamp,
      };

      if (!walletSnap.exists) {
        transaction.set(walletRef, { ...wallet, ...updatedWalletData });
      } else {
        transaction.update(walletRef, updatedWalletData);
      }

      // Update user profile cache
      transaction.update(userRef, {
        coins: newCoins,
        updatedAt: currentTimestamp,
      });

      // Write walletTransactions log
      const txData = {
        id: txRef.id,
        userId,
        type: 'purchase',
        direction: 'credit',
        currencyType: 'coins',
        amount: totalCoins,
        balanceAfter: newCoins,
        status: 'completed',
        description: `Compra de paquete ${coinPackage.title}`,
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
        },
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };
      transaction.set(txRef, txData);

      // Write token to processedPurchaseTokens to prevent replay attacks
      transaction.set(tokenRef, {
        processedAt: currentTimestamp,
        userId,
        orderId,
        purchaseId,
      });

      // Update purchase record to 'credited'
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

    console.log(`[IAP] Successfully credited ${totalCoins} coins to user ${userId} for order ${orderId}`);

    // 6. Acknowledge the purchase with Google Play to prevent automatic refund
    try {
      await acknowledgeAndroidPurchase(productId, purchaseToken);
    } catch (ackError) {
      // Just log the error, don't rollback the user's coins because they already paid
      console.error(`[IAP] Failed to acknowledge purchase ${orderId} with Google Play`, ackError);
    }

    return { purchase: finalPurchase!, wallet: updatedWallet! };
  } catch (txError: any) {
    console.error('[IAP] Transaction failed while crediting purchase:', txError);
    // If it wasn't a duplicate error, mark the purchase record as failed
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

/**
 * Gets the purchase history for a specific user
 */
export const getUserPurchaseHistory = async (userId: string, limit = 50): Promise<PurchaseData[]> => {
  const snapshot = await db.collection('purchases')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseData));
};
