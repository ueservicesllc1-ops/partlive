import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { KaraokeSession, KaraokeQueueItem } from '../types/karaoke';
import {
  listenToActiveSession,
  listenToQueue,
} from '../services/firebase/firestore/karaokeService';
import {
  startSession as apiStartSession,
  endSession as apiEndSession,
  requestSong as apiRequestSong,
  approveQueueItem,
  rejectQueueItem,
  startQueueItem,
  completeQueueItem,
  skipQueueItem,
} from '../services/api/karaokeApi';
import { Alert } from 'react-native';

export function useKaraokeSession(targetType: 'room' | 'live', targetId: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<KaraokeSession | null>(null);
  const [queue, setQueue] = useState<KaraokeQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync session
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToActiveSession(targetType, targetId, (activeSession) => {
      setSession(activeSession);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [targetType, targetId]);

  // Sync queue
  useEffect(() => {
    if (!session?.id) {
      setQueue([]);
      return;
    }
    const unsubscribe = listenToQueue(session.id, (updatedQueue) => {
      setQueue(updatedQueue);
    });
    return () => unsubscribe();
  }, [session?.id]);

  const startSession = useCallback(async () => {
    try {
      const newSession = await apiStartSession(targetType, targetId);
      setSession(newSession);
      return newSession;
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo iniciar la sesión de Karaoke.');
      return null;
    }
  }, [targetType, targetId]);

  const endSession = useCallback(async () => {
    if (!session?.id) return;
    try {
      await apiEndSession(session.id);
      setSession(null);
      setQueue([]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo terminar la sesión de Karaoke.');
    }
  }, [session?.id]);

  const requestToSing = useCallback(async (songId: string) => {
    try {
      const item = await apiRequestSong(targetType, targetId, songId);
      Alert.alert('Solicitud Enviada', 'Tu turno ha sido solicitado y está en revisión.');
      return item;
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo solicitar cantar esta canción.');
      return null;
    }
  }, [targetType, targetId]);

  const approveSinger = useCallback(async (queueItemId: string) => {
    try {
      await approveQueueItem(queueItemId);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo aprobar el turno.');
    }
  }, []);

  const rejectSinger = useCallback(async (queueItemId: string, reason?: string) => {
    try {
      await rejectQueueItem(queueItemId, reason);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo rechazar el turno.');
    }
  }, []);

  const startSingerPresentation = useCallback(async (queueItemId: string) => {
    try {
      await startQueueItem(queueItemId);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo iniciar la presentación.');
    }
  }, []);

  const completeSingerPresentation = useCallback(async (queueItemId: string) => {
    try {
      await completeQueueItem(queueItemId);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo completar la presentación.');
    }
  }, []);

  const skipSinger = useCallback(async (queueItemId: string) => {
    try {
      await skipQueueItem(queueItemId);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo saltar al cantante.');
    }
  }, []);

  const isHost = session?.hostId === user?.uid;
  const currentSingingItem = queue.find(item => item.status === 'singing');

  return {
    session,
    queue,
    loading,
    isHost,
    currentSingingItem,
    startSession,
    endSession,
    requestToSing,
    approveSinger,
    rejectSinger,
    startSingerPresentation,
    completeSingerPresentation,
    skipSinger,
  };
}
