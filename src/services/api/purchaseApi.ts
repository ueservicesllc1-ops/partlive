import { apiFetch } from './apiClient';
import { Purchase } from '../../types/purchase';
import { Wallet } from '../../types/wallet';

export interface VerifyPurchaseResponse {
  ok: boolean;
  status: string;
  diamondsCredited: number;
  wallet: Wallet;
}

export interface CreateOrderResponse {
  orderId: string;
  googlePlayProductId: string;
  status: string;
}

export const purchaseApi = {
  /**
   * Creates a purchase order in the backend before IAP is launched.
   */
  createPurchaseOrder: async (
    packageId: string,
    provider: 'google_play' | 'app_store' | 'stripe' | 'manual'
  ): Promise<CreateOrderResponse> => {
    return apiFetch('/purchases/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        packageId,
        provider,
      }),
    }) as Promise<CreateOrderResponse>;
  },

  /**
   * Verifies the Google Play purchase token and credits the user's wallet.
   */
  verifyGooglePlayPurchase: async (
    orderId: string,
    purchaseToken: string,
    productId: string
  ): Promise<VerifyPurchaseResponse> => {
    return apiFetch('/purchases/google-play/verify', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        purchaseToken,
        productId,
      }),
    }) as Promise<VerifyPurchaseResponse>;
  },

  /**
   * Marks a purchase order as failed if cancelled or failed in the app.
   */
  markOrderFailed: async (
    orderId: string,
    failureReason?: string
  ): Promise<{ ok: boolean }> => {
    return apiFetch(`/purchases/orders/${orderId}/mark-failed`, {
      method: 'POST',
      body: JSON.stringify({
        failureReason,
      }),
    }) as Promise<{ ok: boolean }>;
  },

  /**
   * Fetches the purchase history of the authenticated user.
   */
  getPurchaseHistory: async (limit = 50): Promise<Purchase[]> => {
    return apiFetch(`/purchases/my?limit=${limit}`, {
      method: 'GET',
    }) as Promise<Purchase[]>;
  },
};
