import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import {
  listenToUserHostApplication,
  listenToHostStats,
  listenToHostActivities,
  listenToHostRules,
  createHostApplication,
} from '../services/firebase/firestore/hostService';
import { HostApplication, HostStats, HostActivity, HostRule, HostStatus } from '../types';

interface ApplyData {
  fullName: string;
  displayName?: string;
  username?: string;
  email?: string;
  country: string;
  phone?: string;
  socialLink?: string;
  experience?: string;
  whyHost?: string;
}

interface UseHostDashboardReturn {
  hostStatus: HostStatus;
  application: HostApplication | null;
  stats: HostStats | null;
  activities: HostActivity[];
  rules: HostRule[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  applyToBecomeHost: (data: ApplyData) => Promise<void>;
}

export const useHostDashboard = (): UseHostDashboardReturn => {
  const { userProfile } = useAuth();
  const [application, setApplication] = useState<HostApplication | null>(null);
  const [stats, setStats] = useState<HostStats | null>(null);
  const [activities, setActivities] = useState<HostActivity[]>([]);
  const [rules, setRules] = useState<HostRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Derive host status from profile + application
  const hostStatus: HostStatus = (() => {
    if (userProfile?.isHost) return 'approved';
    if (userProfile?.status === 'suspended') return 'suspended';
    if (application?.status === 'pending') return 'pending';
    if (application?.status === 'rejected') return 'rejected';
    return 'not_applied';
  })();

  useEffect(() => {
    if (!userProfile?.uid) return;

    setLoading(true);
    setError(null);
    let completed = 0;
    const totalListeners = 4;

    const checkDone = () => {
      completed++;
      if (completed >= totalListeners) {
        setLoading(false);
      }
    };

    // Listen to application
    const unsubApplication = listenToUserHostApplication(userProfile.uid, (app) => {
      setApplication(app);
      checkDone();
    });

    // Listen to stats (only if host or to show zeros)
    const unsubStats = listenToHostStats(userProfile.uid, (s) => {
      setStats(s);
      checkDone();
    });

    // Listen to activities
    const unsubActivities = listenToHostActivities(userProfile.uid, (acts) => {
      setActivities(acts);
      checkDone();
    });

    // Listen to rules (global)
    const unsubRules = listenToHostRules((r) => {
      setRules(r);
      checkDone();
    });

    return () => {
      unsubApplication();
      unsubStats();
      unsubActivities();
      unsubRules();
    };
  }, [userProfile?.uid, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const applyToBecomeHost = useCallback(async (data: ApplyData) => {
    if (!userProfile) throw new Error('Debes iniciar sesión para aplicar.');
    await createHostApplication({
      userId: userProfile.uid,
      fullName: data.fullName,
      displayName: data.displayName || userProfile.displayName,
      username: data.username || userProfile.username,
      email: data.email || userProfile.email,
      country: data.country,
      phone: data.phone,
      socialLink: data.socialLink,
      experience: data.experience,
      whyHost: data.whyHost,
    });
  }, [userProfile]);

  return {
    hostStatus,
    application,
    stats,
    activities,
    rules,
    loading,
    error,
    refresh,
    applyToBecomeHost,
  };
};
