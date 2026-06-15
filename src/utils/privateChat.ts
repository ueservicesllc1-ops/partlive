import { PrivateConversation, PrivateMessage } from '../types/privateChat';
import { UserProfile } from '../types/user';
import { BLOCKED_WORDS } from '../constants/blockedWords';

/**
 * Builds a stable sorted conversation ID from two user IDs.
 */
export function buildConversationId(userAId: string, userBId: string): string {
  const sorted = [userAId, userBId].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

/**
 * Extracts the participant ID of the other user.
 */
export function getOtherParticipantId(conversation: PrivateConversation, currentUserId: string): string {
  return conversation.participantAId === currentUserId
    ? conversation.participantBId
    : conversation.participantAId;
}

/**
 * Sanitizes the message input text.
 */
export function sanitizePrivateMessage(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/(\r\n|\n|\r){3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .substring(0, 500);
}

/**
 * Validates the private message.
 */
export function validatePrivateMessage(text: string): { valid: boolean; reason?: string } {
  const sanitized = sanitizePrivateMessage(text);

  if (sanitized.length === 0) {
    return { valid: false, reason: 'El mensaje no puede estar vacío.' };
  }

  if (sanitized.length > 500) {
    return { valid: false, reason: 'El mensaje no puede superar los 500 caracteres.' };
  }

  const normalizedText = sanitized.toLowerCase();
  const hasBlockedWords = BLOCKED_WORDS && BLOCKED_WORDS.some(word => normalizedText.includes(word));
  if (hasBlockedWords) {
    return { valid: false, reason: 'El mensaje contiene lenguaje no permitido.' };
  }

  return { valid: true };
}

/**
 * Checks if the current user can send a private message to the target user based on block status, bans, and privacy settings.
 */
export function canSendPrivateMessage(
  currentUser: Partial<UserProfile> | null,
  targetUser: Partial<UserProfile> | null,
  relationship: { isFollowing: boolean; isFollower: boolean; isFriend: boolean },
  blocks: { isBlockedByMe: boolean; isBlockedByThem: boolean }
): { canSend: boolean; reason?: string; isPendingRequestRequired?: boolean } {
  if (!currentUser || !targetUser) {
    return { canSend: false, reason: 'Usuarios inválidos.' };
  }

  if (currentUser.uid === targetUser.uid) {
    return { canSend: false, reason: 'No puedes enviarte mensajes a ti mismo.' };
  }

  if (currentUser.status === 'banned' || currentUser.status === 'suspended') {
    return { canSend: false, reason: 'Tu cuenta está suspendida o baneada.' };
  }

  if (targetUser.status === 'banned' || targetUser.status === 'suspended') {
    return { canSend: false, reason: 'Este usuario no está disponible.' };
  }

  if (blocks.isBlockedByMe || blocks.isBlockedByThem) {
    return { canSend: false, reason: 'No puedes enviar mensajes a este usuario.' };
  }

  const allowMessagesFrom = targetUser.allowMessagesFrom || 'everyone';

  if (allowMessagesFrom === 'none') {
    return { canSend: false, reason: 'Este usuario no acepta mensajes privados.' };
  }

  // Friends Check
  if (allowMessagesFrom === 'friends') {
    if (!relationship.isFriend) {
      return { canSend: false, reason: 'Solo amigos mutuos pueden enviar mensajes a este usuario.' };
    }
    return { canSend: true, isPendingRequestRequired: false };
  }

  // Followers Check
  if (allowMessagesFrom === 'followers') {
    // If target settings require followers, check if currentUser is a follower of targetUser
    if (!relationship.isFollowing) {
      return { canSend: false, reason: 'Debes seguir a este usuario para enviarle mensajes.' };
    }
    // Check if they are friends/mutual to skip request
    if (relationship.isFriend) {
      return { canSend: true, isPendingRequestRequired: false };
    }
    return { canSend: true, isPendingRequestRequired: true };
  }

  // Everyone check
  if (allowMessagesFrom === 'everyone') {
    // If not friends/followers mutuo, we need a pending request to prevent spam
    if (!relationship.isFriend) {
      return { canSend: true, isPendingRequestRequired: true };
    }
    return { canSend: true, isPendingRequestRequired: false };
  }

  return { canSend: true, isPendingRequestRequired: true };
}

/**
 * Formats the display text of the last message in a conversation.
 */
export function formatLastMessage(message?: Partial<PrivateMessage>): string {
  if (!message) return '';
  if (message.status === 'deleted') return 'Mensaje eliminado';
  if (message.hiddenByAdmin) return 'Mensaje ocultado por moderación';

  if (message.type === 'emoji') {
    return message.emoji || '[Emoji]';
  }
  if (message.type === 'system') {
    return message.text || '[Mensaje del sistema]';
  }

  return message.text || '';
}
