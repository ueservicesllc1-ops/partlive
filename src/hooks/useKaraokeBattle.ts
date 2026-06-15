import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { KaraokeBattle } from '../types/karaoke';
import {
  listenToActiveBattle,
  listenToBattleVotesCount,
} from '../services/firebase/firestore/karaokeService';
import {
  createBattle as apiCreateBattle,
  joinBattle as apiJoinBattle,
  voteBattle as apiVoteBattle,
  endBattle as apiEndBattle,
} from '../services/api/karaokeApi';
import { Alert } from 'react-native';

export function useKaraokeBattle(targetType: 'room' | 'live', targetId: string) {
  const { user } = useAuth();
  const [battle, setBattle] = useState<KaraokeBattle | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Sync active battle
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToActiveBattle(targetType, targetId, (activeBattle) => {
      setBattle(activeBattle);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [targetType, targetId]);

  // Sync battle votes
  useEffect(() => {
    if (!battle?.id) {
      setVotes({});
      return;
    }
    const unsubscribe = listenToBattleVotesCount(battle.id, (voteMap) => {
      setVotes(voteMap);
    });
    return () => unsubscribe();
  }, [battle?.id]);

  const startBattle = useCallback(async (title: string, participantIds: string[], description?: string) => {
    try {
      const payload: Partial<KaraokeBattle> = {
        title,
        participantIds,
        description,
        roomId: targetType === 'room' ? targetId : undefined,
        liveId: targetType === 'live' ? targetId : undefined,
      };
      const newBattle = await apiCreateBattle(payload);
      setBattle(newBattle);
      return newBattle;
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo iniciar la batalla de Karaoke.');
      return null;
    }
  }, [targetType, targetId]);

  const joinBattle = useCallback(async () => {
    if (!battle?.id) return;
    try {
      await apiJoinBattle(battle.id);
      Alert.alert('Éxito', 'Te has unido a la batalla de Karaoke.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No te has podido unir a la batalla.');
    }
  }, [battle?.id]);

  const voteForParticipant = useCallback(async (participantId: string) => {
    if (!battle?.id) return;
    try {
      await apiVoteBattle(battle.id, participantId);
      Alert.alert('Voto Registrado', '¡Gracias por votar por tu cantante favorito!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo registrar tu voto.');
    }
  }, [battle?.id]);

  const endBattle = useCallback(async () => {
    if (!battle?.id) return;
    try {
      const result = await apiEndBattle(battle.id);
      Alert.alert('Batalla Finalizada', result.winnerId ? `El ganador es: ${result.winnerId}` : 'No hubo votos suficientes.');
      setBattle(null);
      setVotes({});
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo finalizar la batalla.');
    }
  }, [battle?.id]);

  const isParticipant = user?.uid ? battle?.participantIds.includes(user.uid) : false;
  const totalVotesCount = Object.values(votes).reduce((sum, v) => sum + v, 0);

  return {
    battle,
    votes,
    loading,
    isParticipant,
    totalVotesCount,
    startBattle,
    joinBattle,
    voteForParticipant,
    endBattle,
  };
}
