import { BLOCKED_WORDS } from '../constants/blockedWords';

export const sanitizeChatText = (text: string): string => {
  if (!text) return '';
  
  return text
    .trim()
    // Limit excessive consecutive line breaks to max 2
    .replace(/(\r\n|\n|\r){3,}/g, '\n\n')
    // Limit consecutive spaces to max 1
    .replace(/ {2,}/g, ' ')
    // Limit total characters to 300
    .substring(0, 300);
};

export const containsBlockedWords = (text: string): boolean => {
  const normalizedText = text.toLowerCase();
  return BLOCKED_WORDS.some(word => normalizedText.includes(word));
};

export const validateChatText = (text: string): { valid: boolean; reason?: string } => {
  const sanitized = sanitizeChatText(text);

  if (sanitized.length === 0) {
    return { valid: false, reason: 'El mensaje no puede estar vacío.' };
  }

  if (sanitized.length > 300) {
    return { valid: false, reason: 'El mensaje no puede exceder los 300 caracteres.' };
  }

  // Check if text is composed of excessive repeating single emoji
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)+$/u;
  if (emojiRegex.test(sanitized) && sanitized.length > 30) {
    return { valid: false, reason: 'Demasiadas reacciones consecutivas.' };
  }

  // Basic check for URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(sanitized)) {
    return { valid: false, reason: 'No se permite compartir enlaces en esta sala.' };
  }

  if (containsBlockedWords(sanitized)) {
    return { valid: false, reason: 'El mensaje contiene palabras inapropiadas o no permitidas.' };
  }

  return { valid: true };
};
