import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { PrivateConversation, PrivateMessage } from '../types/privateChat';
import { UserProfile } from '../types/user';
import {
  listenToConversation,
  listenToConversationMessages,
} from '../services/firebase/firestore/privateChatService';
import { getUserProfile } from '../services/firebase/firestore/usersService';
import privateChatApi from '../services/api/privateChatApi';
import { buildConversationId } from '../utils/privateChat';

interface UsePrivateChatParams {
  conversationId?: string;
  targetUserId?: string;
}

export function usePrivateChat({ conversationId: initialConvoId, targetUserId }: UsePrivateChatParams) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<PrivateConversation | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');

  const currentUserId = user?.uid;
  
  // Determine stable conversationId
  const conversationId = initialConvoId || (currentUserId && targetUserId ? buildConversationId(currentUserId, targetUserId) : undefined);
  
  // Determine other user's ID
  const resolvedTargetUserId = useRef<string | undefined>(targetUserId);

  // Load target user details if targetUserId is known
  useEffect(() => {
    const loadOtherUser = async (uid: string) => {
      try {
        const profile = await getUserProfile(uid);
        if (profile) setOtherUser(profile);
      } catch (err) {
        console.error('Failed to load other user profile:', err);
      }
    };

    if (targetUserId) {
      resolvedTargetUserId.current = targetUserId;
      loadOtherUser(targetUserId);
    } else if (conversation) {
      const otherId = conversation.participantAId === currentUserId
        ? conversation.participantBId
        : conversation.participantAId;
      resolvedTargetUserId.current = otherId;
      loadOtherUser(otherId);
    }
  }, [targetUserId, conversation, currentUserId]);

  // Sync conversation and messages in real time
  useEffect(() => {
    if (!currentUserId || !conversationId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubConvo = listenToConversation(conversationId, convo => {
      setConversation(convo);
      
      // If conversation didn't have otherUser loaded and now we have it
      if (convo && !resolvedTargetUserId.current) {
        const otherId = convo.participantAId === currentUserId ? convo.participantBId : convo.participantAId;
        resolvedTargetUserId.current = otherId;
        getUserProfile(otherId).then(profile => {
          if (profile) setOtherUser(profile);
        });
      }
      setLoading(false);
    });

    const unsubMessages = listenToConversationMessages(conversationId, currentUserId, msgList => {
      // Sort messages chronologically (onSnapshot might return them in desc, we want to match our UI layout direction)
      setMessages(msgList);
    });

    return () => {
      unsubConvo();
      unsubMessages();
    };
  }, [conversationId, currentUserId]);

  const markRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    try {
      await privateChatApi.markConversationRead(conversationId);
    } catch (err) {
      console.error('Failed to mark conversation read:', err);
    }
  }, [conversationId, currentUserId]);

  // Mark read when entering or when new messages arrive
  useEffect(() => {
    if (conversation && currentUserId) {
      const unread = conversation.unreadCounts?.[currentUserId] || 0;
      if (unread > 0) {
        markRead();
      }
    }
  }, [conversation, currentUserId, markRead]);

  const sendText = useCallback(async () => {
    const toId = resolvedTargetUserId.current;
    if (!currentUserId || !toId || !text.trim()) return;

    setSending(true);
    setError(null);
    try {
      const content = text;
      setText(''); // Optimistic clear
      await privateChatApi.sendMessage(toId, { type: 'text', text: content });
    } catch (err: any) {
      setError(err.message || 'Error al enviar mensaje.');
      setText(text); // Restore text on failure
    } finally {
      setSending(false);
    }
  }, [currentUserId, text]);

  const sendEmoji = useCallback(async (emoji: string) => {
    const toId = resolvedTargetUserId.current;
    if (!currentUserId || !toId || !emoji) return;

    setSending(true);
    setError(null);
    try {
      await privateChatApi.sendMessage(toId, { type: 'emoji', emoji });
    } catch (err: any) {
      setError(err.message || 'Error al enviar emoji.');
    } finally {
      setSending(false);
    }
  }, [currentUserId]);

  const reportMessage = useCallback(async (messageId: string, reason: string, description?: string) => {
    if (!conversationId) return;
    try {
      setError(null);
      await privateChatApi.reportMessage(messageId, {
        conversationId,
        reason,
        description,
      });
    } catch (err: any) {
      setError(err.message || 'Error al reportar el mensaje.');
      throw err;
    }
  }, [conversationId]);

  const blockUser = useCallback(async () => {
    if (!conversationId) return;
    try {
      setError(null);
      await privateChatApi.blockConversation(conversationId);
    } catch (err: any) {
      setError(err.message || 'Error al bloquear usuario.');
      throw err;
    }
  }, [conversationId]);

  return {
    conversation,
    messages,
    otherUser,
    loading,
    sending,
    error,
    text,
    setText,
    sendText,
    sendEmoji,
    markRead,
    reportMessage,
    blockUser,
  };
}
