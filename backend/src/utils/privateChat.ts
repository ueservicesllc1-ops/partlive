import { PrivateConversation, PrivateMessage } from '../types/privateChat';

export const BLOCKED_WORDS = [
  'spam',
  'hack',
  'cheat',
  'token',
  'exploit',
  'tonto',
  'idiota',
  'estupido',
  'malo',
  'basura',
];

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
  const hasBlockedWords = BLOCKED_WORDS.some(word => normalizedText.includes(word));
  if (hasBlockedWords) {
    return { valid: false, reason: 'El mensaje contiene lenguaje no permitido.' };
  }

  return { valid: true };
}
