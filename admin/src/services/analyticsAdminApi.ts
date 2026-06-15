import { api } from './apiClient';
import {
  DailyAnalytics,
  CountryAnalytics,
  HostAnalytics,
  AgencyAnalytics,
  GiftAnalytics
} from '../types/analytics';

export const analyticsAdminApi = {
  getSummary: async (limit: number = 30): Promise<DailyAnalytics[]> => {
    return api.get(`/api/analytics/summary`, { params: { limit: String(limit) } }) as Promise<DailyAnalytics[]>;
  },

  getRevenue: async (limit: number = 30): Promise<any[]> => {
    return api.get(`/api/analytics/revenue`, { params: { limit: String(limit) } }) as Promise<any[]>;
  },

  getCountries: async (limit: number = 30): Promise<CountryAnalytics[]> => {
    return api.get(`/api/analytics/countries`, { params: { limit: String(limit) } }) as Promise<CountryAnalytics[]>;
  },

  getHosts: async (hostId: string, limit: number = 30): Promise<HostAnalytics[]> => {
    return api.get(`/api/analytics/hosts`, { params: { hostId, limit: String(limit) } }) as Promise<HostAnalytics[]>;
  },

  getAgencies: async (agencyId: string, limit: number = 30): Promise<AgencyAnalytics[]> => {
    return api.get(`/api/analytics/agencies`, { params: { agencyId, limit: String(limit) } }) as Promise<AgencyAnalytics[]>;
  },

  getGifts: async (limit: number = 30): Promise<GiftAnalytics[]> => {
    return api.get(`/api/analytics/gifts`, { params: { limit: String(limit) } }) as Promise<GiftAnalytics[]>;
  },

  rebuild: async (periodKey: string): Promise<{ success: boolean; message: string }> => {
    return api.post(`/api/analytics/rebuild`, { periodKey }) as Promise<{ success: boolean; message: string }>;
  },
};
