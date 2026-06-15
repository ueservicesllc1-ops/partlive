export type PromotionType = 'diamond_bonus' | 'vip_discount' | 'gift_discount' | 'host_campaign';

export interface Promotion {
  id: string;
  title: string;
  type: PromotionType;
  startsAt: any;
  endsAt: any;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: any;
  updatedAt: any;
}
