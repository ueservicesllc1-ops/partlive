import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { PrivateConversation, MessageRequest } from '../types/privateChat';
import {
  listenToUserConversations,
  listenToPendingMessageRequests,
  listenToUnreadPrivateMessagesCount,
} from '../services/firebase/firestore/privateChatService';
import privateChatApi from '../services/api/privateChatApi';

export function usePrivateConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.uid;

  const loadData = useCallback(async () => {
    if (!userId || userId === 'guest_user') return;
    setError(null);
    try {
      const convs = await privateChatApi.getConversations();
      // Filter list: exclude archived ones in memory if needed, but our API handles them.
      // Filter out conversations that are blocked or archived for the current user
      const filtered = convs.filter(c => {
        const isArchived = c.archivedBy && c.archivedBy.includes(userId);
        return c.status !== 'rejected' && !isArchived;
      });
      setConversations(filtered);
    } catch (err: any) {
      setError(err.message || 'Error al cargar conversaciones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Real-time Firestore sync
  useEffect(() => {
    if (!userId || userId === 'guest_user') {
      setConversations([]);
      setRequests([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubConvs = listenToUserConversations(userId, convList => {
      // Filter out conversations archived or rejected by user A/B
      const activeList = convList.filter(c => {
        const isArchived = c.archivedBy && c.archivedBy.includes(userId);
        return c.status !== 'rejected' && !isArchived;
      });
      setConversations(activeList);
      setLoading(false);
    });

    const unsubRequests = listenToPendingMessageRequests(userId, requestList => {
      setRequests(requestList);
    });

    const unsubUnread = listenToUnreadPrivateMessagesCount(userId, count => {
      setUnreadCount(count);
    });

    return () => {
      unsubConvs();
      unsubRequests();
      unsubUnread();
    };
  }, [userId]);

  const acceptRequest = useCallback(async (conversationId: string) => {
    try {
      setError(null);
      await privateChatApi.acceptMessageRequest(conversationId);
    } catch (err: any) {
      setError(err.message || 'Error al aceptar la solicitud.');
      throw err;
    }
  }, []);

  const rejectRequest = useCallback(async (conversationId: string) => {
    try {
      setError(null);
      await privateChatApi.rejectMessageRequest(conversationId);
    } catch (err: any) {
      setError(err.message || 'Error al rechazar la solicitud.');
      throw err;
    }
  }, []);

  const archiveConvo = useCallback(async (conversationId: string) => {
    try {
      setError(null);
      await privateChatApi.archiveConversation(conversationId);
      // Remove from state immediately for fast feedback
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (err: any) {
      setError(err.message || 'Error al archivar la conversación.');
      throw err;
    }
  }, []);

  return {
    conversations,
    requests,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh,
    acceptRequest,
    rejectRequest,
    archiveConversation: archiveConvo,
  };
}
