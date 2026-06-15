export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderUsername?: string;
  senderPhotoURL?: string;
  senderRole?: 'owner' | 'host' | 'moderator' | 'speaker' | 'listener';
  text?: string;
  type: 'text' | 'emoji' | 'system' | 'gift' | 'moderation';
  status: 'active' | 'hidden' | 'deleted';
  metadata?: Record<string, any>;
  replyToMessageId?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  hiddenBy?: string;
  hiddenReason?: string;
}

export interface GiftEvent {
  id: string;
  giftId: string;
  giftName: string;
  giftIconUrl?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  roomId?: string;
  liveId?: string;
  quantity: number;
  totalCoins?: number;
  totalDiamonds: number;
  totalBeans?: number;
  createdAt: any; // Firestore Timestamp
}

