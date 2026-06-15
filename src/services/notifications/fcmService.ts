import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { registerDeviceToken as apiRegisterToken, deactivateDeviceToken as apiDeactivateToken } from '../api/notificationsApi';
import DeviceInfo from 'react-native-device-info'; // Optional or fallback

/**
 * Requests push notifications permission for Android 13+ and iOS.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Failed to request POST_NOTIFICATIONS permission:', err);
        return false;
      }
    }
    return true; // Android < 13 gets permission implicitly
  } else {
    // iOS permission request
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }
}

/**
 * Retrieves the FCM push token.
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    return await messaging().getToken();
  } catch (err) {
    console.error('Error fetching FCM token:', err);
    return null;
  }
}

/**
 * Registers fcm token in backend.
 */
export async function registerDeviceToken(userId: string): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('[FCM] Notification permissions denied.');
      return;
    }

    const token = await getFcmToken();
    if (!token) {
      console.log('[FCM] No token retrieved.');
      return;
    }

    let deviceName = 'Dispositivo Android';
    try {
      deviceName = await DeviceInfo.getDeviceName();
    } catch {
      // Fallback
    }

    await apiRegisterToken({
      token,
      platform: Platform.OS as 'android' | 'ios',
      deviceId: DeviceInfo.getUniqueIdSync ? DeviceInfo.getUniqueIdSync() : 'device_id_fallback',
      deviceName,
      appVersion: '1.0.0',
    });
    console.log('[FCM] Device token registered successfully.');
  } catch (err) {
    console.error('[FCM] Error registering token:', err);
  }
}

/**
 * Deactivates device token upon logout.
 */
export async function unregisterDeviceToken(): Promise<void> {
  try {
    const token = await getFcmToken();
    if (token) {
      await apiDeactivateToken(token);
      console.log('[FCM] Device token deactivated.');
    }
  } catch (err) {
    console.error('[FCM] Error unregistering token:', err);
  }
}

/**
 * Listeners for foreground push notifications.
 */
export function listenForegroundMessages(callback: (message: any) => void) {
  return messaging().onMessage(async (remoteMessage) => {
    callback(remoteMessage);
  });
}

/**
 * Handle notification click when app is in background but running.
 */
export function setupNotificationOpenedHandler(callback: (message: any) => void) {
  return messaging().onNotificationOpenedApp((remoteMessage) => {
    callback(remoteMessage);
  });
}

/**
 * Handle notification click when app is completely closed/quit.
 */
export async function getInitialNotification(): Promise<any | null> {
  try {
    return await messaging().getInitialNotification();
  } catch (err) {
    console.error('Error getting initial notification:', err);
    return null;
  }
}
