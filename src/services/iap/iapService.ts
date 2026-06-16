import { Platform } from 'react-native';
import * as IAP from 'react-native-iap';
import { purchaseApi } from '../api/purchaseApi';

let purchaseUpdateSubscription: any = null;
let purchaseErrorSubscription: any = null;
let activeOrderId: string | null = null;

/**
 * Initializes Google Play Billing connection
 */
export const initIAP = async (): Promise<boolean> => {
  try {
    const result = await IAP.initConnection();
    console.log('[IAP] Billing connection initialized:', result);
    return true;
  } catch (error) {
    console.error('[IAP] Failed to initialize Billing connection:', error);
    return false;
  }
};

/**
 * Closes Google Play Billing connection
 */
export const endIAP = async (): Promise<void> => {
  try {
    unsubscribePurchaseListeners();
    await IAP.endConnection();
    console.log('[IAP] Billing connection closed.');
  } catch (error) {
    console.error('[IAP] Error closing Billing connection:', error);
  }
};

/**
 * Fetches product prices and localized details from Google Play Console
 */
export const getIapProducts = async (skus: string[]): Promise<IAP.Product[]> => {
  try {
    if (skus.length === 0) return [];
    console.log('[IAP] Fetching products from Google Play for SKUs:', skus);
    const products = await IAP.fetchProducts({ skus, type: 'in-app' });
    console.log('[IAP] Successfully fetched products:', products?.length || 0);
    return (products || []) as IAP.Product[];
  } catch (error) {
    console.error('[IAP] Error fetching products from Google Play:', error);
    return [];
  }
};

/**
 * Triggers Google Play UI purchase flow for a product SKU
 */
export const buyProduct = async (sku: string, orderId?: string): Promise<void> => {
  try {
    console.log(`[IAP] Initiating purchase for SKU: ${sku}, orderId: ${orderId}`);
    if (orderId) {
      activeOrderId = orderId;
    }
    if (Platform.OS === 'android') {
      await IAP.requestPurchase({
        type: 'in-app',
        request: {
          google: {
            skus: [sku],
          },
        },
      });
    } else {
      await IAP.requestPurchase({
        type: 'in-app',
        request: {
          apple: {
            sku,
          },
        },
      });
    }
  } catch (error) {
    console.error('[IAP] requestPurchase error:', error);
    if (activeOrderId) {
      try {
        await purchaseApi.markOrderFailed(activeOrderId, error instanceof Error ? error.message : 'Request purchase failed');
      } catch (err) {
        console.error('[IAP] Error marking order failed on buyProduct exception:', err);
      }
      activeOrderId = null;
    }
    throw error;
  }
};

/**
 * Registers global event listeners for native purchase updates and errors
 */
export const setupPurchaseListeners = (
  onSuccess: (purchase: any, wallet: any) => void,
  onError: (error: any) => void,
  onProgress?: (message: string) => void
): void => {
  // Clear any existing listeners first
  unsubscribePurchaseListeners();

  purchaseUpdateSubscription = IAP.purchaseUpdatedListener(async (purchase: IAP.Purchase) => {
    // transactionReceipt contains the purchaseToken on Android
    const purchaseToken = purchase.purchaseToken;
    const productId = purchase.productId;

    console.log(`[IAP] Purchase update listener triggered: product=${productId}, tokenLength=${purchaseToken?.length}`);

    if (purchaseToken) {
      try {
        if (onProgress) {
          onProgress('Acreditando diamantes en tu cuenta...');
        }

        const orderId = activeOrderId;
        if (!orderId) {
          throw new Error('No se encontró un ID de orden activo para validar la compra.');
        }

        // Call backend verification
        const response = await purchaseApi.verifyGooglePlayPurchase(orderId, purchaseToken, productId);

        if (response.ok) {
          console.log(`[IAP] Backend credited successfully. Consuming purchase on Play Console...`);
          // Mark purchase as completed/consumed locally
          await IAP.finishTransaction({ purchase, isConsumable: true });
          
          onSuccess(
            { totalDiamonds: response.diamondsCredited, id: orderId },
            response.wallet
          );
          
          activeOrderId = null;
        } else {
          throw new Error('El backend devolvió una respuesta insatisfactoria.');
        }
      } catch (error: any) {
        console.error('[IAP] Validation flow failed:', error);
        if (activeOrderId) {
          try {
            await purchaseApi.markOrderFailed(activeOrderId, error.message || 'Validation failed');
          } catch (failErr) {
            console.error('[IAP] Failed to mark order as failed in backend:', failErr);
          }
          activeOrderId = null;
        }
        onError(error);
      }
    } else {
      onError(new Error('No se recibió un token de compra válido desde Google Play.'));
    }
  });

  purchaseErrorSubscription = IAP.purchaseErrorListener(async (error: IAP.PurchaseError) => {
    console.log('[IAP] Native purchase error listener triggered:', error);
    if (activeOrderId) {
      try {
        await purchaseApi.markOrderFailed(activeOrderId, error.message || 'Purchase error');
      } catch (failErr) {
        console.error('[IAP] Failed to mark order as failed in backend:', failErr);
      }
      activeOrderId = null;
    }
    onError(error);
  });
};

/**
 * Unsubscribes event listeners to prevent memory leaks
 */
export const unsubscribePurchaseListeners = (): void => {
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
    purchaseUpdateSubscription = null;
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
    purchaseErrorSubscription = null;
  }
};
