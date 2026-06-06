// ─── Host Status ─────────────────────────────────────────────────────────────
export type HostStatus = 'not_applied' | 'pending' | 'approved' | 'rejected' | 'suspended';

// ─── Host Application ─────────────────────────────────────────────────────────
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

// ─── Host Stats ───────────────────────────────────────────────────────────────
export interface HostStats {
  id: string;
  hostId: string;
  totalDiamondsEarned: number;
  availableDiamonds: number;
  pendingDiamonds: number;
  lockedDiamonds: number;
  totalGiftsReceived: number;
  totalLives: number;
  totalRooms: number;
  totalLiveMinutes: number;
  totalRoomMinutes: number;
  followersGained: number;
  bestRankingPosition?: number;
  currentDailyRank?: number;
  currentWeeklyRank?: number;
  averageViewers: number;
  peakViewers: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// ─── Host Activity ────────────────────────────────────────────────────────────
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
  diamondsDelta?: number;
  relatedLiveId?: string;
  relatedRoomId?: string;
  relatedGiftEventId?: string;
  createdAt: any; // Firestore Timestamp
}

// ─── Host Rule ────────────────────────────────────────────────────────────────
export interface HostRule {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

// ─── Host Payout ──────────────────────────────────────────────────────────────
import { HostPayout } from './payout';
export type { HostPayout };

