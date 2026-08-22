import https from 'https';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

const APPLE_VERIFY_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
const APPLE_SHARED_SECRET = process.env.APPLE_IAP_SHARED_SECRET || '';

interface AppleVerifyResponse {
  status: number;
  receipt?: {
    in_app?: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date_ms: string;
      quantity: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    original_transaction_id: string;
    purchase_date_ms: string;
    expires_date_ms?: string;
    cancellation_date_ms?: string;
  }>;
}

const postJson = (url: string, body: object): Promise<AppleVerifyResponse> =>
  new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON from Apple verifyReceipt'));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });

export const verifyAppleReceipt = async (
  receiptData: string,
  productId: string
): Promise<{ transactionId: string; originalTransactionId: string; purchaseDateMs: string }> => {
  if (!APPLE_SHARED_SECRET || APPLE_SHARED_SECRET === '') {
    console.warn('⚠️ APPLE_IAP_SHARED_SECRET not configured. Returning mock verification.');
    return {
      transactionId: `MOCK_APPLE_${Date.now()}`,
      originalTransactionId: `MOCK_APPLE_ORIG_${Date.now()}`,
      purchaseDateMs: Date.now().toString(),
    };
  }

  const body = { 'receipt-data': receiptData, password: APPLE_SHARED_SECRET };

  let response = await postJson(APPLE_VERIFY_URL, body);

  // Status 21007 = sandbox receipt submitted to production → retry against sandbox
  if (response.status === 21007) {
    console.warn('[Apple IAP] Production returned 21007 — retrying against sandbox...');
    response = await postJson(APPLE_SANDBOX_URL, body);
  }

  // Status 0 = valid
  if (response.status !== 0) {
    const errorMap: Record<number, string> = {
      21000: 'INVALID_REQUEST',
      21002: 'INVALID_RECEIPT_DATA',
      21003: 'RECEIPT_AUTHENTICATION_FAILED',
      21004: 'SHARED_SECRET_MISMATCH',
      21005: 'APPLE_SERVER_UNAVAILABLE',
      21006: 'SUBSCRIPTION_EXPIRED',
      21008: 'PRODUCTION_RECEIPT_SENT_TO_SANDBOX',
      21010: 'PURCHASE_NOT_FOUND',
    };
    const msg = errorMap[response.status] || `UNKNOWN_APPLE_STATUS:${response.status}`;
    throw new Error(`Apple receipt verification failed: ${msg}`);
  }

  // Find matching in_app transaction
  const inApp = response.receipt?.in_app || response.latest_receipt_info || [];
  const match = inApp.find((t) => t.product_id === productId);

  if (!match) {
    throw new Error(`PRODUCT_NOT_FOUND_IN_RECEIPT: ${productId}`);
  }

  // Check not refunded/cancelled
  if ('cancellation_date_ms' in match && match.cancellation_date_ms) {
    throw new Error('PURCHASE_REFUNDED: Apple receipt shows cancellation');
  }

  return {
    transactionId: match.transaction_id,
    originalTransactionId: match.original_transaction_id,
    purchaseDateMs: match.purchase_date_ms,
  };
};

export const verifyApplePurchaseAndCreditCoins = async (
  userId: string,
  orderId: string,
  receiptData: string,
  productId: string
): Promise<{ ok: boolean; coinsCredited: number; wallet: any }> => {
  // 1. Verify with Apple
  const appleResult = await verifyAppleReceipt(receiptData, productId);
  const { transactionId } = appleResult;

  // 2. Idempotency — has this transactionId already been processed?
  const tokenRef = db.collection('processedPurchaseTokens').doc(transactionId);
  const tokenSnap = await tokenRef.get();

  if (tokenSnap.exists) {
    const orderSnap = await db.collection('purchaseOrders').doc(orderId).get();
    if (orderSnap.exists && orderSnap.data()?.status === 'paid') {
      const walletDoc = await db.collection('wallets').doc(userId).get();
      return {
        ok: true,
        coinsCredited: orderSnap.data()?.totalCoins || orderSnap.data()?.totalDiamonds || 0,
        wallet: walletDoc.data(),
      };
    }
    throw new Error('DUPLICATE_PURCHASE: Apple transaction already processed');
  }

  // 3. Fetch order
  const orderRef = db.collection('purchaseOrders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new Error(`ORDER_NOT_FOUND: ${orderId}`);
  const orderData = orderSnap.data()!;

  const coinsToCredit = orderData.totalCoins || orderData.totalDiamonds || 0;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  let updatedWallet: any = null;

  // 4. Atomic transaction: credit coins + mark order paid
  await db.runTransaction(async (transaction) => {
    const tokenDoc = await transaction.get(tokenRef);
    if (tokenDoc.exists) {
      throw new Error('DUPLICATE_PURCHASE: concurrent duplicate detected');
    }

    const walletRef = db.collection('wallets').doc(userId);
    const walletSnap = await transaction.get(walletRef);
    const wallet = walletSnap.exists ? walletSnap.data()! : {
      userId,
      coins: 0,
      diamonds: 0,
      status: 'active',
    };

    if (wallet.status !== 'active') {
      throw new Error(`WALLET_BLOCKED: ${wallet.status}`);
    }

    const newCoins = (wallet.coins || 0) + coinsToCredit;
    const txRef = db.collection('walletTransactions').doc();

    transaction.set(walletRef, {
      ...wallet,
      coins: newCoins,
      updatedAt: timestamp,
    }, { merge: true });

    transaction.set(txRef, {
      id: txRef.id,
      userId,
      type: 'coin_purchase',
      direction: 'credit',
      currencyType: 'coins',
      amount: coinsToCredit,
      balanceAfter: newCoins,
      status: 'completed',
      description: `Apple IAP: ${productId}`,
      relatedPurchaseId: orderId,
      metadata: { platform: 'ios', productId, appleTransactionId: transactionId },
      createdAt: timestamp,
    });

    transaction.set(tokenRef, {
      processedAt: timestamp,
      userId,
      orderId,
      platform: 'ios',
      appleTransactionId: transactionId,
    });

    transaction.update(orderRef, {
      status: 'paid',
      purchaseToken: transactionId,
      providerOrderId: transactionId,
      paidAt: timestamp,
      updatedAt: timestamp,
    });

    updatedWallet = { ...wallet, coins: newCoins };
  });

  return { ok: true, coinsCredited: coinsToCredit, wallet: updatedWallet };
};
