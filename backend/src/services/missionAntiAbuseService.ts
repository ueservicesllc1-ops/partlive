import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface AntiAbuseRule {
  maxIncrementPerMinute: number;
  preventSelfAction: boolean;
  minMessageLength: number;
  blockSuspended: boolean;
}

const DEFAULT_RULE: AntiAbuseRule = {
  maxIncrementPerMinute: 10,
  preventSelfAction: true,
  minMessageLength: 2,
  blockSuspended: true,
};

// Quick in-memory cache for anti-spam/frequency checks to avoid excess Firestore writes.
// Structure: `${userId}_${actionType}` -> { timestamp: number, count: number }
const trackingCache: Record<string, { timestamp: number; count: number }> = {};

/**
 * Validates whether a user can track progress for a specific mission action.
 */
export async function canTrackMissionAction(
  userId: string,
  actionType: string,
  metadata?: any
): Promise<{ allowed: boolean; reason?: string }> {
  // Check if user is suspended
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    return { allowed: false, reason: 'User not found' };
  }
  const userData = userDoc.data()!;
  if (userData.isSuspended) {
    return { allowed: false, reason: 'User is suspended' };
  }

  // Rate limiting per minute
  const now = Date.now();
  const cacheKey = `${userId}_${actionType}`;
  const rateLimit = trackingCache[cacheKey];

  if (rateLimit) {
    if (now - rateLimit.timestamp < 60000) {
      if (rateLimit.count >= DEFAULT_RULE.maxIncrementPerMinute) {
        return { allowed: false, reason: 'Rate limit exceeded. Spam detected.' };
      }
      rateLimit.count++;
    } else {
      trackingCache[cacheKey] = { timestamp: now, count: 1 };
    }
  } else {
    trackingCache[cacheKey] = { timestamp: now, count: 1 };
  }

  // Action-specific validations
  if (actionType === 'send_message') {
    if (metadata?.text && metadata.text.trim().length < DEFAULT_RULE.minMessageLength) {
      return { allowed: false, reason: 'Message too short' };
    }
  }

  if (actionType === 'join_room') {
    // Avoid rapid entering/exiting the same room
    if (metadata?.roomId) {
      const recentJoinsKey = `join_${userId}_${metadata.roomId}`;
      const recentJoin = trackingCache[recentJoinsKey];
      if (recentJoin && now - recentJoin.timestamp < 30000) {
        return { allowed: false, reason: 'Joined too quickly (possible spam)' };
      }
      trackingCache[recentJoinsKey] = { timestamp: now, count: 1 };
    }
  }

  return { allowed: true };
}

/**
 * Checks risk score or other flags before dispensing rewards.
 */
export async function blockSuspiciousMissionReward(userId: string, missionId: string): Promise<boolean> {
  const fraudRef = db.collection('fraudSignals').doc(userId);
  const fraudDoc = await fraudRef.get();
  
  if (fraudDoc.exists) {
    const data = fraudDoc.data()!;
    if (data.riskScore && data.riskScore > 80) {
      // High fraud risk, block reward claim
      return true;
    }
  }
  return false;
}
