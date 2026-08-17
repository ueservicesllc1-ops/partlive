import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface AcquisitionEvent {
  id: string;
  userId: string;
  source: 'ORGANIC' | 'REFERRAL' | 'AFFILIATE' | 'TIKTOK' | 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'GOOGLE' | 'PAID_AD' | 'DIRECT';
  campaignId?: string;
  affiliateId?: string;
  referrerId?: string;
  contentId?: string;
  platform?: string;
  createdAt: any;
}

export const trackAcquisitionEvent = async (
  userId: string,
  source: 'ORGANIC' | 'REFERRAL' | 'AFFILIATE' | 'TIKTOK' | 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'GOOGLE' | 'PAID_AD' | 'DIRECT' = 'ORGANIC',
  campaignId?: string,
  affiliateId?: string,
  referrerId?: string,
  contentId?: string,
  platform: string = 'android'
): Promise<AcquisitionEvent> => {
  const eventRef = db.collection('acquisitionEvents').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const event: AcquisitionEvent = {
    id: eventRef.id,
    userId,
    source,
    campaignId: campaignId || '',
    affiliateId: affiliateId || '',
    referrerId: referrerId || '',
    contentId: contentId || '',
    platform,
    createdAt: timestamp,
  };

  await eventRef.set(event);

  // Update user acquisition metadata
  await db.collection('users').doc(userId).set({
    acquisitionSource: source,
    campaignId: campaignId || null,
    affiliateId: affiliateId || null,
    referrerId: referrerId || null,
  }, { merge: true });

  return event;
};

export const getAttributionFunnelReport = async (campaignId?: string): Promise<any> => {
  let query: admin.firestore.Query = db.collection('acquisitionEvents');
  if (campaignId) {
    query = query.where('campaignId', '==', campaignId);
  }

  const snap = await query.limit(500).get();
  let totalClicks = snap.size;
  let totalRegistrations = 0;
  let totalPurchasers = 0;

  snap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.userId) totalRegistrations++;
  });

  return {
    campaignId: campaignId || 'ALL',
    totalClicks,
    totalRegistrations,
    conversionRate: totalClicks > 0 ? ((totalRegistrations / totalClicks) * 100).toFixed(2) + '%' : '0%',
  };
};
