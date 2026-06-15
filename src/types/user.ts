export interface UserProfile {
  uid: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // YYYY-MM-DD (legacy/optional)
  birthDate?: string; // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  displayName: string;
  username: string;
  usernameLowercase?: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  country?: string;
  language?: string;
  level: number;
  xp: number;
  diamonds: number; // Moneda comprada por el usuario
  beans: number; // Moneda acumulada por el host para retiros
  followersCount: number;
  followingCount: number;
  friendsCount?: number;
  totalGiftsSent?: number;
  totalGiftsReceived?: number;
  roomsJoinedCount?: number;
  livesWatchedCount?: number;
  gamesPlayedCount?: number;
  isHost: boolean;
  isVerified: boolean;
  role: 'user' | 'host' | 'agency' | 'moderator' | 'admin';
  profileCompleted: boolean;
  vipLevel?: number;
  vipExpiresAt?: any;
  isVip?: boolean;
  rank?: string;
  rankLevel?: number;
  nextRankXp?: number;
  authProvider?: 'email' | 'google' | 'phone' | 'guest';
  status?: 'active' | 'warning' | 'suspended' | 'banned' | 'deleted';
  suspendedUntil?: any;
  bannedReason?: string;
  badges?: string[];
  interests?: string[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  lastActiveAt: any; // Firestore Timestamp
  lastSocialActivityAt?: any; // Firestore Timestamp
  profileVisibility?: 'public' | 'followers' | 'private';
  activityVisibility?: 'public' | 'followers' | 'private';
  showCountry?: boolean;
  showOnlineStatus?: boolean;
  unreadPrivateMessagesCount?: number;
  allowMessagesFrom?: 'everyone' | 'followers' | 'friends' | 'none';
  isKycVerified?: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'not_verified';
}
