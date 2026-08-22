import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface CreatorBonusCampaign {
  id: string;
  name: string;
  maxBudgetUsd: number;
  spentBudgetUsd: number;
  rewardAmountUsd: number;
  status: 'ACTIVE' | 'EXHAUSTED' | 'DISABLED';
  createdAt: any;
}

export const createBonusCampaign = async (
  name: string,
  maxBudgetUsd: number,
  rewardAmountUsd: number
): Promise<CreatorBonusCampaign> => {
  const ref = db.collection('creatorBonusCampaigns').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const campaign: CreatorBonusCampaign = {
    id: ref.id,
    name,
    maxBudgetUsd,
    spentBudgetUsd: 0,
    rewardAmountUsd,
    status: 'ACTIVE',
    createdAt: timestamp,
  };

  await ref.set(campaign);
  return campaign;
};

export const awardCreatorBonus = async (
  userId: string,
  campaignId: string,
  rewardAmountUsd: number
): Promise<{ success: boolean; bonusId: string; newSpentBudgetUsd: number }> => {
  const campRef = db.collection('creatorBonusCampaigns').doc(campaignId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const bonusRef = db.collection('creatorBonusLedger').doc();

  let newSpentBudget = 0;

  await db.runTransaction(async (transaction) => {
    const campSnap = await transaction.get(campRef);
    if (!campSnap.exists) throw new Error(`CAMPAIGN_NOT_FOUND: ${campaignId}`);

    const campaign = campSnap.data() as CreatorBonusCampaign;
    if (campaign.status !== 'ACTIVE') throw new Error('CAMPAIGN_INACTIVE: Campaign is not active.');

    newSpentBudget = Number((campaign.spentBudgetUsd + rewardAmountUsd).toFixed(2));
    if (newSpentBudget > campaign.maxBudgetUsd) {
      transaction.update(campRef, { status: 'EXHAUSTED', updatedAt: timestamp });
      throw new Error('BUDGET_EXCEEDED: Bonus campaign maximum budget reached.');
    }

    transaction.update(campRef, {
      spentBudgetUsd: newSpentBudget,
      status: newSpentBudget >= campaign.maxBudgetUsd ? 'EXHAUSTED' : 'ACTIVE',
      updatedAt: timestamp,
    });

    transaction.set(bonusRef, {
      id: bonusRef.id,
      campaignId,
      userId,
      rewardAmountUsd,
      timestamp,
    });
  });

  return {
    success: true,
    bonusId: bonusRef.id,
    newSpentBudgetUsd: newSpentBudget,
  };
};
