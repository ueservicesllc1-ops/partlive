import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { registerDeviceToken, unregisterDeviceToken, listenForegroundMessages, setupNotificationOpenedHandler, getInitialNotification } from '../../services/notifications/fcmService';
import { InAppNotificationBanner } from './InAppNotificationBanner';
import { handleNotificationAction } from '../../services/notifications/notificationNavigation';
import { useNavigation } from '@react-navigation/native';

interface NotificationContextProps {
  banner: { title: string; body: string; type: string; data: any } | null;
  clearBanner: () => void;
}

const NotificationContext = createContext<NotificationContextProps>({
  banner: null,
  clearBanner: () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [activeBanner, setActiveBanner] = useState<{ title: string; body: string; type: string; data: any } | null>(null);

  // 1. Setup push tokens registration & listeners
  useEffect(() => {
    if (!user?.uid) {
      unregisterDeviceToken();
      return;
    }

    // Register token upon login
    registerDeviceToken(user.uid);

    // Listen foreground notifications
    const unsubscribeForeground = listenForegroundMessages((remoteMessage) => {
      console.log('[FCM] Foreground message received:', remoteMessage);
      if (remoteMessage.notification) {
        setActiveBanner({
          title: remoteMessage.notification.title || 'Alerta',
          body: remoteMessage.notification.body || '',
          type: remoteMessage.data?.type || 'system',
          data: remoteMessage.data || {},
        });
      }
    });

    // Listen background tap openings
    const unsubscribeOpened = setupNotificationOpenedHandler((remoteMessage) => {
      console.log('[FCM] Tap opening from background:', remoteMessage);
      handleNotificationAction(remoteMessage.data, navigation);
    });

    // Check startup tap openings
    getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('[FCM] Startup notification opening:', remoteMessage);
        handleNotificationAction(remoteMessage.data, navigation);
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, [user?.uid, navigation]);

  const clearBanner = () => setActiveBanner(null);

  return (
    <NotificationContext.Provider value={{ banner: activeBanner, clearBanner }}>
      {children}
      {activeBanner && (
        <InAppNotificationBanner
          title={activeBanner.title}
          body={activeBanner.body}
          type={activeBanner.type}
          onPress={() => {
            handleNotificationAction(activeBanner.data, navigation);
            clearBanner();
          }}
          onClose={clearBanner}
        />
      )}
    </NotificationContext.Provider>
  );
};
