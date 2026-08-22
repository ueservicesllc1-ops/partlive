import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export type ProductType =
  | 'COINS'
  | 'VIP'
  | 'SUBSCRIPTION'
  | 'FAN_CLUB'
  | 'PREMIUM_GIFT'
  | 'EVENT_TICKET'
  | 'BOOST'
  | 'CREATOR_FEATURE'
  | 'AD'
  | 'SPONSORSHIP';

export interface MonetizationProduct {
  productId: string;
  type: ProductType;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  status: 'ACTIVE' | 'PAUSED' | 'RETIRED';
}

export interface VIPMembershipRecord {
  id: string;
  userId: string;
  vipLevel: number; // 1 to 5
  badge: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface EventTicketRecord {
  ticketId: string;
  userId: string;
  eventId: string;
  priceCents: number;
  currency: string;
  purchasedAt: string;
}

export interface CreatorBoostRecord {
  id: string;
  hostId: string;
  targetType: 'LIVE' | 'CLIP' | 'EVENT';
  targetId: string;
  budgetUsd: number;
  durationHours: number;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface SponsorshipCampaignRecord {
  id: string;
  sponsorId: string;
  creatorId: string;
  budgetUsd: number;
  deliverables: string[];
  status: 'PENDING' | 'ACTIVE' | 'DELIVERED' | 'APPROVED';
}

const catalog: Record<string, MonetizationProduct> = {
  COIN_PACK_100: { productId: 'COIN_PACK_100', type: 'COINS', name: 'Pack 100 Coins', description: '100 Coins virtuales', priceCents: 99, currency: 'USD', status: 'ACTIVE' },
  VIP_LEVEL_1: { productId: 'VIP_LEVEL_1', type: 'VIP', name: 'Membresía VIP 1', description: 'Insignia de perfil y efectos de chat VIP', priceCents: 499, currency: 'USD', status: 'ACTIVE' },
  VIP_LEVEL_5: { productId: 'VIP_LEVEL_5', type: 'VIP', name: 'Membresía VIP 5 Leyenda', description: 'Insignia Dorada y entrada prioritaria', priceCents: 4999, currency: 'USD', status: 'ACTIVE' },
  EVENT_TICKET_KARAOKE: { productId: 'EVENT_TICKET_KARAOKE', type: 'EVENT_TICKET', name: 'Entrada Show Karaoke VIP', description: 'Acceso exclusivo al evento', priceCents: 299, currency: 'USD', status: 'ACTIVE' },
  BOOST_LIVE_2H: { productId: 'BOOST_LIVE_2H', type: 'BOOST', name: 'Impulso Live 2 Horas', description: 'Mayor visibilidad en recomendados', priceCents: 999, currency: 'USD', status: 'ACTIVE' },
};

export const getMonetizationProducts = async (type?: ProductType): Promise<MonetizationProduct[]> => {
  const products = Object.values(catalog);
  if (type) {
    return products.filter((p) => p.type === type);
  }
  return products;
};

export const verifyPriceIntegrity = (productId: string, clientPriceCents: number): boolean => {
  const product = catalog[productId];
  if (!product) return false;
  return product.priceCents === clientPriceCents;
};

export const purchaseVIPMembership = async (
  userId: string,
  vipLevel: number = 1,
  durationMonths: number = 1
): Promise<VIPMembershipRecord> => {
  const ref = db.collection('vipMemberships').doc(userId);
  const expiresAt = new Date(Date.now() + durationMonths * 30 * 86400000).toISOString();

  const record: VIPMembershipRecord = {
    id: ref.id,
    userId,
    vipLevel,
    badge: `👑 VIP ${vipLevel}`,
    expiresAt,
    status: 'ACTIVE',
  };

  await ref.set(record);

  // Update user profile badge
  await db.collection('users').doc(userId).set({ isVip: true, vipLevel, vipBadge: record.badge }, { merge: true });

  return record;
};

export const purchaseEventTicket = async (
  userId: string,
  eventId: string,
  productId: string = 'EVENT_TICKET_KARAOKE'
): Promise<EventTicketRecord> => {
  const product = catalog[productId];
  if (!product) throw new Error('Producto de entrada no encontrado.');

  const ref = db.collection('eventTickets').doc();
  const ticket: EventTicketRecord = {
    ticketId: ref.id,
    userId,
    eventId,
    priceCents: product.priceCents,
    currency: product.currency,
    purchasedAt: new Date().toISOString(),
  };

  await ref.set(ticket);
  return ticket;
};

export const createCreatorBoost = async (
  hostId: string,
  targetType: 'LIVE' | 'CLIP' | 'EVENT',
  targetId: string,
  budgetUsd: number = 10.0,
  durationHours: number = 2
): Promise<CreatorBoostRecord> => {
  const ref = db.collection('creatorBoosts').doc();

  const boost: CreatorBoostRecord = {
    id: ref.id,
    hostId,
    targetType,
    targetId,
    budgetUsd,
    durationHours,
    status: 'ACTIVE',
  };

  await ref.set(boost);
  return boost;
};

export const createSponsorshipCampaign = async (
  sponsorId: string,
  creatorId: string,
  budgetUsd: number,
  deliverables: string[]
): Promise<SponsorshipCampaignRecord> => {
  const ref = db.collection('sponsorshipCampaigns').doc();

  const campaign: SponsorshipCampaignRecord = {
    id: ref.id,
    sponsorId,
    creatorId,
    budgetUsd,
    deliverables,
    status: 'ACTIVE',
  };

  await ref.set(campaign);
  return campaign;
};

export const getMonetizationProfitabilityReport = async (): Promise<{
  grossRevenueUsd: number;
  creatorShareUsd: number;
  platformShareUsd: number;
  paymentFeesUsd: number;
  contributionMarginUsd: number;
  revenueByProductType: Record<ProductType, number>;
}> => {
  return {
    grossRevenueUsd: 12500.0,
    creatorShareUsd: 5500.0,
    platformShareUsd: 7000.0,
    paymentFeesUsd: 375.0,
    contributionMarginUsd: 5625.0,
    revenueByProductType: {
      COINS: 5000.0,
      VIP: 2200.0,
      SUBSCRIPTION: 1500.0,
      FAN_CLUB: 800.0,
      PREMIUM_GIFT: 1200.0,
      EVENT_TICKET: 600.0,
      BOOST: 400.0,
      CREATOR_FEATURE: 300.0,
      AD: 300.0,
      SPONSORSHIP: 200.0,
    },
  };
};
