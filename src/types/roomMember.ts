import { RoomRole } from '../constants/roomPermissions';

export interface RoomMember {
  id: string; // userId
  roomId: string;
  userId: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  role: RoomRole;
  seatIndex?: number; // 0 to 7, or undefined if listener
  isMuted: boolean;
  isSpeaking?: boolean;
  isKicked?: boolean;
  isBannedFromRoom?: boolean;
  joinedAt: any; // Firestore Timestamp
  lastActiveAt: any; // Firestore Timestamp
  promotedBy?: string;
  promotedAt?: any;
  mutedBy?: string;
  mutedAt?: any;
  kickedBy?: string;
  kickedAt?: any;
}
