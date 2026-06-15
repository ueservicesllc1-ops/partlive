import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { Mission, UserMissionProgress } from '../types/mission';
import { listenToActiveMissions, listenToUserMissionProgress } from '../services/firebase/firestore/missionsService';
import { claimMissionReward as apiClaimReward, devTrackMission } from '../services/api/missionApi';
import { getMissionPeriodKey } from '../utils/missionPeriods';
import { Alert } from 'react-native';

export function useMissions(typeFilter?: 'daily' | 'weekly' | 'host' | 'vip' | 'event') {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<UserMissionProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Period key computation (dynamic depending on current time)
  const [dailyKey, setDailyKey] = useState(getMissionPeriodKey('daily'));
  const [weeklyKey, setWeeklyKey] = useState(getMissionPeriodKey('weekly'));

  useEffect(() => {
    // Keep keys updated
    const interval = setInterval(() => {
      setDailyKey(getMissionPeriodKey('daily'));
      setWeeklyKey(getMissionPeriodKey('weekly'));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Set up active missions listener
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToActiveMissions((activeMissions) => {
      let filtered = activeMissions;
      if (typeFilter) {
        filtered = activeMissions.filter((m) => m.type === typeFilter);
      }
      setMissions(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [typeFilter]);

  // Set up progress listener
  useEffect(() => {
    if (!user?.uid) {
      setProgress([]);
      return;
    }

    // Since we can have multiple filters, listen to daily period by default or weekly
    const currentPeriodKey = typeFilter === 'weekly' ? weeklyKey : dailyKey;

    const unsubscribe = listenToUserMissionProgress(user.uid, currentPeriodKey, (userProgress) => {
      setProgress(userProgress);
    });

    return () => unsubscribe();
  }, [user?.uid, typeFilter, dailyKey, weeklyKey]);

  // Refresh helper
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setDailyKey(getMissionPeriodKey('daily'));
      setWeeklyKey(getMissionPeriodKey('weekly'));
    } catch (err: any) {
      setError(err?.message || 'Error updating keys');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Claim reward handler calling backend securely
  const claimReward = useCallback(async (progressId: string) => {
    try {
      const response = await apiClaimReward(progressId);
      if (response.success) {
        Alert.alert('¡Recompensa Reclamada!', 'Tu recompensa se ha acreditado con éxito.');
        return true;
      }
    } catch (err: any) {
      Alert.alert('Error al reclamar', err?.message || 'No se pudo reclamar la recompensa.');
    }
    return false;
  }, []);

  // Track event manually for development
  const trackAction = useCallback(async (actionType: string, amount: number = 1, metadata?: any) => {
    try {
      await devTrackMission(actionType, amount, metadata);
    } catch (err) {
      console.error('DevTrack error:', err);
    }
  }, []);

  // Helper functions
  const getProgressForMission = useCallback(
    (missionId: string): UserMissionProgress | undefined => {
      return progress.find((p) => p.missionId === missionId);
    },
    [progress]
  );

  const getMissionCompletionPercent = useCallback(
    (missionId: string): number => {
      const prog = getProgressForMission(missionId);
      if (!prog) return 0;
      const target = prog.targetValue || 1;
      return Math.min((prog.progress / target) * 100, 100);
    },
    [getProgressForMission]
  );

  return {
    missions,
    progress,
    loading,
    refreshing,
    error,
    claimReward,
    trackAction,
    refresh,
    getProgressForMission,
    getMissionCompletionPercent,
  };
}
