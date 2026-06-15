import { apiFetch } from './apiClient';

export interface AgencyApplyRequest {
  name: string;
  country: string;
  email: string;
  phone?: string;
}

export const agencyApi = {
  apply: async (data: AgencyApplyRequest): Promise<{ success: boolean; agencyId: string }> => {
    return apiFetch('/agencies/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }) as Promise<{ success: boolean; agencyId: string }>;
  },

  getDashboard: async (): Promise<any> => {
    return apiFetch('/agencies/dashboard') as Promise<any>;
  },

  addHost: async (hostId: string): Promise<{ success: boolean; message: string }> => {
    return apiFetch('/agencies/hosts', {
      method: 'POST',
      body: JSON.stringify({ hostId }),
    }) as Promise<{ success: boolean; message: string }>;
  },

  removeHost: async (hostId: string): Promise<{ success: boolean; message: string }> => {
    return apiFetch(`/agencies/hosts/${hostId}`, {
      method: 'DELETE',
    }) as Promise<{ success: boolean; message: string }>;
  },
};
