export interface Report {
  id: string;
  reporterId: string;
  targetType: 'user' | 'room' | 'live' | 'message' | 'game';
  targetId: string;
  reason: 'spam' | 'abuse' | 'harassment' | 'sexual_content' | 'violence' | 'scam' | 'other';
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  resolvedBy?: string;
  resolutionNote?: string;
}
