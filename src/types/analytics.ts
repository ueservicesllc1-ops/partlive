export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

export type AnalyticsMetricType =
  | 'users'
  | 'revenue'
  | 'diamonds'
  | 'beans'
  | 'gifts'
  | 'hosts'
  | 'lives'
  | 'rooms'
  | 'vip'
  | 'agencies'
  | 'payouts'
  | 'events'
  | 'fraud'
  | 'retention';

export type AnalyticsEventType =
  | 'user_registered'
  | 'user_login'
  | 'session_started'
  | 'room_joined'
  | 'room_created'
  | 'live_started'
  | 'live_watched'
  | 'gift_sent'
  | 'diamond_purchase'
  | 'vip_purchase'
  | 'host_approved'
  | 'host_live_minutes'
  | 'payout_requested'
  | 'payout_paid'
  | 'agency_approved'
  | 'agency_commission_created'
  | 'event_joined'
  | 'mission_completed'
  | 'verification_approved'
  | 'fraud_signal_created';

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  type: AnalyticsEventType;
  country?: string;
  language?: string;
  platform?: 'android' | 'ios' | 'web' | 'admin';
  appVersion?: string;
  metadata?: Record<string, any>;
  createdAt: any;
}

export interface DailyAnalytics {
  id: string;
  periodKey: string;
  date: string;
  usersRegistered: number;
  activeUsers: number;
  newUsers: number;
  payingUsers: number;
  diamondsSold: number;
  diamondsSpent: number;
  revenueUsd: number;
  giftsSent: number;
  beansGenerated: number;
  platformEstimatedGrossUsd: number;
  hostEstimatedEarningsUsd: number;
  agencyEstimatedEarningsUsd: number;
  payoutsRequestedUsd: number;
  payoutsPaidUsd: number;
  activeHosts: number;
  liveHours: number;
  roomsCreated: number;
  livesStarted: number;
  vipPurchases: number;
  activeVipUsers: number;
  agencyCommissionsBeans: number;
  fraudSignals: number;
  createdAt: any;
  updatedAt: any;
}

export interface CountryAnalytics {
  id: string;
  periodKey: string;
  country: string;
  activeUsers: number;
  newUsers: number;
  revenueUsd: number;
  diamondsSold: number;
  giftsSent: number;
  hostsActive: number;
  createdAt: any;
  updatedAt: any;
}

export interface HostAnalytics {
  id: string;
  hostId: string;
  periodKey: string;
  liveMinutes: number;
  activeDays: number;
  averageViewers: number;
  peakViewers: number;
  giftsReceived: number;
  diamondsReceived: number;
  beansGenerated: number;
  pkBattles: number;
  karaokePerformances: number;
  followersGained: number;
  createdAt: any;
  updatedAt: any;
}

export interface AgencyAnalytics {
  id: string;
  agencyId: string;
  periodKey: string;
  activeHosts: number;
  totalHosts: number;
  diamondsGenerated: number;
  hostBeansGenerated: number;
  agencyBeansEarned: number;
  commissionsCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface GiftAnalytics {
  id: string;
  giftId: string;
  periodKey: string;
  giftName: string;
  sentCount: number;
  totalDiamonds: number;
  totalBeansGenerated: number;
  uniqueSenders: number;
  uniqueReceivers: number;
  createdAt: any;
  updatedAt: any;
}
