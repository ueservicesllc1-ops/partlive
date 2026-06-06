export interface RankingEntry {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  rankingType: 'daily_hosts' | 'weekly_hosts' | 'top_gifters' | 'top_rooms' | 'top_games';
  period: string;
  position: number;
  updatedAt: any; // Firestore Timestamp
}
