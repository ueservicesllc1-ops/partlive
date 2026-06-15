export type NotificationType =
  | 'system'
  | 'game_invite'
  | 'live_started'
  | 'room_invite'
  | 'gift_received'
  | 'mission_completed'
  | 'mission_reward'
  | 'host_application'
  | 'payout_update'
  | 'vip_update'
  | 'event_started'
  | 'ranking_update'
  | 'moderation'
  | 'follow'
  | 'agency_update'
  | 'wallet_update';

export type NotificationChannel = 'in_app' | 'push' | 'both';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  imageUrl?: string;
  actionType?:
    | 'none'
    | 'open_profile'
    | 'open_room'
    | 'open_live'
    | 'open_game_session'
    | 'open_missions'
    | 'open_wallet'
    | 'open_host_dashboard'
    | 'open_payout'
    | 'open_event'
    | 'open_vip'
    | 'open_url';
  actionValue?: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  createdAt: any;
  readAt?: any;
  expiresAt?: any;
}

export interface UserNotificationSettings {
  userId: string;
  pushEnabled: boolean;
  liveStarted: boolean;
  gameInvites: boolean;
  gifts: boolean;
  missions: boolean;
  payouts: boolean;
  vip: boolean;
  events: boolean;
  marketing: boolean;
  moderation: boolean;
  privateMessages: boolean;
  updatedAt: any;
}

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
  isActive: boolean;
  lastSeenAt: any;
  createdAt: any;
  updatedAt: any;
}
