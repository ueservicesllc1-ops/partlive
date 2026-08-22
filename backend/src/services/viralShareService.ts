import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface ShareLink {
  code: string;
  type: 'live' | 'clip' | 'profile' | 'event';
  targetId: string;
  referrerId: string;
  url: string;
  clickCount: number;
  createdAt: any;
}

export const generateShareLink = async (
  type: ShareLink['type'],
  targetId: string,
  referrerId: string
): Promise<ShareLink> => {
  const code = 'share_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const ref = db.collection('shareLinks').doc(code);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const url = `partylive://${type}/${targetId}?ref=${referrerId}&code=${code}`;

  const shareLink: ShareLink = {
    code,
    type,
    targetId,
    referrerId,
    url,
    clickCount: 0,
    createdAt: timestamp,
  };

  await ref.set(shareLink);
  return shareLink;
};

export const recordShareClick = async (
  code: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; isBot: boolean }> => {
  const uaLower = (userAgent || '').toLowerCase();
  const isBot = uaLower.includes('bot') || uaLower.includes('crawler') || uaLower.includes('spider');

  const ref = db.collection('shareLinks').doc(code);
  const snap = await ref.get();
  if (!snap.exists) return { success: false, isBot };

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  // Log attribution event
  const clickRef = db.collection('shareAttributions').doc();
  await clickRef.set({
    id: clickRef.id,
    code,
    referrerId: snap.data()?.referrerId,
    targetId: snap.data()?.targetId,
    type: snap.data()?.type,
    isBot,
    ipAddress: ipAddress || '0.0.0.0',
    createdAt: timestamp,
  });

  if (!isBot) {
    await ref.update({
      clickCount: admin.firestore.FieldValue.increment(1),
    });
  }

  return { success: true, isBot };
};

export const getViralAnalyticsSummary = async (): Promise<{ totalShares: number; totalClicks: number; kFactor: number }> => {
  const sharesSnap = await db.collection('shareLinks').limit(200).get();
  const clicksSnap = await db.collection('shareAttributions').where('isBot', '==', false).limit(200).get();

  const totalShares = sharesSnap.size;
  const totalClicks = clicksSnap.size;
  const kFactor = totalShares > 0 ? Number((totalClicks / totalShares).toFixed(2)) : 0;

  return { totalShares, totalClicks, kFactor };
};
