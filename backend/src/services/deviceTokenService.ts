import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { DeviceToken } from '../types/notification';

const DEVICE_TOKENS = 'deviceTokens';

/**
 * Registers or updates a device token.
 */
export async function registerDeviceToken(
  userId: string,
  data: {
    token: string;
    platform: 'android' | 'ios' | 'web';
    deviceId?: string;
    deviceName?: string;
    appVersion?: string;
  }
): Promise<DeviceToken> {
  const tokenRef = db.collection(DEVICE_TOKENS).doc(data.token);
  const now = admin.firestore.FieldValue.serverTimestamp();

  const tokenData: DeviceToken = {
    id: data.token,
    userId,
    token: data.token,
    platform: data.platform,
    isActive: true,
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now,
  };

  if (data.deviceId) tokenData.deviceId = data.deviceId;
  if (data.deviceName) tokenData.deviceName = data.deviceName;
  if (data.appVersion) tokenData.appVersion = data.appVersion;

  // Run in a transaction to handle token reassignments
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(tokenRef);
    if (!doc.exists) {
      transaction.set(tokenRef, tokenData);
    } else {
      transaction.update(tokenRef, {
        userId,
        platform: data.platform,
        deviceId: data.deviceId || null,
        deviceName: data.deviceName || null,
        appVersion: data.appVersion || null,
        isActive: true,
        lastSeenAt: now,
        updatedAt: now,
      });
    }
  });

  return {
    ...tokenData,
    lastSeenAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Deactivates a specific device token (e.g. at logout).
 */
export async function deactivateDeviceToken(userId: string, token: string): Promise<void> {
  const tokenRef = db.collection(DEVICE_TOKENS).doc(token);
  const doc = await tokenRef.get();
  
  if (doc.exists) {
    const data = doc.data()!;
    if (data.userId === userId) {
      await tokenRef.update({
        isActive: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
}

/**
 * Get active tokens for a user.
 */
export async function getActiveDeviceTokens(userId: string): Promise<DeviceToken[]> {
  const snapshot = await db
    .collection(DEVICE_TOKENS)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .get();

  const tokens: DeviceToken[] = [];
  snapshot.forEach((doc) => {
    tokens.push(doc.data() as DeviceToken);
  });
  return tokens;
}

/**
 * Deactivate all tokens for a user.
 */
export async function deactivateAllUserTokens(userId: string): Promise<void> {
  const snapshot = await db
    .collection(DEVICE_TOKENS)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.forEach((doc) => {
    batch.update(doc.ref, {
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}
