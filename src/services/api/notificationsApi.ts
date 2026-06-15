import { apiFetch } from './apiClient';
import { AppNotification, UserNotificationSettings } from '../../types/notification';

export async function getNotifications(limit: number = 50): Promise<AppNotification[]> {
  return apiFetch(`/notifications?limit=${limit}`);
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return apiFetch('/notifications/unread-count');
}

export async function markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
  return apiFetch(`/notifications/${notificationId}/read`, {
    method: 'POST',
  });
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  return apiFetch('/notifications/read-all', {
    method: 'POST',
  });
}

export async function getNotificationSettings(): Promise<UserNotificationSettings> {
  return apiFetch('/notifications/settings');
}

export async function updateNotificationSettings(settings: Partial<UserNotificationSettings>): Promise<{ success: boolean; settings: UserNotificationSettings }> {
  return apiFetch('/notifications/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function registerDeviceToken(data: {
  token: string;
  platform: 'android' | 'ios';
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
}): Promise<{ success: boolean }> {
  return apiFetch('/device-tokens/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deactivateDeviceToken(token: string): Promise<{ success: boolean }> {
  return apiFetch('/device-tokens/deactivate', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
