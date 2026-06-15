import firestore from '@react-native-firebase/firestore';
import { LiveMessage } from '../../../types/live';
import { getLiveMessagesPath } from '../../../constants/firestoreCollections';
import { nowServerTimestamp } from '../../../utils/firestoreDates';
import { createReport } from './reportsService';

/**
 * Send a typical text message to live chat.
 */
export const sendLiveMessage = async (
  liveId: string,
  senderProfile: { uid: string; displayName: string; photoURL?: string; username?: string },
  text: string,
  senderRole?: LiveMessage['senderRole']
): Promise<string> => {
  const ref = await firestore().collection(getLiveMessagesPath(liveId)).add({
    liveId,
    senderId: senderProfile.uid,
    senderName: senderProfile.displayName,
    senderUsername: senderProfile.username || '',
    senderPhotoURL: senderProfile.photoURL || '',
    senderRole: senderRole || 'viewer',
    text,
    type: 'text',
    status: 'active',
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

/**
 * Send quick emoji message to live chat.
 */
export const sendLiveEmoji = async (
  liveId: string,
  senderProfile: { uid: string; displayName: string; photoURL?: string; username?: string },
  emoji: string,
  senderRole?: LiveMessage['senderRole']
): Promise<string> => {
  const ref = await firestore().collection(getLiveMessagesPath(liveId)).add({
    liveId,
    senderId: senderProfile.uid,
    senderName: senderProfile.displayName,
    senderUsername: senderProfile.username || '',
    senderPhotoURL: senderProfile.photoURL || '',
    senderRole: senderRole || 'viewer',
    text: emoji,
    type: 'emoji',
    status: 'active',
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

/**
 * Send system notification message inside chat.
 */
export const sendLiveSystemMessage = async (
  liveId: string,
  text: string,
  metadata?: Record<string, any>
): Promise<string> => {
  const ref = await firestore().collection(getLiveMessagesPath(liveId)).add({
    liveId,
    text,
    type: 'system',
    status: 'active',
    metadata: metadata || null,
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

/**
 * Send gift messaging inside chat.
 */
export const sendLiveGiftMessage = async (
  liveId: string,
  giftEvent: {
    senderId: string;
    senderName: string;
    giftName: string;
    quantity: number;
    receiverName: string;
    giftIconUrl?: string;
    totalDiamonds?: number;
    totalBeans?: number;
  }
): Promise<string> => {
  const ref = await firestore().collection(getLiveMessagesPath(liveId)).add({
    liveId,
    senderId: giftEvent.senderId,
    senderName: giftEvent.senderName,
    text: `${giftEvent.senderName} envió ${giftEvent.quantity}x ${giftEvent.giftName} a ${giftEvent.receiverName} ${giftEvent.giftIconUrl || '🎁'}`,
    type: 'gift',
    status: 'active',
    metadata: giftEvent,
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

/**
 * Listen in realtime to active live messages.
 */
export const listenToLiveMessages = (
  liveId: string,
  callback: (messages: LiveMessage[]) => void,
  limitCount: number = 100
) => {
  return firestore()
    .collection(getLiveMessagesPath(liveId))
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .onSnapshot(snap => {
      if (snap) {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveMessage)).reverse();
        callback(msgs);
      }
    });
};

/**
 * Retrieve older messages.
 */
export const getOlderLiveMessages = async (
  liveId: string,
  beforeCreatedAt: any,
  limitCount: number = 50
): Promise<LiveMessage[]> => {
  const snap = await firestore()
    .collection(getLiveMessagesPath(liveId))
    .orderBy('createdAt', 'desc')
    .startAfter(beforeCreatedAt)
    .limit(limitCount)
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveMessage)).reverse();
};

/**
 * Hide a message (moderator feature).
 */
export const hideLiveMessage = async (
  liveId: string,
  messageId: string,
  moderatorId: string,
  reason?: string
): Promise<void> => {
  await firestore()
    .collection(getLiveMessagesPath(liveId))
    .doc(messageId)
    .update({
      status: 'hidden',
      text: 'Este mensaje fue ocultado por un moderador.',
      type: 'moderation',
      metadata: {
        hiddenBy: moderatorId,
        hiddenReason: reason || 'Inapropiado',
      },
      updatedAt: nowServerTimestamp(),
    });
};

/**
 * Delete a user's own message.
 */
export const deleteOwnLiveMessage = async (
  liveId: string,
  messageId: string,
  userId: string
): Promise<void> => {
  const ref = firestore().collection(getLiveMessagesPath(liveId)).doc(messageId);
  const snap = await ref.get();
  if (snap.exists() && snap.data()?.senderId === userId) {
    await ref.update({
      status: 'deleted',
      updatedAt: nowServerTimestamp(),
    });
  } else {
    throw new Error('No tienes permisos para eliminar este mensaje.');
  }
};

import { ReportReason } from '../../../types';

/**
 * Report live chat message.
 */
export const reportLiveMessage = async (
  liveId: string,
  messageId: string,
  reporterId: string,
  reason: string,
  description?: string
): Promise<string> => {
  let mappedReason: ReportReason = 'other';
  const lower = reason.toLowerCase();
  if (lower.includes('spam')) mappedReason = 'spam';
  else if (lower.includes('abuso')) mappedReason = 'harassment';
  else if (lower.includes('acoso')) mappedReason = 'harassment';
  else if (lower.includes('scam')) mappedReason = 'scam';

  return await createReport({
    reporterId,
    targetType: 'message',
    targetId: messageId,
    reason: mappedReason,
    description: `Live ID: ${liveId}. ${description || ''}`,
  });
};
