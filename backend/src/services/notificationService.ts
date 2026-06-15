import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { AppNotification, UserNotificationSettings } from '../types/notification';
import { getActiveDeviceTokens } from './deviceTokenService';

const messaging = admin.messaging();

const NOTIFICATIONS = 'notifications';
const SETTINGS = 'notificationSettings';

const DEFAULT_SETTINGS: Omit<UserNotificationSettings, 'userId' | 'updatedAt'> = {
  pushEnabled: true,
  liveStarted: true,
  gameInvites: true,
  gifts: true,
  missions: true,
  payouts: true,
  vip: true,
  events: true,
  marketing: false,
  moderation: true,
  privateMessages: true,
};

/**
 * Gets or initializes user notification preferences.
 */
export async function getUserNotificationSettings(userId: string): Promise<UserNotificationSettings> {
  const ref = db.collection(SETTINGS).doc(userId);
  const doc = await ref.get();

  if (!doc.exists) {
    const initData: UserNotificationSettings = {
      userId,
      ...DEFAULT_SETTINGS,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(initData);
    return { ...initData, updatedAt: new Date() };
  }

  return doc.data() as UserNotificationSettings;
}

/**
 * Update user notification preferences.
 */
export async function updateUserNotificationSettings(
  userId: string,
  settings: Partial<UserNotificationSettings>
): Promise<UserNotificationSettings> {
  const ref = db.collection(SETTINGS).doc(userId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  const updateData = {
    ...settings,
    updatedAt: now,
  };

  await ref.update(updateData);
  const updatedDoc = await ref.get();
  return updatedDoc.data() as UserNotificationSettings;
}

/**
 * Decides whether a notification type should be delivered based on user settings and suspension status.
 */
export async function shouldSendNotification(userId: string, type: string): Promise<boolean> {
  // Check if suspended
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) return false;
  const user = userDoc.data()!;
  
  if (user.isSuspended && type !== 'moderation') {
    return false; // Suspended users only receive moderation warnings
  }

  const settings = await getUserNotificationSettings(userId);
  if (!settings.pushEnabled) return false;

  switch (type) {
    case 'live_started':
      return settings.liveStarted;
    case 'game_invite':
      return settings.gameInvites;
    case 'gift_received':
      return settings.gifts;
    case 'mission_completed':
    case 'mission_reward':
      return settings.missions;
    case 'payout_update':
      return settings.payouts;
    case 'vip_update':
      return settings.vip;
    case 'event_started':
      return settings.events;
    case 'moderation':
      return settings.moderation;
    case 'private_message':
      return settings.privateMessages !== false;
    default:
      return true;
  }
}

/**
 * Creates a notification in Firestore.
 */
export async function createInAppNotification(data: Omit<AppNotification, 'id' | 'createdAt' | 'status'>): Promise<AppNotification> {
  const notifRef = db.collection(NOTIFICATIONS).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const newNotif: AppNotification = {
    ...data,
    id: notifRef.id,
    status: 'unread',
    createdAt: now,
  };

  await notifRef.set(newNotif);
  return { ...newNotif, createdAt: new Date() };
}

/**
 * Sends a push notification payload via FCM to active tokens of a user.
 */
export async function sendPushToUser(userId: string, payload: { title: string; body: string; imageUrl?: string; data?: any }): Promise<void> {
  const tokens = await getActiveDeviceTokens(userId);
  if (tokens.length === 0) return;

  const fcmTokens = tokens.map((t) => t.token);

  const message: admin.messaging.MulticastMessage = {
    tokens: fcmTokens,
    notification: {
      title: payload.title,
      body: payload.body,
      imageUrl: payload.imageUrl,
    },
    data: payload.data ? Object.keys(payload.data).reduce((acc: any, key) => {
      acc[key] = String(payload.data[key]);
      return acc;
    }, {}) : {},
    android: {
      notification: {
        sound: 'default',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK', // standard android receiver target
      },
    },
  };

  const response = await messaging.sendEachForMulticast(message);
  
  // Clean up stale or failed tokens
  if (response.failureCount > 0) {
    const batch = db.batch();
    response.responses.forEach((resp: admin.messaging.SendResponse, idx: number) => {
      if (!resp.success) {
        const failedToken = fcmTokens[idx];
        const tokenRef = db.collection('deviceTokens').doc(failedToken);
        batch.update(tokenRef, {
          isActive: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });
    await batch.commit();
  }
}

/**
 * Secure wrapper that creates the database record and triggers push delivery if conditions are met.
 */
export async function createNotificationAndPush(params: {
  userId: string;
  type: string;
  channel: 'in_app' | 'push' | 'both';
  title: string;
  body: string;
  imageUrl?: string;
  actionType?: string;
  actionValue?: string;
  data?: any;
}): Promise<AppNotification | null> {
  const allowed = await shouldSendNotification(params.userId, params.type);
  if (!allowed) {
    console.log(`[NotificationService] Suppressed delivery for user: ${params.userId}, type: ${params.type}`);
    return null;
  }

  let created: AppNotification | null = null;

  if (params.channel === 'in_app' || params.channel === 'both') {
    created = await createInAppNotification({
      userId: params.userId,
      type: params.type as any,
      channel: params.channel,
      title: params.title,
      body: params.body,
      imageUrl: params.imageUrl,
      actionType: (params.actionType || 'none') as any,
      actionValue: params.actionValue,
      data: params.data,
    });
  }

  if (params.channel === 'push' || params.channel === 'both') {
    await sendPushToUser(params.userId, {
      title: params.title,
      body: params.body,
      imageUrl: params.imageUrl,
      data: {
        type: params.type,
        actionType: params.actionType || 'none',
        actionValue: params.actionValue || '',
        notificationId: created ? created.id : '',
        ...params.data,
      },
    });
  }

  return created;
}

/**
 * Sends a broadcast push to all active device tokens.
 */
export async function sendBroadcastPush(payload: { title: string; body: string; imageUrl?: string; data?: any }): Promise<void> {
  const tokensSnapshot = await db.collection('deviceTokens').where('isActive', '==', true).get();
  const tokens: string[] = [];
  tokensSnapshot.forEach((doc) => {
    tokens.push(doc.id);
  });

  if (tokens.length === 0) return;

  // FCM multicast limits to 500 tokens per call, partition array if needed
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const message: admin.messaging.MulticastMessage = {
      tokens: chunk,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data ? Object.keys(payload.data).reduce((acc: any, key) => {
        acc[key] = String(payload.data[key]);
        return acc;
      }, {}) : {},
    };
    await messaging.sendEachForMulticast(message);
  }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const ref = db.collection(NOTIFICATIONS).doc(notificationId);
  const doc = await ref.get();
  if (doc.exists && doc.data()!.userId === userId) {
    await ref.update({
      status: 'read',
      readAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Marks all unread notifications of a user as read.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const snapshot = await db
    .collection(NOTIFICATIONS)
    .where('userId', '==', userId)
    .where('status', '==', 'unread')
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.forEach((doc) => {
    batch.update(doc.ref, {
      status: 'read',
      readAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}
