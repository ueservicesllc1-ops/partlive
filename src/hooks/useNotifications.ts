import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { AppNotification, UserNotificationSettings } from '../types/notification';
import { listenToUserNotifications, listenToUnreadNotificationsCount } from '../services/firebase/firestore/notificationsService';
import {
  markNotificationRead as apiMarkRead,
  markAllNotificationsRead as apiMarkAllRead,
  getNotificationSettings as apiGetSettings,
  updateNotificationSettings as apiUpdateSettings,
} from '../services/api/notificationsApi';
import { handleNotificationAction as navAction } from '../services/notifications/notificationNavigation';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

export function useNotifications() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<UserNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up notifications list listener
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenToUserNotifications(user.uid, (list) => {
      setNotifications(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Set up unread count listener
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = listenToUnreadNotificationsCount(user.uid, (count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch settings once
  const fetchSettings = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await apiGetSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings');
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSettings();
    setRefreshing(false);
  }, [fetchSettings]);

  // Mark single read
  const markRead = useCallback(async (notificationId: string) => {
    try {
      await apiMarkRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all read
  const markAllRead = useCallback(async () => {
    try {
      await apiMarkAllRead();
      Alert.alert('Éxito', 'Todas las notificaciones marcadas como leídas.');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  // Update notification preferences
  const updateSettings = useCallback(async (newSettings: Partial<UserNotificationSettings>) => {
    try {
      const res = await apiUpdateSettings(newSettings);
      if (res.success) {
        setSettings(res.settings);
        return true;
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      Alert.alert('Error', 'No se pudieron guardar las preferencias.');
    }
    return false;
  }, []);

  // Perform notification action
  const handleNotificationAction = useCallback(
    (notification: AppNotification) => {
      if (notification.status === 'unread') {
        markRead(notification.id);
      }
      navAction(notification, navigation);
    },
    [navigation, markRead]
  );

  return {
    notifications,
    unreadCount,
    settings,
    loading,
    refreshing,
    error,
    refresh,
    markRead,
    markAllRead,
    updateSettings,
    handleNotificationAction,
  };
}
