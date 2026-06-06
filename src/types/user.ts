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
  coins: number;
  diamonds: number;
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
  role: 'user' | 'host' | 'moderator' | 'admin';
  profileCompleted: boolean;
  authProvider?: 'email' | 'google' | 'phone' | 'guest';
  status?: 'active' | 'suspended' | 'deleted';
  badges?: string[];
  interests?: string[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  lastActiveAt: any; // Firestore Timestamp
}
