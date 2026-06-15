import { useState, useEffect, useCallback } from 'react';
import auth from '@react-native-firebase/auth';
import { GameInvite } from '../types/game';
import {
  listenToMyPendingGameInvites,
  acceptGameInvite,
  declineGameInvite,
  getMyPendingGameInvites,
} from '../services/firebase/firestore/gameInvitesService';

export const useGameInvites = () => {
  const currentUser = auth().currentUser;
  const uid = currentUser?.uid ?? '';

  const [pendingInvites, setPendingInvites] = useState<GameInvite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to pending invites in real-time
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = listenToMyPendingGameInvites(
      uid,
      invites => {
        setPendingInvites(invites);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [uid]);

  const acceptInvite = useCallback(
    async (inviteId: string): Promise<string> => {
      if (!uid) throw new Error('Usuario no autenticado.');
      setError(null);
      try {
        const userProfile = {
          uid,
          displayName: currentUser?.displayName || `User_${uid.slice(0, 4)}`,
          photoURL: currentUser?.photoURL || undefined,
        };
        const sessionId = await acceptGameInvite(inviteId, userProfile);
        return sessionId;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [uid, currentUser],
  );

  const declineInvite = useCallback(
    async (inviteId: string): Promise<void> => {
      if (!uid) throw new Error('Usuario no autenticado.');
      setError(null);
      try {
        await declineGameInvite(inviteId, uid);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [uid],
  );

  const refresh = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const invites = await getMyPendingGameInvites(uid);
      setPendingInvites(invites);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  return {
    pendingInvites,
    loading,
    error,
    acceptInvite,
    declineInvite,
    refresh,
  };
};
