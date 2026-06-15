import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { Banner, BannerPlacement } from '../types/banner';

const BANNERS_COLLECTION = 'banners';

/**
 * Fetch active banners filtered by placement, date ranges, and user credentials.
 */
export async function getActiveBanners(
  placement: BannerPlacement,
  userContext?: { isVip?: boolean; isHost?: boolean; country?: string; language?: string }
): Promise<Banner[]> {
  const now = new Date();
  
  let query: admin.firestore.Query = db
    .collection(BANNERS_COLLECTION)
    .where('placement', '==', placement)
    .where('isActive', '==', true);

  const snap = await query.get();
  const list: Banner[] = [];

  snap.forEach((doc) => {
    const banner = doc.data() as Banner;

    // Filters based on VIP / Host / Dates / Language
    if (banner.startsAt) {
      const starts = banner.startsAt.toDate ? banner.startsAt.toDate() : new Date(banner.startsAt);
      if (starts > now) return;
    }
    if (banner.endsAt) {
      const ends = banner.endsAt.toDate ? banner.endsAt.toDate() : new Date(banner.endsAt);
      if (ends < now) return;
    }

    if (banner.requiresVip && !userContext?.isVip) return;
    if (banner.requiresHost && !userContext?.isHost) return;
    if (banner.country && userContext?.country && banner.country !== userContext.country) return;
    if (banner.language && userContext?.language && banner.language !== userContext.language) return;

    list.push(banner);
  });

  // Sort by priority desc
  return list.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

/**
 * Retrieve a banner details by ID.
 */
export async function getBannerById(bannerId: string): Promise<Banner | null> {
  const doc = await db.collection(BANNERS_COLLECTION).doc(bannerId).get();
  return doc.exists ? (doc.data() as Banner) : null;
}

/**
 * Create a promotional banner (Admin only).
 */
export async function createBanner(adminId: string, data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Banner> {
  const ref = db.collection(BANNERS_COLLECTION).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const newBanner: Banner = {
    ...data,
    id: ref.id,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(newBanner);
  return { ...newBanner, createdAt: new Date(), updatedAt: new Date() };
}

/**
 * Update banner configuration (Admin only).
 */
export async function updateBanner(bannerId: string, adminId: string, data: Partial<Banner>): Promise<Banner> {
  const ref = db.collection(BANNERS_COLLECTION).doc(bannerId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await ref.update({
    ...data,
    updatedAt: now,
  });

  const doc = await ref.get();
  return doc.data() as Banner;
}

/**
 * Enable a promotional banner.
 */
export async function activateBanner(bannerId: string, adminId: string): Promise<void> {
  await db.collection(BANNERS_COLLECTION).doc(bannerId).update({
    isActive: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Disable a promotional banner.
 */
export async function deactivateBanner(bannerId: string, adminId: string): Promise<void> {
  await db.collection(BANNERS_COLLECTION).doc(bannerId).update({
    isActive: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
