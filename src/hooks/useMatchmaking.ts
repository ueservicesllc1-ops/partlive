import { useState, useEffect, useCallback, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import { MatchmakingRequest, GameType } from '../types/game';
import {
  quickMatch as apiQuickMatch,
  createMatchmakingRequest,
  cancelMatchmakingRequest,
  listenToMatchmakingRequest,
} from '../services/firebase/firestore/matchmakingService';

interface MatchmakingOptions {
  preferredPlayers?: number;
  region?: string;
  language?: string;
  skillLevel?: 'any' | 'beginner' | 'intermediate' | 'advanced';
  totalRounds?: number;
}

export const useMatchmaking = () => {
  const currentUser = auth().currentUser;
  const uid = currentUser?.uid ?? '';

  const [searching, setSearching] = useState<boolean>(false);
  const [request, setRequest] = useState<MatchmakingRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unsubRef = useRef<(() => void) | null>(null);

  // Clean up listener on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  /**
   * One-shot quick match. Finds an existing session or hosts a new one.
   * Resolves immediately with the sessionId.
   */
  const quickMatch = useCallback(
    async (
      game: { id: string; slug: GameType; minPlayers: number; maxPlayers: number },
      options?: MatchmakingOptions,
    ): Promise<string> => {
      if (!uid) throw new Error('Usuario no autenticado.');
      setError(null);
      setSearching(true);
      try {
        const userProfile = {
          uid,
          displayName: currentUser?.displayName || `User_${uid.slice(0, 4)}`,
          photoURL: currentUser?.photoURL || undefined,
        };
        const sessionId = await apiQuickMatch(game, userProfile, options);
        setSearching(false);
        return sessionId;
      } catch (err: any) {
        setError(err.message);
        setSearching(false);
        throw err;
      }
    },
    [uid, currentUser],
  );

  /**
   * Starts an asynchronous matchmaking request, listening to updates (useful for backend matching).
   */
  const startSearch = useCallback(
    async (
      game: { id: string; slug: GameType },
      options?: MatchmakingOptions,
      onMatchFound?: (sessionId: string) => void,
    ): Promise<string> => {
      if (!uid) throw new Error('Usuario no autenticado.');
      setError(null);
      setSearching(true);
      
      try {
        const userProfile = { uid };
        const requestId = await createMatchmakingRequest(game, userProfile, options);
        
        // Clean up previous listener
        if (unsubRef.current) unsubRef.current();

        unsubRef.current = listenToMatchmakingRequest(
          requestId,
          updatedRequest => {
            setRequest(updatedRequest);
            if (updatedRequest.status === 'matched' && updatedRequest.matchedSessionId) {
              setSearching(false);
              if (unsubRef.current) unsubRef.current();
              onMatchFound?.(updatedRequest.matchedSessionId);
            } else if (updatedRequest.status === 'expired' || updatedRequest.status === 'cancelled') {
              setSearching(false);
              if (unsubRef.current) unsubRef.current();
            }
          },
          err => {
            setError(err.message);
            setSearching(false);
          }
        );

        return requestId;
      } catch (err: any) {
        setError(err.message);
        setSearching(false);
        throw err;
      }
    },
    [uid],
  );

  /**
   * Cancels the active matchmaking request.
   */
  const cancelSearch = useCallback(async (): Promise<void> => {
    if (!uid) return;
    setError(null);
    try {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      await cancelMatchmakingRequest(uid, uid);
      setRequest(null);
      setSearching(false);
    } catch (err: any) {
      setError(err.message);
    }
  }, [uid]);

  return {
    searching,
    request,
    error,
    quickMatch,
    startSearch,
    cancelSearch,
  };
};
