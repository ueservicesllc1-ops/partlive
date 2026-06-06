import { apiFetch } from './apiClient';
import { HostPayoutMethod, HostPayout } from '../../types/payout';

// ─── Payout Methods API ───────────────────────────────────────────────────────

export const getPayoutMethods = async (): Promise<HostPayoutMethod[]> => {
  return (await apiFetch('/payouts/methods')) as HostPayoutMethod[];
};

export const createPayoutMethod = async (data: {
  type: string;
  label?: string;
  details: any;
  isDefault?: boolean;
}): Promise<HostPayoutMethod> => {
  return (await apiFetch('/payouts/methods', {
    method: 'POST',
    body: JSON.stringify(data),
  })) as HostPayoutMethod;
};

export const updatePayoutMethod = async (
  id: string,
  data: {
    label?: string;
    details?: any;
    isDefault?: boolean;
  }
): Promise<HostPayoutMethod> => {
  return (await apiFetch(`/payouts/methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })) as HostPayoutMethod;
};

export const deletePayoutMethod = async (id: string): Promise<{ success: boolean; message: string }> => {
  return (await apiFetch(`/payouts/methods/${id}`, {
    method: 'DELETE',
  })) as { success: boolean; message: string };
};

// ─── Payout Requests API ──────────────────────────────────────────────────────

export const requestPayout = async (data: {
  diamondsConverted: number;
  payoutMethodId: string;
}): Promise<HostPayout> => {
  return (await apiFetch('/payouts/request', {
    method: 'POST',
    body: JSON.stringify(data),
  })) as HostPayout;
};

export const getMyPayouts = async (): Promise<HostPayout[]> => {
  return (await apiFetch('/payouts/my')) as HostPayout[];
};

export const cancelPayout = async (id: string): Promise<{ success: boolean; message: string }> => {
  return (await apiFetch(`/payouts/${id}/cancel`, {
    method: 'POST',
  })) as { success: boolean; message: string };
};

// ─── Admin Payout API ─────────────────────────────────────────────────────────

export const getAdminPendingPayouts = async (): Promise<HostPayout[]> => {
  return (await apiFetch('/payouts/admin/pending')) as HostPayout[];
};

export const approvePayout = async (
  id: string,
  adminNotes?: string
): Promise<{ success: boolean; message: string }> => {
  return (await apiFetch(`/payouts/admin/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ adminNotes }),
  })) as { success: boolean; message: string };
};

export const rejectPayout = async (
  id: string,
  adminNotes?: string
): Promise<{ success: boolean; message: string }> => {
  return (await apiFetch(`/payouts/admin/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ adminNotes }),
  })) as { success: boolean; message: string };
};

export const markPayoutAsPaid = async (
  id: string,
  adminNotes?: string
): Promise<{ success: boolean; message: string }> => {
  return (await apiFetch(`/payouts/admin/${id}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify({ adminNotes }),
  })) as { success: boolean; message: string };
};
