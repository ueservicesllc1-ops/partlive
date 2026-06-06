export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily_login' | 'watch_live' | 'join_room' | 'send_gift' | 'play_game' | 'invite_friend';
  targetValue: number;
  rewardType: 'coins' | 'diamonds' | 'xp';
  rewardAmount: number;
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface UserDailyMission {
  id: string;
  userId: string;
  missionId: string;
  progress: number;
  targetValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
  dateKey: string; // YYYY-MM-DD
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
