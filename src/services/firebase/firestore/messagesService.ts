import firestore from '@react-native-firebase/firestore';
import { getRoomMessagesPath } from '../../../constants/firestoreCollections';
import { ChatMessage, GiftEvent, ReportReason } from '../../../types';
import { nowServerTimestamp } from '../../../utils/firestoreDates';
import { createReport } from './reportsService';

// 1. Send typical text message
export const sendRoomMessage = async (
  roomId: string,
  senderProfile: { uid: string; displayName: string; photoURL?: string; username?: string },
  text: string,
  senderRole?: ChatMessage['senderRole']
): Promise<string> => {
  const ref = await firestore().collection(getRoomMessagesPath(roomId)).add({
    roomId,
    senderId: senderProfile.uid,
    senderName: senderProfile.displayName,
    senderUsername: senderProfile.username,
    senderPhotoURL: senderProfile.photoURL,
    senderRole: senderRole || 'listener',
    text,
    type: 'text',
    status: 'active',
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

// 2. Send quick reaction emoji
export const sendRoomEmoji = async (
  roomId: string,
  senderProfile: { uid: string; displayName: string; photoURL?: string; username?: string },
  emoji: string,
  senderRole?: ChatMessage['senderRole']
): Promise<string> => {
  const ref = await firestore().collection(getRoomMessagesPath(roomId)).add({
    roomId,
    senderId: senderProfile.uid,
    senderName: senderProfile.displayName,
    senderUsername: senderProfile.username,
    senderPhotoURL: senderProfile.photoURL,
    senderRole: senderRole || 'listener',
    text: emoji,
    type: 'emoji',
    status: 'active',
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

// 3. Send notification/system logs inside chat
export const sendRoomSystemMessage = async (
  roomId: string,
  text: string,
  metadata?: Record<string, any>
): Promise<string> => {
  const ref = await firestore().collection(getRoomMessagesPath(roomId)).add({
    roomId,
    text,
    type: 'system',
    status: 'active',
    metadata: metadata || null,
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

// 4. Send gift mock activity to chat
export const sendRoomGiftMessage = async (
  roomId: string,
  giftEvent: Omit<GiftEvent, 'id' | 'createdAt'>
): Promise<string> => {
  const ref = await firestore().collection(getRoomMessagesPath(roomId)).add({
    roomId,
    senderId: giftEvent.senderId,
    senderName: giftEvent.senderName,
    text: `${giftEvent.senderName} envió ${giftEvent.quantity}x ${giftEvent.giftName} a ${giftEvent.receiverName} ${giftEvent.giftIconUrl || '🎁'}`,
    type: 'gift',
    status: 'active',
    metadata: {
      giftId: giftEvent.giftId,
      giftName: giftEvent.giftName,
      giftIconUrl: giftEvent.giftIconUrl,
      quantity: giftEvent.quantity,
      receiverId: giftEvent.receiverId,
      receiverName: giftEvent.receiverName,
      totalCoins: giftEvent.totalCoins,
      totalDiamonds: giftEvent.totalDiamonds,
    },
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

// 5. Listen in real-time to active chat stream
export const listenToRoomMessages = (
  roomId: string,
  callback: (messages: ChatMessage[]) => void,
  limitCount: number = 100
) => {
  return firestore()
    .collection(getRoomMessagesPath(roomId))
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .onSnapshot(snap => {
      if (snap) {
        // Reverse array to show older messages first
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
        // Return only non-hidden/non-deleted messages to standard callback
        callback(msgs);
      }
    });
};

// 6. Pagination helper to get older messages
export const getOlderRoomMessages = async (
  roomId: string,
  beforeCreatedAt: any,
  limitCount: number = 50
): Promise<ChatMessage[]> => {
  const snap = await firestore()
    .collection(getRoomMessagesPath(roomId))
    .orderBy('createdAt', 'desc')
    .startAfter(beforeCreatedAt)
    .limit(limitCount)
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
};

// 7. Hide/Moderation toggle (Admin method)
export const hideRoomMessage = async (
  roomId: string,
  messageId: string,
  moderatorId: string,
  reason?: string
): Promise<void> => {
  await firestore()
    .collection(getRoomMessagesPath(roomId))
    .doc(messageId)
    .update({
      status: 'hidden',
      hiddenBy: moderatorId,
      hiddenReason: reason || 'Inapropiado',
      updatedAt: nowServerTimestamp(),
    });
};

// 8. User self deletion method
export const deleteOwnRoomMessage = async (
  roomId: string,
  messageId: string,
  userId: string
): Promise<void> => {
  const ref = firestore().collection(getRoomMessagesPath(roomId)).doc(messageId);
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

// 9. Reporting module hook
export const reportRoomMessage = async (
  roomId: string,
  messageId: string,
  reporterId: string,
  reason: string,
  description?: string
): Promise<string> => {
  // Map string to valid Report['reason'] enum
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
    description: `Sala ID: ${roomId}. ${description || ''}`,
  });
};

// 10. Mark message as moderated in service
export const markMessageAsModerated = async (
  roomId: string,
  messageId: string,
  moderatorId: string,
  reason: string
): Promise<void> => {
  await firestore()
    .collection(getRoomMessagesPath(roomId))
    .doc(messageId)
    .update({
      status: 'hidden',
      type: 'moderation',
      text: 'Mensaje moderado por infringir normas.',
      hiddenBy: moderatorId,
      hiddenReason: reason,
      updatedAt: nowServerTimestamp(),
    });
};

// Compatibility export
export const hideMessage = async (path: string, messageId: string, moderatorId: string, reason?: string): Promise<void> => {
  await firestore().collection(path).doc(messageId).update({
    status: 'hidden',
    hiddenBy: moderatorId,
    hiddenReason: reason,
    updatedAt: nowServerTimestamp(),
  });
};
export const getRoomMessages = async (roomId: string, limitCount: number = 50): Promise<ChatMessage[]> => {
  const snap = await firestore()
    .collection(getRoomMessagesPath(roomId))
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
};
