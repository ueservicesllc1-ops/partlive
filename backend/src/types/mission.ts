export type MissionType = 'daily' | 'weekly' | 'event' | 'host' | 'vip' | 'new_user';

export type MissionActionType =
  | 'daily_login'
  | 'join_room'
  | 'stay_in_room_minutes'
  | 'watch_live_minutes'
  | 'send_message'
  | 'send_gift'
  | 'receive_gift'
  | 'play_game'
  | 'win_game'
  | 'follow_user'
  | 'invite_friend'
  | 'start_live'
  | 'create_room'
  | 'host_live_minutes'
  | 'karaoke_participation'
  | 'event_participation';

export type MissionRewardType =
  | 'xp'
  | 'diamonds'
  | 'beans'
  | 'badge'
  | 'event_points'
  | 'vip_trial'
  | 'gift_ticket';

export type MissionStatus = 'active' | 'inactive' | 'scheduled' | 'ended';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  actionType: MissionActionType;
  targetValue: number;
  rewardType: MissionRewardType;
  rewardAmount: number;
  rewardMetadata?: Record<string, any>;
  isRepeatable: boolean;
  maxClaimsPerUser: number;
  requiresVip?: boolean;
  requiresHost?: boolean;
  eventId?: string;
  startsAt?: any;
  endsAt?: any;
  status: MissionStatus;
  sortOrder: number;
  createdAt: any;
  updatedAt: any;
}

export interface UserMissionProgress {
  id: string;
  userId: string;
  missionId: string;
  missionType: MissionType;
  actionType: MissionActionType;
  periodKey: string;
  progress: number;
  targetValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
  claimedAt?: any;
  rewardType: MissionRewardType;
  rewardAmount: number;
  createdAt: any;
  updatedAt: any;
}

export interface MissionReward {
  id: string;
  userId: string;
  missionId: string;
  progressId: string;
  rewardType: MissionRewardType;
  rewardAmount: number;
  status: 'pending' | 'claimed' | 'failed' | 'reversed';
  description?: string;
  createdAt: any;
  claimedAt?: any;
}
