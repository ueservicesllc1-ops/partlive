export type SpecialEventType =
  | 'global_ranking'
  | 'top_hosts'
  | 'top_gifters'
  | 'top_donors'
  | 'karaoke_battle'
  | 'room_tournament'
  | 'gift_campaign'
  | 'agency_challenge'
  | 'vip_promo'
  | 'diamond_promo'
  | 'game_tournament'
  | 'new_user_campaign';

export type SpecialEventStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled';

export type SpecialEventTarget = 'users' | 'hosts' | 'rooms' | 'lives' | 'agencies' | 'vip_users' | 'all';

export type SpecialEventRewardType =
  | 'xp'
  | 'diamonds'
  | 'beans'
  | 'badge'
  | 'vip_trial'
  | 'gift_ticket'
  | 'event_points'
  | 'manual_prize';

export interface SpecialEvent {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  type: SpecialEventType;
  target: SpecialEventTarget;
  status: SpecialEventStatus;
  bannerUrl?: string;
  thumbnailUrl?: string;
  rules?: string;
  startsAt: any;
  endsAt: any;
  isActive: boolean;
  rankingType?: string;
  rewardType?: SpecialEventRewardType;
  rewardAmount?: number;
  rewardMetadata?: Record<string, any>;
  minParticipationValue?: number;
  maxParticipants?: number;
  country?: string;
  language?: string;
  createdBy?: string;
  createdAt: any;
  updatedAt: any;
  notificationSent?: boolean;
}

export interface EventParticipant {
  id: string; // eventId_userId
  eventId: string;
  userId?: string;
  hostId?: string;
  roomId?: string;
  liveId?: string;
  agencyId?: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  score: number;
  position?: number;
  progressValue: number;
  rewardClaimed: boolean;
  rewardStatus?: 'none' | 'pending' | 'approved' | 'paid' | 'rejected';
  joinedAt: any;
  updatedAt: any;
}

export interface EventReward {
  id: string;
  eventId: string;
  participantId: string;
  userId?: string;
  rewardType: SpecialEventRewardType;
  rewardAmount: number;
  status: 'pending' | 'approved' | 'claimed' | 'rejected' | 'reversed';
  approvedBy?: string;
  approvedAt?: any;
  claimedAt?: any;
  createdAt: any;
  updatedAt: any;
}
