export interface Block {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: any; // Firestore Timestamp
}
