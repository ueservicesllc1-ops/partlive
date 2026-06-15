export type HostStatus = 'not_applied' | 'pending' | 'approved' | 'rejected' | 'suspended';

export interface HostApplication {
  id: string;
  userId: string;
  fullName: string;
  displayName: string;
  username?: string;
  email?: string;
  country?: string;
  phone?: string;
  socialLink?: string;
  experience?: string;
  whyHost?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  reviewedBy?: string;
  reviewedAt?: any; // Firestore Timestamp
  reviewNote?: string;
}

export type HostLevel = 'initial' | 'silver' | 'gold';

export interface HostMonetizationLevel {
  id: string; // 'initial' | 'silver' | 'gold'
  name: string;
  minFollowers: number;
  minLiveHoursMonthly: number;
  minActiveDaysMonthly: number;
  minAverageViewers: number;
  minDiamondsMonthly: number;
  hostSharePercent: number;
  platformSharePercent: number;
  isActive: boolean;
  sortOrder: number;
}

export interface HostStats {
  id: string; // hostId
  hostId: string;
  currentLevel: HostLevel;
  followersCount: number;
  monthlyLiveHours: number;
  monthlyActiveDays: number;
  averageViewers: number;
  monthlyDiamondsReceived: number;
  monthlyBeansEarned: number;
  totalBeansEarned: number;
  eligibleForPayout: boolean;
  eligibilityUpdatedAt: any; // Firestore Timestamp
  totalLives: number;
  totalRooms: number;
  totalLiveMinutes: number;
  totalRoomMinutes: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export type HostActivityType =
  | 'live_started'
  | 'live_ended'
  | 'room_created'
  | 'room_ended'
  | 'gift_received'
  | 'ranking_update'
  | 'payout_requested'
  | 'payout_approved'
  | 'payout_rejected'
  | 'payout_paid'
  | 'warning'
  | 'system';

export interface HostActivity {
  id: string;
  hostId: string;
  type: HostActivityType;
  title: string;
  description?: string;
  beansDelta?: number;
  relatedLiveId?: string;
  relatedRoomId?: string;
  relatedGiftEventId?: string;
  createdAt: any; // Firestore Timestamp
}

export interface HostRule {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}
