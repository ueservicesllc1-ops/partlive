import { api } from './apiClient';

export interface ReportFilter {
  status?: string;
  targetType?: string;
  reason?: string;
  limit?: number;
}

export const moderationAdminApi = {
  // Reports
  getReports: async (filters: ReportFilter = {}) => {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.targetType) params.targetType = filters.targetType;
    if (filters.reason) params.reason = filters.reason;
    if (filters.limit) params.limit = String(filters.limit);

    const data = await api.get('/api/moderation/reports', { params });
    return data.reports || [];
  },

  getReportById: async (reportId: string) => {
    const data = await api.get(`/api/moderation/reports/${reportId}`);
    return data.report;
  },

  reviewReport: async (reportId: string) => {
    return api.post(`/api/moderation/reports/${reportId}/reviewing`);
  },

  resolveReport: async (reportId: string, actionTaken: string, note?: string) => {
    return api.post(`/api/moderation/reports/${reportId}/resolve`, { actionTaken, note });
  },

  rejectReport: async (reportId: string, note?: string) => {
    return api.post(`/api/moderation/reports/${reportId}/reject`, { note });
  },

  // User Moderation Actions
  warnUser: async (userId: string, reason: string, reportId?: string) => {
    return api.post(`/api/moderation/users/${userId}/warn`, { reason, reportId });
  },

  suspendUser: async (userId: string, reason: string, durationHours: number = 24, reportId?: string) => {
    return api.post(`/api/moderation/users/${userId}/suspend`, { reason, durationHours, reportId });
  },

  unsuspendUser: async (userId: string, reason?: string) => {
    return api.post(`/api/moderation/users/${userId}/unsuspend`, { reason });
  },

  banUser: async (userId: string, reason: string, reportId?: string) => {
    return api.post(`/api/moderation/users/${userId}/ban`, { reason, reportId });
  },

  unbanUser: async (userId: string, reason?: string) => {
    return api.post(`/api/moderation/users/${userId}/unban`, { reason });
  },

  // Content Actions
  hideMessage: async (targetType: 'room' | 'live', parentId: string, messageId: string, reason: string, reportId?: string) => {
    return api.post(`/api/moderation/messages/hide`, { targetType, parentId, messageId, reason, reportId });
  },

  closeRoom: async (roomId: string, reason: string, reportId?: string) => {
    return api.post(`/api/moderation/rooms/${roomId}/close`, { reason, reportId });
  },

  suspendRoom: async (roomId: string, reason: string, reportId?: string) => {
    return api.post(`/api/moderation/rooms/${roomId}/suspend`, { reason, reportId });
  },

  endLive: async (liveId: string, reason: string, reportId?: string) => {
    return api.post(`/api/moderation/lives/${liveId}/end`, { reason, reportId });
  },

  // Wallet Actions
  lockWallet: async (userId: string, reason: string, reportId?: string) => {
    return api.post(`/api/moderation/wallets/${userId}/lock`, { reason, reportId });
  },

  unlockWallet: async (userId: string, reason?: string) => {
    return api.post(`/api/moderation/wallets/${userId}/unlock`, { reason });
  },

  // Logs
  getModerationLogs: async (limit: number = 50) => {
    const data = await api.get('/api/moderation/logs', { params: { limit: String(limit) } });
    return data.logs || [];
  },
};
