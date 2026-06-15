import { apiFetch } from './apiClient';
import { HostAnalytics, AgencyAnalytics } from '../../types/analytics';

export const analyticsApi = {
  getHostAnalytics: async (limit: number = 10): Promise<HostAnalytics[]> => {
    return apiFetch(`/analytics/host?limit=${limit}`) as Promise<HostAnalytics[]>;
  },

  getMyHostAnalytics: async (days: number = 30): Promise<{ data: any[] }> => {
    return apiFetch(`/analytics/host?limit=${days}`) as Promise<{ data: any[] }>;
  },

  getAgencyAnalytics: async (agencyId: string, limit: number = 10): Promise<AgencyAnalytics[]> => {
    return apiFetch(`/analytics/agencies/${agencyId}?limit=${limit}`) as Promise<AgencyAnalytics[]>;
  },

  getMyAgencyAnalytics: async (agencyId: string, days: number = 30): Promise<{ data: any[] }> => {
    return apiFetch(`/analytics/agencies/${agencyId}?limit=${days}`) as Promise<{ data: any[] }>;
  },
};
