export type PrivateConversationStatus =
  | 'active'
  | 'pending'
  | 'rejected'
  | 'blocked'
  | 'archived';

export type PrivateMessageType = 'text' | 'emoji' | 'system';

export type PrivateMessageStatus =
  | 'sent'
  | 'delivered'
  | 'read'
  | 'deleted'
  | 'hidden';

export type MessageRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired';

export interface PrivateConversation {
  id: string; // userAId_userBId
  participantIds: string[];
  participantAId: string;
  participantBId: string;
  status: PrivateConversationStatus;
  requestStatus?: MessageRequestStatus;
  requestedBy?: string;
  acceptedAt?: any;
  rejectedAt?: any;
  lastMessageText?: string;
  lastMessageType?: PrivateMessageType;
  lastMessageSenderId?: string;
  lastMessageAt?: any;
  unreadCounts: {
    [userId: string]: number;
  };
  mutedBy?: string[];
  archivedBy?: string[];
  blockedBy?: string;
  createdAt: any;
  updatedAt: any;
}

export interface PrivateMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: PrivateMessageType;
  text?: string;
  emoji?: string;
  status: PrivateMessageStatus;
  createdAt: any;
  updatedAt: any;
  readAt?: any;
  deletedFor?: string[]; // IDs of users who deleted the message for themselves
  hiddenByAdmin?: boolean;
  reportCount?: number;
  metadata?: Record<string, any>;
}

export interface MessageRequest {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  status: MessageRequestStatus;
  messagePreview?: string;
  createdAt: any;
  updatedAt: any;
  respondedAt?: any;
}
