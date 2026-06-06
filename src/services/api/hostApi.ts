import { apiFetch } from './apiClient';
import { HostApplication } from '../../types';

// ─── Host API ─────────────────────────────────────────────────────────────────

/**
 * Get the current user's host status, role, and latest application.
 */
export const getMyHostInfo = async (): Promise<{
  isHost: boolean;
  role: string;
  application: HostApplication | null;
}> => {
  return (await apiFetch('/host/me')) as {
    isHost: boolean;
    role: string;
    application: HostApplication | null;
  };
};

/**
 * Submit a new host application.
 */
export const applyToBecomeHost = async (data: {
  fullName: string;
  displayName?: string;
  username?: string;
  email?: string;
  country: string;
  phone?: string;
  socialLink?: string;
  experience?: string;
  whyHost?: string;
}): Promise<{ id: string; message: string }> => {
  return (await apiFetch('/host/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  })) as { id: string; message: string };
};

/**
 * Get the current host's stats from the backend.
 */
export const getHostStats = async () => {
  return await apiFetch('/host/stats');
};

/**
 * Get the current host's activity history from the backend.
 */
export const getHostActivities = async () => {
  return await apiFetch('/host/activities');
};
