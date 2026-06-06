export interface MicSeat {
  index: number; // 0 to 7
  userId?: string;
  displayName?: string;
  photoURL?: string;
  role?: 'owner' | 'host' | 'moderator' | 'speaker';
  isLocked: boolean;
  isMuted: boolean;
  isOccupied: boolean;
}

export interface MicRequest {
  id: string; // userId or request id
  roomId: string;
  userId: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
