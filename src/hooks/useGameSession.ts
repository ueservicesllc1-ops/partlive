import { useState, useEffect, useCallback, useRef } from 'react';
import auth from '@react-native-firebase/auth';
import { GameSession, GamePlayer, GameMove, GameSessionStatus } from '../types/game';
import {
  listenToSession,
  listenToPlayers,
  listenToMoves,
  setPlayerReady,
  leaveGameSession,
  updateSessionStatus,
  updatePlayerScore,
  submitMove,
  joinGameSession,
} from '../services/firebase/firestore/gameSessionsService';

// ─── FSM States ───────────────────────────────────────────────────────────────
type UIPhase =
  | 'loading'
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'round_result'
  | 'finished'
  | 'error';

interface UseGameSessionResult {
  session: GameSession | null;
  players: GamePlayer[];
  currentMoves: GameMove[];
  myPlayer: GamePlayer | null;
  uiPhase: UIPhase;
  currentRound: number;
  countdown: number;
  error: string | null;

  // Actions
  setReady: () => Promise<void>;
  leave: () => Promise<void>;
  sendMove: (moveType: string, payload: Record<string, any>) => Promise<void>;
  advanceRound: () => Promise<void>;
  finishSession: (winnerId?: string) => Promise<void>;
}

const COUNTDOWN_SECONDS = 3;

export const useGameSession = (sessionId: string): UseGameSessionResult => {
  const currentUser = auth().currentUser;
  const uid = currentUser?.uid ?? '';

  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [currentMoves, setCurrentMoves] = useState<GameMove[]>([]);
  const [uiPhase, setUiPhase] = useState<UIPhase>('loading');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [error, setError] = useState<string | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const movesUnsubRef = useRef<(() => void) | null>(null);

  // ── Session listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = listenToSession(
      sessionId,
      updated => {
        setSession(updated);
        syncPhaseFromStatus(updated.status, updated.currentRound);
      },
      err => {
        setError(err.message);
        setUiPhase('error');
      },
    );
    return () => unsub();
  }, [sessionId]);

  // ── Players listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = listenToPlayers(sessionId, setPlayers, err => setError(err.message));
    return () => unsub();
  }, [sessionId]);

  // ── Auto-join session lobby ───────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.status !== 'waiting' || !uid) return;
    const isAlreadyJoined = players.some(p => p.userId === uid);
    if (!isAlreadyJoined) {
      const isHost = session.hostId === uid;
      joinGameSession(sessionId, {
        userId: uid,
        username: currentUser?.displayName || `User_${uid.slice(0, 4)}`,
        avatarEmoji: isHost ? '👑' : '🎮',
        isHost,
        isOnline: true,
      }).catch(err => {
        console.error('Failed to auto-join game session:', err);
      });
    }
  }, [session, players, uid, sessionId, currentUser]);

  // ── Moves listener (per round) ────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.status !== 'playing') return;
    movesUnsubRef.current?.();
    movesUnsubRef.current = listenToMoves(
      sessionId,
      session.currentRound,
      setCurrentMoves,
      err => setError(err.message),
    );
    return () => movesUnsubRef.current?.();
  }, [sessionId, session?.currentRound, session?.status]);

  // ── Auto-start countdown when all players are ready ──────────────────────
  useEffect(() => {
    if (!session || session.status !== 'waiting') return;
    if (players.length < session.minPlayers) return;
    const allReady = players.length > 0 && players.every(p => p.isReady);
    if (allReady) {
      startCountdown();
    }
  }, [players, session]);

  // ── Cleanup countdown on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const syncPhaseFromStatus = (status: GameSessionStatus, round: number) => {
    switch (status) {
      case 'waiting':
        setUiPhase('lobby');
        break;
      case 'ready':
        setUiPhase('countdown');
        break;
      case 'playing':
        setUiPhase('playing');
        break;
      case 'finished':
      case 'cancelled':
        setUiPhase('finished');
        break;
    }
  };

  const startCountdown = async () => {
    try {
      await updateSessionStatus(sessionId, 'ready');
      setCountdown(COUNTDOWN_SECONDS);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            updateSessionStatus(sessionId, 'playing', { currentRound: 1 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ─── Public Actions ────────────────────────────────────────────────────────

  const setReady = useCallback(async () => {
    await setPlayerReady(sessionId, uid, true);
  }, [sessionId, uid]);

  const leave = useCallback(async () => {
    await leaveGameSession(sessionId, uid);
  }, [sessionId, uid]);

  const sendMove = useCallback(
    async (moveType: string, payload: Record<string, any>) => {
      if (!session) return;
      await submitMove(sessionId, uid, session.currentRound, moveType, payload);
    },
    [sessionId, uid, session],
  );

  const advanceRound = useCallback(async () => {
    if (!session) return;
    const nextRound = session.currentRound + 1;
    if (nextRound > session.totalRounds) {
      await finishSession();
    } else {
      await updateSessionStatus(sessionId, 'playing', { currentRound: nextRound });
      setCurrentMoves([]);
    }
  }, [sessionId, session]);

  const finishSession = useCallback(
    async (winnerId?: string) => {
      await updateSessionStatus(sessionId, 'finished', {
        ...(winnerId ? { winnerId } : {}),
      });
    },
    [sessionId],
  );

  const myPlayer = players.find(p => p.userId === uid) ?? null;

  return {
    session,
    players,
    currentMoves,
    myPlayer,
    uiPhase,
    currentRound: session?.currentRound ?? 0,
    countdown,
    error,
    setReady,
    leave,
    sendMove,
    advanceRound,
    finishSession,
  };
};
