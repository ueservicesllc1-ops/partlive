import { apiFetch } from './apiClient';
import { Purchase } from '../../types/purchase';
import { Wallet } from '../../types/wallet';

export interface VerifyPurchaseResponse {
  ok: boolean;
  purchaseId: string;
  diamondsCredited: number;
  wallet: Wallet;
}

export const purchaseApi = {
  /**
   * Sends the Google Play purchase token and metadata to the backend for validation and crediting.
   */
  verifyAndroidPurchase: async (
    productId: string,
    purchaseToken: string,
    packageId: string
  ): Promise<VerifyPurchaseResponse> => {
    return apiFetch('/purchases/android/verify', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        purchaseToken,
        packageId,
      }),
    }) as Promise<VerifyPurchaseResponse>;
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
