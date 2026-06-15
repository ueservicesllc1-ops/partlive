import firestore from '@react-native-firebase/firestore';
import { PrivateConversation, PrivateMessage, MessageRequest } from '../../../types/privateChat';

/**
 * Listens to active conversations for a user.
 */
export const listenToUserConversations = (
  userId: string,
  callback: (conversations: PrivateConversation[]) => void,
  limitCount = 50
): (() => void) => {
  return firestore()
    .collection('privateConversations')
    .where('participantIds', 'array-contains', userId)
    .orderBy('lastMessageAt', 'desc')
    .limit(limitCount)
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          callback([]);
          return;
        }
        const convs = snapshot.docs.map(doc => doc.data() as PrivateConversation);
        callback(convs);
      },
      error => {
        console.error('listenToUserConversations error:', error);
        callback([]);
      }
    );
};

/**
 * Listens to a single conversation.
 */
export const listenToConversation = (
  conversationId: string,
  callback: (conversation: PrivateConversation | null) => void
): (() => void) => {
  return firestore()
    .collection('privateConversations')
    .doc(conversationId)
    .onSnapshot(
      doc => {
        if (!doc.exists()) {
          callback(null);
          return;
        }
        callback(doc.data() as PrivateConversation);
      },
      error => {
        console.error('listenToConversation error:', error);
        callback(null);
      }
    );
};

/**
 * Listens to messages of a specific conversation, filtering out soft-deleted ones.
 */
export const listenToConversationMessages = (
  conversationId: string,
  userId: string,
  callback: (messages: PrivateMessage[]) => void,
  limitCount = 50
): (() => void) => {
  return firestore()
    .collection('privateConversations')
    .doc(conversationId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          callback([]);
          return;
        }
        const msgs = snapshot.docs
          .map(doc => doc.data() as PrivateMessage)
          .filter(msg => !msg.deletedFor || !msg.deletedFor.includes(userId));
        callback(msgs);
      },
      error => {
        console.error('listenToConversationMessages error:', error);
        callback([]);
      }
    );
};

/**
 * Listens to pending message requests received by a user.
 */
export const listenToPendingMessageRequests = (
  userId: string,
  callback: (requests: MessageRequest[]) => void
): (() => void) => {
  return firestore()
    .collection('messageRequests')
    .where('toUserId', '==', userId)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          callback([]);
          return;
        }
        callback(snapshot.docs.map(doc => doc.data() as MessageRequest));
      },
      error => {
        console.error('listenToPendingMessageRequests error:', error);
        callback([]);
      }
    );
};

/**
 * Listens to the global unread private messages count of the user.
 */
export const listenToUnreadPrivateMessagesCount = (
  userId: string,
  callback: (unreadCount: number) => void
): (() => void) => {
  return firestore()
    .collection('users')
    .doc(userId)
    .onSnapshot(
      doc => {
        if (!doc.exists()) {
          callback(0);
          return;
        }
        callback(doc.data()?.unreadPrivateMessagesCount || 0);
      },
      error => {
        console.error('listenToUnreadPrivateMessagesCount error:', error);
        callback(0);
      }
    );
};
