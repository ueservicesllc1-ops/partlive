import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { createNotificationAndPush } from './notificationService';
import { buildDeepLink, DeepLinkTarget } from './deepLinkService';

export interface NotificationCampaign {
  id: string;
  title: string;
  body: string;
  targetSegment: 'ALL' | 'NEW_USERS' | 'INACTIVE' | 'PAYING_USERS' | 'VIP' | 'CREATORS';
  deepLinkTarget: DeepLinkTarget;
  deepLinkId?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'EXECUTIVE' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  sentCount: number;
  openCount: number;
  createdAt: any;
  executedAt?: any;
}

export const createNotificationCampaign = async (
  campaign: Omit<NotificationCampaign, 'id' | 'status' | 'sentCount' | 'openCount' | 'createdAt'>
): Promise<NotificationCampaign> => {
  const ref = db.collection('notificationCampaigns').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newCampaign: NotificationCampaign = {
    ...campaign,
    id: ref.id,
    status: 'DRAFT',
    sentCount: 0,
    openCount: 0,
    createdAt: timestamp,
  };

  await ref.set(newCampaign);
  return newCampaign;
};

export const executeNotificationCampaign = async (campaignId: string, adminId: string): Promise<{ sentCount: number }> => {
  const campaignRef = db.collection('notificationCampaigns').doc(campaignId);
  const snap = await campaignRef.get();
  if (!snap.exists) throw new Error(`CAMPAIGN_NOT_FOUND: ${campaignId}`);

  const campaign = snap.data() as NotificationCampaign;
  if (campaign.status === 'COMPLETED') throw new Error('CAMPAIGN_ALREADY_COMPLETED');

  const deepLink = buildDeepLink(campaign.deepLinkTarget, campaign.deepLinkId);

  let userQuery: admin.firestore.Query = db.collection('users').where('status', '==', 'active');
  if (campaign.targetSegment === 'CREATORS') {
    userQuery = userQuery.where('isHost', '==', true);
  }

  const usersSnap = await userQuery.limit(200).get();
  let sentCount = 0;

  for (const doc of usersSnap.docs) {
    try {
      await createNotificationAndPush({
        userId: doc.id,
        type: 'system',
        channel: 'both',
        title: campaign.title,
        body: campaign.body,
        actionType: 'open_url',
        actionValue: deepLink.url,
      });
      sentCount++;
    } catch (err) {
      console.warn(`[Campaign] Failed push to ${doc.id}:`, err);
    }
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  await campaignRef.update({
    status: 'COMPLETED',
    sentCount,
    executedAt: timestamp,
    executedBy: adminId,
  });

  return { sentCount };
};
