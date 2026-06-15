import { apiFetch } from './apiClient';

export interface VipPlan {
  id: string;
  name: string;
  priceUsd: number;
  durationDays: number;
  benefits: {
    badge: boolean;
    exclusiveEmojis: boolean;
    animatedEntry: boolean;
    profileHighlight: boolean;
    exclusiveGifts: boolean;
    priorityRoomEntry: boolean;
  };
  googlePlayProductId: string;
  isActive: boolean;
  sortOrder: number;
}

export const vipApi = {
  getPlans: async (): Promise<VipPlan[]> => {
    return apiFetch('/vip/plans') as Promise<VipPlan[]>;
  },

  checkStatus: async (): Promise<{ isVip: boolean }> => {
    return apiFetch('/vip/status') as Promise<{ isVip: boolean }>;
  },

  subscribe: async (planId: string, purchaseToken?: string): Promise<{ success: boolean; subscriptionId: string; message: string }> => {
    return apiFetch('/vip/subscribe', {
      method: 'POST',
      body: JSON.stringify({ planId, purchaseToken }),
    }) as Promise<{ success: boolean; subscriptionId: string; message: string }>;
  },
};
