import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface VirtualItem {
  itemId: string;
  name: string;
  category: 'PROFILE_FRAME' | 'CHAT_BADGE' | 'LIVE_BACKGROUND' | 'ANIMATED_EFFECT';
  coinPrice: number;
  usdPrice: number;
  imageUrl: string;
  durationDays: number;
}

const CATALOG: VirtualItem[] = [
  {
    itemId: 'item_gold_frame',
    name: 'Marco Dorado VIP',
    category: 'PROFILE_FRAME',
    coinPrice: 500,
    usdPrice: 4.99,
    imageUrl: 'https://partylive.app/items/gold_frame.png',
    durationDays: 30,
  },
  {
    itemId: 'item_fire_badge',
    name: 'Insignia de Fuego',
    category: 'CHAT_BADGE',
    coinPrice: 200,
    usdPrice: 1.99,
    imageUrl: 'https://partylive.app/items/fire_badge.png',
    durationDays: 30,
  },
  {
    itemId: 'item_neon_bg',
    name: 'Fondo de Transmisión Neón',
    category: 'LIVE_BACKGROUND',
    coinPrice: 1000,
    usdPrice: 9.99,
    imageUrl: 'https://partylive.app/items/neon_bg.png',
    durationDays: 30,
  },
];

export const getVirtualItemsCatalog = async (): Promise<VirtualItem[]> => {
  return CATALOG;
};

export const promoteCreatorLive = async (
  hostId: string,
  liveId: string,
  budgetUsd: number,
  durationHours: number = 2
): Promise<any> => {
  const ref = db.collection('promotedCreators').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const promotion = {
    id: ref.id,
    hostId,
    liveId,
    budgetUsd,
    durationHours,
    status: 'ACTIVE',
    sponsored: true, // Explicitly labeled as sponsored in Discovery (NO fake organic ranking)
    createdAt: timestamp,
  };

  await ref.set(promotion);

  // Mark live as promoted
  await db.collection('lives').doc(liveId).update({
    isPromoted: true,
    sponsored: true,
  });

  return promotion;
};
