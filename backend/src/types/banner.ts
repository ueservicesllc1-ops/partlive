export type BannerPlacement =
  | 'home_top'
  | 'home_middle'
  | 'rooms_top'
  | 'lives_top'
  | 'games_top'
  | 'wallet_top'
  | 'host_dashboard_top'
  | 'vip_top'
  | 'events_top';

export type BannerActionType =
  | 'none'
  | 'open_event'
  | 'open_room'
  | 'open_live'
  | 'open_game'
  | 'open_wallet'
  | 'open_vip'
  | 'open_host_dashboard'
  | 'open_url';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  backgroundColor?: string;
  placement: BannerPlacement;
  actionType: BannerActionType;
  actionValue?: string;
  startsAt?: any;
  endsAt?: any;
  priority: number;
  isActive: boolean;
  country?: string;
  language?: string;
  requiresVip?: boolean;
  requiresHost?: boolean;
  createdAt: any;
  updatedAt: any;
}
