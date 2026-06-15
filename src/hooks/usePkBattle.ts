import { useState, useEffect } from 'react';
import { PkBattle, PkInvite, PkGiftContribution } from '../types/pk';
import { getActivePkBattleByLive } from '../services/api/pkApi';
import {
  subscribeToPkBattle,
  subscribeToPkContributions,
  subscribeToPendingPkInvites
} from '../services/firebase/firestore/pkService';

export const usePkBattle = (liveId?: string, currentHostId?: string) => {
  const [activeBattle, setActiveBattle] = useState<PkBattle | null>(null);
  const [contributions, setContributions] = useState<PkGiftContribution[]>([]);
  const [pendingInvite, setPendingInvite] = useState<PkInvite | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch initially and subscribe to active battle
  useEffect(() => {
    if (!liveId) return;

    let unsubscribeBattle: (() => void) | null = null;
    let unsubscribeContributions: (() => void) | null = null;

    const initBattle = async () => {
      try {
        setLoading(true);
        const battle = await getActivePkBattleByLive(liveId);
        if (battle) {
          setActiveBattle(battle);
          // Subscribe to live updates of this battle
          unsubscribeBattle = subscribeToPkBattle(battle.id, (updated) => {
            setActiveBattle(updated);
          });
          // Subscribe to contributions
          unsubscribeContributions = subscribeToPkContributions(battle.id, (list) => {
            setContributions(list);
          });
        }
      } catch (err: any) {
        console.error('Error in usePkBattle initialization:', err);
        setError(err.message || 'Error loading battle data');
      } finally {
        setLoading(false);
      }
    };

    initBattle();

    return () => {
      if (unsubscribeBattle) unsubscribeBattle();
      if (unsubscribeContributions) unsubscribeContributions();
    };
  }, [liveId]);

  // 2. Subscribe to pending invites if currentHostId is provided (for hosts)
  useEffect(() => {
    if (!currentHostId) return;

    const unsubscribe = subscribeToPendingPkInvites(currentHostId, (invite) => {
      setPendingInvite(invite);
    });

    return () => {
      unsubscribe();
    };
  }, [currentHostId]);

  // 3. Battle Timer Countdown
  useEffect(() => {
    if (!activeBattle || activeBattle.status !== 'active' || !activeBattle.endsAt) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const endsAtMs = activeBattle.endsAt.toMillis
        ? activeBattle.endsAt.toMillis()
        : new Date(activeBattle.endsAt).getTime();
      const diff = Math.max(0, Math.floor((endsAtMs - Date.now()) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [activeBattle]);

  return {
    activeBattle,
    contributions,
    pendingInvite,
    timeLeft,
    loading,
    error,
    setError,
  };
};
