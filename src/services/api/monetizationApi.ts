import { apiFetch } from './apiClient';
import { Wallet } from '../../types/wallet';

export const monetizationApi = {
  getWallet: async (): Promise<Wallet> => {
    return apiFetch('/monetization/wallet') as Promise<Wallet>;
  },

  getPackages: async (): Promise<any[]> => {
    return apiFetch('/monetization/packages') as Promise<any[]>;
  },
};
