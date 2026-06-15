import { db } from '../config/firebase';

interface RateLimitTracker {
  timestamp: number;
  count: number;
}

interface NewRequestTracker {
  timestamp: number;
  count: number;
}

interface LastMessageTracker {
  text: string;
  timestamp: number;
}

// In-memory cache structures
const rateLimitCache: Record<string, RateLimitTracker> = {};
const newRequestCache: Record<string, NewRequestTracker> = {};
const lastMessageCache: Record<string, LastMessageTracker> = {};

/**
 * Checks the message rate limit (max 20 messages per minute).
 */
export function checkMessageRateLimit(senderId: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const tracker = rateLimitCache[senderId];

  if (tracker) {
    if (now - tracker.timestamp < 60000) {
      if (tracker.count >= 20) {
        return { allowed: false, reason: 'Límite de mensajes excedido (máximo 20 mensajes por minuto).' };
      }
      tracker.count++;
    } else {
      rateLimitCache[senderId] = { timestamp: now, count: 1 };
    }
  } else {
    rateLimitCache[senderId] = { timestamp: now, count: 1 };
  }

  return { allowed: true };
}

/**
 * Checks the rate limit for creating conversation requests to new users (max 5 per hour).
 */
export function checkNewRequestRateLimit(senderId: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const tracker = newRequestCache[senderId];

  if (tracker) {
    if (now - tracker.timestamp < 3600000) { // 1 hour
      if (tracker.count >= 5) {
        return { allowed: false, reason: 'Has alcanzado el límite de solicitudes de chat a nuevos usuarios (máximo 5 por hora).' };
      }
      tracker.count++;
    } else {
      newRequestCache[senderId] = { timestamp: now, count: 1 };
    }
  } else {
    newRequestCache[senderId] = { timestamp: now, count: 1 };
  }

  return { allowed: true };
}

/**
 * Detects identical repeated messages.
 */
export function detectRepeatedMessages(senderId: string, text: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const lastMsg = lastMessageCache[senderId];
  const cleanedText = text.trim().toLowerCase();

  if (lastMsg && lastMsg.text === cleanedText && now - lastMsg.timestamp < 30000) { // 30 seconds
    return { allowed: false, reason: 'Por favor, evita enviar el mismo mensaje repetidamente.' };
  }

  lastMessageCache[senderId] = { text: cleanedText, timestamp: now };
  return { allowed: true };
}

/**
 * Detects URLs/links in messages.
 */
export function detectSpamLinks(text: string): { allowed: boolean; reason?: string } {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/gi;
  if (urlRegex.test(text)) {
    return { allowed: false, reason: 'No se permiten enlaces o URLs en los mensajes privados.' };
  }
  return { allowed: true };
}

/**
 * Automatically blocks/flags users if extreme spamming activity is detected.
 */
export async function blockIfSpam(senderId: string): Promise<boolean> {
  const tracker = rateLimitCache[senderId];
  if (tracker && tracker.count > 50) { // Extreme spamming
    try {
      // Set user status to warning or suspended in Firestore
      await db.collection('users').doc(senderId).update({
        status: 'suspended',
        suspendedUntil: new Date(Date.now() + 3600000 * 24), // 24 hours suspension
        bannedReason: 'Sistema anti-spam: Envío masivo de mensajes privados.',
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Failed to auto-suspend spammer:', error);
    }
  }
  return false;
}

/**
 * Validates if the user is allowed to send a message based on risk scores.
 */
export async function canSendPrivateMessage(senderId: string, receiverId: string): Promise<{ allowed: boolean; reason?: string }> {
  // Check user fraud risk
  const fraudDoc = await db.collection('fraudSignals').doc(senderId).get();
  if (fraudDoc.exists) {
    const data = fraudDoc.data()!;
    if (data.riskScore && data.riskScore > 85) {
      return { allowed: false, reason: 'Tu cuenta ha sido restringida temporalmente debido a actividad inusual.' };
    }
  }
  return { allowed: true };
}
