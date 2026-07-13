import { useState, useEffect, useRef } from 'react';

/**
 * useNetworkStatus
 *
 * Detects online/offline status using the Navigator API (available in RN 0.60+)
 * and a periodic fetch-based check against the backend health endpoint.
 *
 * Returns:
 *   isOnline  – true when the device appears to have connectivity
 *   wasOffline – true if the user was offline at some point (to show "reconectado" toasts)
 */

const HEALTH_URL = 'https://partlive-production.up.railway.app/health';
const CHECK_INTERVAL_MS = 15_000; // 15 seconds

const checkConnectivity = async (): Promise<boolean> => {
  try {
    const res = await fetch(HEALTH_URL, {
      method: 'HEAD',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore – cache: 'no-store' is valid in RN's fetch
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runCheck = async () => {
    const online = await checkConnectivity();
    setIsOnline(prev => {
      if (!online && prev) {
        // Just went offline
        setWasOffline(true);
      }
      return online;
    });
  };

  useEffect(() => {
    // Run immediately on mount
    runCheck();

    // Then check periodically
    intervalRef.current = setInterval(runCheck, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, wasOffline };
};
