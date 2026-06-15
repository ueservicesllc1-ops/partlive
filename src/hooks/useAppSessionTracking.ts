import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useAuth } from '../store/AuthContext';
import { sessionApi } from '../services/api/sessionApi';

export const useAppSessionTracking = () => {
  const { user, userProfile } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const startSession = async () => {
    if (!user || user.uid === 'guest_user') return;
    if (sessionIdRef.current) return;

    try {
      const country = userProfile?.country || 'US';
      const platform = Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : 'web';
      
      // Real device info
      const deviceId = DeviceInfo.getUniqueIdSync();
      const appVersion = DeviceInfo.getVersion();
      const systemLocale = DeviceInfo.getSystemName();
      const language = systemLocale?.substring(0, 2) || 'en';
      
      const response = await sessionApi.startSession({
        platform,
        appVersion,
        country,
        language,
        deviceId,
      });

      if (response && response.success && response.sessionId) {
        sessionIdRef.current = response.sessionId;
        console.log('[SessionTracking] Started session:', response.sessionId);
        startHeartbeat();
      }
    } catch (error) {
      console.error('[SessionTracking] Failed to start session:', error);
    }
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    
    // Send heartbeat every 60 seconds (60000ms)
    heartbeatIntervalRef.current = setInterval(async () => {
      if (!sessionIdRef.current) return;
      try {
        await sessionApi.sendHeartbeat(sessionIdRef.current);
        console.log('[SessionTracking] Heartbeat sent for session:', sessionIdRef.current);
      } catch (error) {
        console.error('[SessionTracking] Heartbeat failed:', error);
      }
    }, 60000);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const endSession = async () => {
    const activeSessionId = sessionIdRef.current;
    if (!activeSessionId) return;

    sessionIdRef.current = null;
    stopHeartbeat();

    try {
      await sessionApi.endSession(activeSessionId);
      console.log('[SessionTracking] Ended session:', activeSessionId);
    } catch (error) {
      console.error('[SessionTracking] Failed to end session:', error);
    }
  };

  useEffect(() => {
    // Start session if authenticated
    if (user && user.uid !== 'guest_user') {
      startSession();
    } else {
      endSession();
    }

    return () => {
      endSession();
    };
  }, [user?.uid]);

  useEffect(() => {
    // Listen to background/foreground AppState transitions
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground! Resume session tracking
        console.log('[SessionTracking] App came to foreground, starting session.');
        startSession();
      } else if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App went to the background! End session to keep metrics clean
        console.log('[SessionTracking] App went to background, ending session.');
        endSession();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user?.uid, userProfile?.country]);
};
