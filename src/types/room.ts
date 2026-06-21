export interface Room {
  id: string;
  hostId: string; // Equivalent to ownerId/primary host
  ownerId: string; // Maintain backward compatibility
  ownerName?: string;
  ownerPhotoURL?: string;
  title: string;
  description?: string;
  category: string;
  countryCode?: string;
  countryName?: string;
  languageCode?: string;
  languageName?: string;
  visibility: 'public' | 'private' | 'vip';
  accessType: 'open' | 'password' | 'approval' | 'invite_only';
  passwordHash?: string;
  maxMics: number;
  maxListeners?: number | null;
  listenersUnlimited: boolean;
  currentListenersCount: number;
  currentSpeakersCount: number;
  status: 'active' | 'closed' | 'suspended';
  isLive: boolean; // Maintain compatibility
  speakersCount: number; // Maintain compatibility
  listenersCount: number; // Maintain compatibility
  hostIds: string[];
  moderatorIds: string[];
  tags?: string[];
  coverImageUrl?: string;
  isPrivate?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface RoomAccessRequest {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: any;
  reviewedBy?: string;
  reviewedAt?: any;
}

export interface RoomInvite {
  id: string;
  roomId: string;
  invitedUserId: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: any;
  expiresAt?: any;
}

export interface RoomBan {
  id: string;
  roomId: string;
  userId: string;
  bannedBy: string;
  reason?: string;
  type: 'kick' | 'ban';
  expiresAt?: any;
  isPermanent: boolean;
  createdAt: any;
  updatedAt: any;
}
