import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import {
  PrivateConversation,
  PrivateMessage,
  MessageRequest,
  PrivateConversationStatus,
  PrivateMessageType,
  PrivateMessageStatus,
  MessageRequestStatus,
} from '../types/privateChat';
import {
  buildConversationId,
  validatePrivateMessage,
  sanitizePrivateMessage,
} from '../utils/privateChat';
import {
  checkMessageRateLimit,
  checkNewRequestRateLimit,
  detectRepeatedMessages,
  detectSpamLinks,
  blockIfSpam,
  canSendPrivateMessage as checkUserRisk,
} from './privateChatAntiSpamService';
import { createNotificationAndPush } from './notificationService';

/**
 * Gets or creates a 1-to-1 conversation.
 */
export async function getOrCreateConversation(
  currentUserId: string,
  targetUserId: string,
  initialMessageText?: string
): Promise<PrivateConversation> {
  const conversationId = buildConversationId(currentUserId, targetUserId);
  const conversationRef = db.collection('privateConversations').doc(conversationId);
  const doc = await conversationRef.get();

  if (doc.exists) {
    return doc.data() as PrivateConversation;
  }

  // Fetch users to verify they exist
  const userASnap = await db.collection('users').doc(currentUserId).get();
  const userBSnap = await db.collection('users').doc(targetUserId).get();
  if (!userASnap.exists || !userBSnap.exists) {
    throw new Error('Uno o ambos usuarios no existen.');
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const newConversation: PrivateConversation = {
    id: conversationId,
    participantIds: [currentUserId, targetUserId],
    participantAId: [currentUserId, targetUserId].sort()[0],
    participantBId: [currentUserId, targetUserId].sort()[1],
    status: 'pending', // Starts pending until accepted
    unreadCounts: {
      [currentUserId]: 0,
      [targetUserId]: 0,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await conversationRef.set(newConversation);
  return {
    ...newConversation,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Sends a private message.
 */
export async function sendPrivateMessage(
  currentUserId: string,
  targetUserId: string,
  data: { type: PrivateMessageType; text?: string; emoji?: string }
): Promise<PrivateMessage> {
  if (currentUserId === targetUserId) {
    throw new Error('No puedes enviarte mensajes a ti mismo.');
  }

  // 1. Check user risk and status
  const userASnap = await db.collection('users').doc(currentUserId).get();
  const userBSnap = await db.collection('users').doc(targetUserId).get();

  if (!userASnap.exists || !userBSnap.exists) {
    throw new Error('Uno o ambos usuarios no existen.');
  }

  const userA = userASnap.data()!;
  const userB = userBSnap.data()!;

  if (userA.status === 'banned' || userA.status === 'suspended') {
    throw new Error('Tu cuenta está suspendida o baneada.');
  }

  if (userB.status === 'banned' || userB.status === 'suspended') {
    throw new Error('El usuario destinatario no está disponible.');
  }

  // 2. Anti-spam checks
  const riskCheck = await checkUserRisk(currentUserId, targetUserId);
  if (!riskCheck.allowed) {
    throw new Error(riskCheck.reason);
  }

  const rateLimitCheck = checkMessageRateLimit(currentUserId);
  if (!rateLimitCheck.allowed) {
    await blockIfSpam(currentUserId);
    throw new Error(rateLimitCheck.reason);
  }

  if (data.type === 'text' && data.text) {
    const repeatedCheck = detectRepeatedMessages(currentUserId, data.text);
    if (!repeatedCheck.allowed) {
      throw new Error(repeatedCheck.reason);
    }

    const spamLinkCheck = detectSpamLinks(data.text);
    if (!spamLinkCheck.allowed) {
      throw new Error(spamLinkCheck.reason);
    }

    const validation = validatePrivateMessage(data.text);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
  }

  // 3. Blocks Check
  const blockA = await db.collection('blocks').doc(`${currentUserId}_${targetUserId}`).get();
  const blockB = await db.collection('blocks').doc(`${targetUserId}_${currentUserId}`).get();
  if (blockA.exists || blockB.exists) {
    throw new Error('No puedes enviar mensajes a este usuario debido a un bloqueo.');
  }

  // 4. Privacy settings & relationship check
  const allowMessagesFrom = userB.allowMessagesFrom || 'everyone';
  if (allowMessagesFrom === 'none') {
    throw new Error('Este usuario no acepta mensajes privados.');
  }

  // Check friendship status
  const friendId = [currentUserId, targetUserId].sort().join('_');
  const friendDoc = await db.collection('friends').doc(friendId).get();
  const isFriend = friendDoc.exists && friendDoc.data()?.status === 'active';

  // Check follow status (A follows B)
  const followDoc = await db.collection('follows').doc(`${currentUserId}_${targetUserId}`).get();
  const isFollowing = followDoc.exists && followDoc.data()?.status === 'active';

  if (allowMessagesFrom === 'friends' && !isFriend) {
    throw new Error('Solo amigos mutuos pueden enviar mensajes a este usuario.');
  }

  if (allowMessagesFrom === 'followers' && !isFollowing) {
    throw new Error('Debes seguir a este usuario para enviarle mensajes.');
  }

  // 5. Conversation setup
  const conversationId = buildConversationId(currentUserId, targetUserId);
  const conversationRef = db.collection('privateConversations').doc(conversationId);
  const conversationSnap = await conversationRef.get();

  let conversation: PrivateConversation;
  let isNew = false;

  if (conversationSnap.exists) {
    conversation = conversationSnap.data() as PrivateConversation;
    if (conversation.status === 'blocked') {
      throw new Error('Esta conversación está bloqueada.');
    }
  } else {
    isNew = true;
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    conversation = {
      id: conversationId,
      participantIds: [currentUserId, targetUserId],
      participantAId: [currentUserId, targetUserId].sort()[0],
      participantBId: [currentUserId, targetUserId].sort()[1],
      status: 'pending',
      unreadCounts: {
        [currentUserId]: 0,
        [targetUserId]: 0,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  const isMutual = isFriend;
  let statusToSet: PrivateConversationStatus = conversation.status;
  let requestStatusToSet: MessageRequestStatus | undefined = conversation.requestStatus;

  if (isNew || conversation.status === 'rejected' || conversation.status === 'pending') {
    if (isMutual || allowMessagesFrom === 'everyone' && isFollowing) {
      statusToSet = 'active';
      requestStatusToSet = 'accepted';
    } else {
      // Check request limit for new chats
      const reqLimitCheck = checkNewRequestRateLimit(currentUserId);
      if (!reqLimitCheck.allowed) {
        throw new Error(reqLimitCheck.reason);
      }
      statusToSet = 'pending';
      requestStatusToSet = 'pending';
    }
  }

  const messageText = data.type === 'text' ? sanitizePrivateMessage(data.text || '') : '';
  const messageEmoji = data.type === 'emoji' ? data.emoji || '' : '';

  const messageRef = conversationRef.collection('messages').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newMessage: PrivateMessage = {
    id: messageRef.id,
    conversationId,
    senderId: currentUserId,
    receiverId: targetUserId,
    type: data.type,
    status: 'sent',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (messageText) {
    newMessage.text = messageText;
  }
  if (messageEmoji) {
    newMessage.emoji = messageEmoji;
  }

  const batch = db.batch();

  // Save message
  batch.set(messageRef, newMessage);

  // Update conversation
  const unreadCountsUpdate = { ...conversation.unreadCounts };
  if (statusToSet === 'active') {
    unreadCountsUpdate[targetUserId] = (unreadCountsUpdate[targetUserId] || 0) + 1;
  }

  const convoUpdate: any = {
    status: statusToSet,
    lastMessageText: messageText || messageEmoji || '[Emoji]',
    lastMessageType: data.type,
    lastMessageSenderId: currentUserId,
    lastMessageAt: timestamp,
    unreadCounts: unreadCountsUpdate,
    updatedAt: timestamp,
  };

  if (requestStatusToSet !== undefined) {
    convoUpdate.requestStatus = requestStatusToSet;
  }

  if (isNew) {
    convoUpdate.id = conversation.id;
    convoUpdate.participantIds = conversation.participantIds;
    convoUpdate.participantAId = conversation.participantAId;
    convoUpdate.participantBId = conversation.participantBId;
    convoUpdate.createdAt = conversation.createdAt;
  }

  if (requestStatusToSet === 'pending' && (!conversation.requestedBy || conversation.status !== 'pending')) {
    convoUpdate.requestedBy = currentUserId;
    
    // Create MessageRequest
    const requestRef = db.collection('messageRequests').doc(conversationId);
    const newRequest: MessageRequest = {
      id: conversationId,
      conversationId,
      fromUserId: currentUserId,
      toUserId: targetUserId,
      status: 'pending',
      messagePreview: messageText || messageEmoji || '[Emoji]',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    batch.set(requestRef, newRequest);
  }

  batch.set(conversationRef, convoUpdate, { merge: true });

  // Update global unread private messages count on target user
  if (statusToSet === 'active') {
    const targetUserRef = db.collection('users').doc(targetUserId);
    batch.update(targetUserRef, {
      unreadPrivateMessagesCount: admin.firestore.FieldValue.increment(1),
    });
  }

  await batch.commit();

  // Send push notification if conversation is active and receiver has not muted it
  if (statusToSet === 'active' && (!conversation.mutedBy || !conversation.mutedBy.includes(targetUserId))) {
    const senderName = userA.displayName || userA.username || 'Usuario';
    const bodyText = data.type === 'text' ? messageText : 'Te envió un emoji 🌟';

    // Check if receiver suspended
    if (userB.status !== 'banned' && userB.status !== 'suspended') {
      await createNotificationAndPush({
        userId: targetUserId,
        type: 'private_message',
        channel: 'push', // Private chats go directly to push notifications
        title: senderName,
        body: bodyText,
        actionType: 'open_private_chat',
        actionValue: conversationId,
        data: {
          conversationId,
          senderId: currentUserId,
        },
      });
    }
  }

  return {
    ...newMessage,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Gets a user's conversations.
 */
export async function getUserConversations(userId: string, limitCount = 50): Promise<PrivateConversation[]> {
  const snapshot = await db
    .collection('privateConversations')
    .where('participantIds', 'array-contains', userId)
    .orderBy('lastMessageAt', 'desc')
    .limit(limitCount)
    .get();

  return snapshot.docs.map(doc => doc.data() as PrivateConversation);
}

/**
 * Gets a specific conversation.
 */
export async function getConversation(userId: string, conversationId: string): Promise<PrivateConversation> {
  const doc = await db.collection('privateConversations').doc(conversationId).get();
  if (!doc.exists) {
    throw new Error('La conversación no existe.');
  }

  const data = doc.data() as PrivateConversation;
  if (!data.participantIds.includes(userId)) {
    throw new Error('No tienes acceso a esta conversación.');
  }

  return data;
}

/**
 * Marks messages in a conversation as read.
 */
export async function markConversationRead(userId: string, conversationId: string): Promise<void> {
  const conversationRef = db.collection('privateConversations').doc(conversationId);
  const doc = await conversationRef.get();
  if (!doc.exists) return;

  const data = doc.data() as PrivateConversation;
  if (!data.participantIds.includes(userId)) return;

  const currentUnread = data.unreadCounts[userId] || 0;
  if (currentUnread === 0) return;

  const batch = db.batch();

  // Reset unread count for user in this conversation
  const unreadUpdate = { ...data.unreadCounts, [userId]: 0 };
  batch.update(conversationRef, {
    unreadCounts: unreadUpdate,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Decrement global count on the user document
  const userRef = db.collection('users').doc(userId);
  batch.update(userRef, {
    unreadPrivateMessagesCount: admin.firestore.FieldValue.increment(-currentUnread),
  });

  // Mark messages sent by the other user as read
  const messagesSnapshot = await conversationRef
    .collection('messages')
    .where('receiverId', '==', userId)
    .where('status', '==', 'sent')
    .get();

  messagesSnapshot.forEach(msgDoc => {
    batch.update(msgDoc.ref, {
      status: 'read',
      readAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}

/**
 * Accepts a message request.
 */
export async function acceptMessageRequest(userId: string, conversationId: string): Promise<void> {
  const conversationRef = db.collection('privateConversations').doc(conversationId);
  const requestRef = db.collection('messageRequests').doc(conversationId);

  const convoDoc = await conversationRef.get();
  if (!convoDoc.exists) {
    throw new Error('Conversación no encontrada.');
  }

  const convo = convoDoc.data() as PrivateConversation;
  if (convo.participantIds.indexOf(userId) === -1 || convo.requestedBy === userId) {
    throw new Error('Operación no autorizada.');
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  batch.update(conversationRef, {
    status: 'active',
    requestStatus: 'accepted',
    acceptedAt: timestamp,
    updatedAt: timestamp,
  });

  batch.update(requestRef, {
    status: 'accepted',
    updatedAt: timestamp,
    respondedAt: timestamp,
  });

  await batch.commit();
}

/**
 * Rejects a message request.
 */
export async function rejectMessageRequest(userId: string, conversationId: string): Promise<void> {
  const conversationRef = db.collection('privateConversations').doc(conversationId);
  const requestRef = db.collection('messageRequests').doc(conversationId);

  const convoDoc = await conversationRef.get();
  if (!convoDoc.exists) {
    throw new Error('Conversación no encontrada.');
  }

  const convo = convoDoc.data() as PrivateConversation;
  if (convo.participantIds.indexOf(userId) === -1 || convo.requestedBy === userId) {
    throw new Error('Operación no autorizada.');
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  batch.update(conversationRef, {
    status: 'rejected',
    requestStatus: 'rejected',
    rejectedAt: timestamp,
    updatedAt: timestamp,
  });

  batch.update(requestRef, {
    status: 'rejected',
    updatedAt: timestamp,
    respondedAt: timestamp,
  });

  await batch.commit();
}

/**
 * Archives a conversation.
 */
export async function archiveConversation(userId: string, conversationId: string): Promise<void> {
  const ref = db.collection('privateConversations').doc(conversationId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Conversación no encontrada.');

  const data = doc.data() as PrivateConversation;
  if (!data.participantIds.includes(userId)) throw new Error('Operación no autorizada.');

  const archivedBy = data.archivedBy || [];
  if (!archivedBy.includes(userId)) {
    archivedBy.push(userId);
  }

  await ref.update({
    archivedBy,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Mutes a conversation.
 */
export async function muteConversation(userId: string, conversationId: string): Promise<void> {
  const ref = db.collection('privateConversations').doc(conversationId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Conversación no encontrada.');

  const data = doc.data() as PrivateConversation;
  if (!data.participantIds.includes(userId)) throw new Error('Operación no autorizada.');

  const mutedBy = data.mutedBy || [];
  if (!mutedBy.includes(userId)) {
    mutedBy.push(userId);
  }

  await ref.update({
    mutedBy,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Unmutes a conversation.
 */
export async function unmuteConversation(userId: string, conversationId: string): Promise<void> {
  const ref = db.collection('privateConversations').doc(conversationId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Conversación no encontrada.');

  const data = doc.data() as PrivateConversation;
  if (!data.participantIds.includes(userId)) throw new Error('Operación no autorizada.');

  const mutedBy = (data.mutedBy || []).filter(id => id !== userId);

  await ref.update({
    mutedBy,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Soft deletes a message for a specific user.
 */
export async function deleteMessageForMe(userId: string, conversationId: string, messageId: string): Promise<void> {
  const ref = db.collection('privateConversations').doc(conversationId).collection('messages').doc(messageId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Mensaje no encontrado.');

  const msg = doc.data() as PrivateMessage;
  const deletedFor = msg.deletedFor || [];
  if (!deletedFor.includes(userId)) {
    deletedFor.push(userId);
  }

  await ref.update({
    deletedFor,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Reports a private message.
 */
export async function reportPrivateMessage(
  userId: string,
  conversationId: string,
  messageId: string,
  reason: string,
  description?: string
): Promise<void> {
  const messageRef = db.collection('privateConversations').doc(conversationId).collection('messages').doc(messageId);
  const doc = await messageRef.get();
  if (!doc.exists) throw new Error('Mensaje no encontrado.');

  const msg = doc.data() as PrivateMessage;

  // Increment reportCount
  await messageRef.update({
    reportCount: admin.firestore.FieldValue.increment(1),
  });

  // Create standard moderation report
  await db.collection('reports').add({
    reporterId: userId,
    targetType: 'private_message',
    targetId: messageId,
    conversationId,
    reason,
    description: description || '',
    status: 'pending',
    reportedUserId: msg.senderId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Blocks a user directly from a conversation.
 */
export async function blockFromConversation(userId: string, conversationId: string): Promise<void> {
  const convoRef = db.collection('privateConversations').doc(conversationId);
  const convoDoc = await convoRef.get();
  if (!convoDoc.exists) throw new Error('Conversación no encontrada.');

  const convo = convoDoc.data() as PrivateConversation;
  if (!convo.participantIds.includes(userId)) throw new Error('Operación no autorizada.');

  const targetId = convo.participantAId === userId ? convo.participantBId : convo.participantAId;

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  // Create block record
  const blockRef = db.collection('blocks').doc(`${userId}_${targetId}`);
  batch.set(blockRef, {
    id: `${userId}_${targetId}`,
    blockerId: userId,
    blockedUserId: targetId,
    createdAt: timestamp,
  });

  // Update conversation status
  batch.update(convoRef, {
    status: 'blocked',
    blockedBy: userId,
    updatedAt: timestamp,
  });

  await batch.commit();
}
