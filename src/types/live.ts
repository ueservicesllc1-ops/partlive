export type LiveStatus = 'scheduled' | 'live' | 'ended' | 'suspended';

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  hostUsername?: string;
  hostPhotoURL?: string;
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  country?: string;
  language?: string;
  tags?: string[];
  viewersCount: number;
  peakViewersCount: number;
  likesCount: number;
  giftsCount: number;
  diamondsEarned: number;
  status: LiveStatus;
  isPrivate: boolean;
  allowChat: boolean;
  allowGifts: boolean;
  moderatorIds: string[];
  startedAt?: any; // Firestore Timestamp
  endedAt?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  isInPkBattle?: boolean;
  activePkBattleId?: string;
  pkOpponentHostId?: string;
  pkOpponentLiveId?: string;
}

// Keep Live interface alias for compatibility if needed elsewhere
export type Live = LiveStream;

export interface LiveViewer {
  id: string; // usually userId
  liveId: string;
  userId: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  role: 'host' | 'moderator' | 'viewer';
  joinedAt: any; // Firestore Timestamp
  lastActiveAt: any; // Firestore Timestamp
  isMuted?: boolean;
  isBannedFromLive?: boolean;
}

export interface LiveMessage {
  id: string;
  liveId: string;
  senderId: string;
  senderName: string;
  senderUsername?: string;
  senderPhotoURL?: string;
  senderRole?: 'host' | 'moderator' | 'viewer';
  text?: string;
  type: 'text' | 'emoji' | 'system' | 'gift' | 'moderation';
  status: 'active' | 'hidden' | 'deleted';
  metadata?: Record<string, any>;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}
