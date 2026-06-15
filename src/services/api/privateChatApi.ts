import { apiFetch } from './apiClient';
import { PrivateConversation, PrivateMessage } from '../../types/privateChat';

export const getConversations = async (): Promise<PrivateConversation[]> => {
  return apiFetch('/private-chat/conversations', { method: 'GET' });
};

export const getConversation = async (conversationId: string): Promise<PrivateConversation> => {
  return apiFetch(`/private-chat/conversations/${conversationId}`, { method: 'GET' });
};

export const sendMessage = async (
  targetUserId: string,
  data: { type: 'text' | 'emoji'; text?: string; emoji?: string }
): Promise<PrivateMessage> => {
  return apiFetch('/private-chat/messages/send', {
    method: 'POST',
    body: JSON.stringify({ targetUserId, ...data }),
  });
};

export const markConversationRead = async (conversationId: string): Promise<{ ok: boolean }> => {
  return apiFetch(`/private-chat/conversations/${conversationId}/read`, { method: 'POST' });
};

export const acceptMessageRequest = async (conversationId: string): Promise<{ ok: boolean }> => {
  return apiFetch(`/private-chat/conversations/${conversationId}/accept`, { method: 'POST' });
};

export const rejectMessageRequest = async (conversationId: string): Promise<{ ok: boolean }> => {
  return apiFetch(`/private-chat/conversations/${conversationId}/reject`, { method: 'POST' });
};

export const archiveConversation = async (conversationId: string): Promise<{ ok: boolean }> => {
  return apiFetch(`/private-chat/conversations/${conversationId}/archive`, { method: 'POST' });
};

export const muteConversation = async (conversationId: string): Promise<{ ok: boolean }> => {
  return apiFetch(`/private-chat/conversations/${conversationId}/mute`, { method: 'POST' });
};

export const unmuteConversation = async (conversationId: string): Promise<{ ok: boolean }> => {
  return apiFetch(`/private-chat/conversations/${conversationId}/unmute`, { method: 'POST' });
};

export const blockConversation = async (conversationId: string): Promise<{ ok: boolean }> => {
  return apiFetch(`/private-chat/conversations/${conversationId}/block`, { method: 'POST' });
};

export const deleteMessageForMe = async (
  messageId: string,
  conversationId: string
): Promise<{ ok: boolean }> => {
  return apiFetch(`/private-chat/messages/${messageId}/delete-for-me`, {
    method: 'POST',
    body: JSON.stringify({ conversationId }),
  });
};

export const reportMessage = async (
  messageId: string,
  data: { conversationId: string; reason: string; description?: string }
): Promise<{ ok: boolean }> => {
  return apiFetch(`/private-chat/messages/${messageId}/report`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export default {
  getConversations,
  getConversation,
  sendMessage,
  markConversationRead,
  acceptMessageRequest,
  rejectMessageRequest,
  archiveConversation,
  muteConversation,
  unmuteConversation,
  blockConversation,
  deleteMessageForMe,
  reportMessage,
};
