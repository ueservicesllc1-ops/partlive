import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { Mission, UserMissionProgress, MissionReward } from '../types/mission';
import { DEFAULT_MISSIONS } from '../constants/defaultMissions';
import { getMissionPeriodKey, isMissionActive } from '../utils/missionPeriods';
import { addUserXp } from './rankService';
import { canTrackMissionAction, blockSuspiciousMissionReward } from './missionAntiAbuseService';

/**
 * Ensures default missions exist in the database (Seeding).
 */
export async function seedDefaultMissions(): Promise<void> {
  const missionsColl = db.collection('missions');
  const snapshot = await missionsColl.limit(1).get();
  
  if (!snapshot.empty) {
    return; // Already seeded
  }

  const batch = db.batch();
  for (const m of DEFAULT_MISSIONS) {
    const docRef = missionsColl.doc();
    batch.set(docRef, {
      ...m,
      id: docRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}

/**
 * Returns active missions for a user.
 */
export async function getActiveMissions(): Promise<Mission[]> {
  const snapshot = await db.collection('missions').where('status', '==', 'active').get();
  const missions: Mission[] = [];
  snapshot.forEach((doc) => {
    missions.push(doc.data() as Mission);
  });
  return missions;
}

/**
 * Retrieves progress documents for a given user.
 */
export async function getUserMissionProgress(userId: string, periodKey?: string): Promise<UserMissionProgress[]> {
  let query: admin.firestore.Query = db.collection('userMissionProgress').where('userId', '==', userId);
  if (periodKey) {
    query = query.where('periodKey', '==', periodKey);
  }
  const snapshot = await query.get();
  const progressList: UserMissionProgress[] = [];
  snapshot.forEach((doc) => {
    progressList.push(doc.data() as UserMissionProgress);
  });
  return progressList;
}

/**
 * Triggers progress tracking for an action type and updates Firestore securely.
 */
export async function incrementMissionProgress(
  userId: string,
  actionType: string,
  amount: number,
  metadata?: any
): Promise<void> {
  // Validate anti-abuse rules
  const validation = await canTrackMissionAction(userId, actionType, metadata);
  if (!validation.allowed) {
    console.log(`[MissionProgress] Denied for user ${userId}, action ${actionType}: ${validation.reason}`);
    return;
  }

  const now = new Date();
  const activeMissions = await getActiveMissions();
  const matchingMissions = activeMissions.filter(
    (m) => m.actionType === actionType && isMissionActive(m, now)
  );

  if (matchingMissions.length === 0) return;

  for (const mission of matchingMissions) {
    const periodKey = getMissionPeriodKey(mission.type, now, mission.eventId);
    const progressId = `${userId}_${mission.id}_${periodKey}`;
    const progressRef = db.collection('userMissionProgress').doc(progressId);

    await db.runTransaction(async (transaction) => {
      const progressDoc = await transaction.get(progressRef);
      let currentProgress = 0;
      let isClaimed = false;
      let isCompleted = false;

      if (progressDoc.exists) {
        const data = progressDoc.data() as UserMissionProgress;
        currentProgress = data.progress;
        isClaimed = data.isClaimed;
        isCompleted = data.isCompleted;
      }

      if (isClaimed) return; // Already finished and claimed

      const newProgress = Math.min(currentProgress + amount, mission.targetValue);
      const newCompleted = newProgress >= mission.targetValue;

      const progressData: Partial<UserMissionProgress> = {
        progress: newProgress,
        isCompleted: newCompleted,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!progressDoc.exists) {
        progressData.id = progressId;
        progressData.userId = userId;
        progressData.missionId = mission.id;
        progressData.missionType = mission.type;
        progressData.actionType = mission.actionType as any;
        progressData.periodKey = periodKey;
        progressData.targetValue = mission.targetValue;
        progressData.isClaimed = false;
        progressData.rewardType = mission.rewardType;
        progressData.rewardAmount = mission.rewardAmount;
        progressData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        
        transaction.set(progressRef, progressData);
      } else {
        transaction.update(progressRef, progressData);
      }

      // If just completed, auto-create a pending reward record
      if (newCompleted && !isCompleted) {
        const rewardRef = db.collection('missionRewards').doc();
        const rewardData: MissionReward = {
          id: rewardRef.id,
          userId,
          missionId: mission.id,
          progressId,
          rewardType: mission.rewardType,
          rewardAmount: mission.rewardAmount,
          status: 'pending',
          description: `Reward for ${mission.title}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        transaction.set(rewardRef, rewardData);

        // Dispatch notification asynchronously
        import('./notificationService')
          .then((ns) => {
            ns.createNotificationAndPush({
              userId,
              type: 'mission_completed',
              channel: 'both',
              title: '¡Misión Completada! 🎯',
              body: `Has completado "${mission.title}". ¡Reclama tu recompensa ya!`,
              actionType: 'open_missions',
            });
          })
          .catch((err) => console.error('Failed to dispatch mission notification:', err));
      }
    });
  }
}

/**
 * Handles claim of a completed mission reward.
 */
export async function claimMissionReward(userId: string, progressId: string): Promise<MissionReward> {
  const progressRef = db.collection('userMissionProgress').doc(progressId);
  
  // Anti-fraud block verification
  const isSuspicious = await blockSuspiciousMissionReward(userId, progressId.split('_')[1]);
  if (isSuspicious) {
    throw new Error('Claim blocked due to suspicious activity');
  }

  let finalReward: MissionReward | null = null;

  await db.runTransaction(async (transaction) => {
    const progressDoc = await transaction.get(progressRef);
    if (!progressDoc.exists) {
      throw new Error('Progress record not found');
    }

    const progress = progressDoc.data() as UserMissionProgress;
    if (progress.userId !== userId) {
      throw new Error('Unauthorized claim');
    }
    if (!progress.isCompleted) {
      throw new Error('Mission is not completed yet');
    }
    if (progress.isClaimed) {
      throw new Error('Reward has already been claimed');
    }

    // Verify target mission properties
    const missionDoc = await transaction.get(db.collection('missions').doc(progress.missionId));
    if (!missionDoc.exists) {
      throw new Error('Mission not found');
    }
    const mission = missionDoc.data() as Mission;

    // Check user roles/VIP properties
    const userDoc = await transaction.get(db.collection('users').doc(userId));
    if (!userDoc.exists) throw new Error('User profile not found');
    const user = userDoc.data()!;

    if (mission.requiresVip && !user.isVip) {
      throw new Error('Requires active VIP membership');
    }
    if (mission.requiresHost && user.role !== 'host') {
      throw new Error('Requires host credentials');
    }

    // Securely credit the reward depending on the type
    if (progress.rewardType === 'xp') {
      // Direct XP credit
      const userRef = db.collection('users').doc(userId);
      const newXp = (user.xp || 0) + progress.rewardAmount;
      // Calculate rank details inline or import calculations
      const level = Math.floor(Math.sqrt(newXp / 100)) + 1; // Simple level calc for fast transaction
      transaction.update(userRef, {
        xp: newXp,
        rankLevel: level,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (progress.rewardType === 'diamonds') {
      // Secure Diamonds wallet transaction credit
      const walletRef = db.collection('wallets').doc(userId);
      const walletDoc = await transaction.get(walletRef);
      if (!walletDoc.exists) throw new Error('Wallet not found');
      
      const wallet = walletDoc.data()!;
      transaction.update(walletRef, {
        diamonds: (wallet.diamonds || 0) + progress.rewardAmount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Write wallet transaction log
      const txRef = db.collection('walletTransactions').doc();
      transaction.set(txRef, {
        id: txRef.id,
        userId,
        type: 'reward',
        currencyType: 'diamonds',
        direction: 'credit',
        amount: progress.rewardAmount,
        description: `Mission reward: ${mission.title}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (progress.rewardType === 'beans') {
      // Beans are restricted rewards, verify if allowed or keep default blocks
      throw new Error('Bean rewards cannot be directly claimed without admin approval');
    } else if (progress.rewardType === 'badge') {
      const userRef = db.collection('users').doc(userId);
      const badges = user.badges || [];
      const newBadge = mission.rewardMetadata?.badgeId || 'rookie_missionary';
      if (!badges.includes(newBadge)) {
        badges.push(newBadge);
        transaction.update(userRef, {
          badges,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else if (progress.rewardType === 'gift_ticket') {
      const userRef = db.collection('users').doc(userId);
      const tickets = user.giftTickets || 0;
      transaction.update(userRef, {
        giftTickets: tickets + progress.rewardAmount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Update progress state
    transaction.update(progressRef, {
      isClaimed: true,
      claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update matching reward document status
    const rewardSnapshot = await db
      .collection('missionRewards')
      .where('progressId', '==', progressId)
      .limit(1)
      .get();

    if (!rewardSnapshot.empty) {
      const rewardDoc = rewardSnapshot.docs[0];
      const rewardRef = db.collection('missionRewards').doc(rewardDoc.id);
      
      const updatedReward = {
        status: 'claimed',
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      transaction.update(rewardRef, updatedReward);
      finalReward = { id: rewardDoc.id, ...rewardDoc.data(), ...updatedReward } as MissionReward;
    } else {
      // Fallback create reward document
      const rewardRef = db.collection('missionRewards').doc();
      const rewardData: MissionReward = {
        id: rewardRef.id,
        userId,
        missionId: mission.id,
        progressId,
        rewardType: progress.rewardType,
        rewardAmount: progress.rewardAmount,
        status: 'claimed',
        description: `Claimed: ${mission.title}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      transaction.set(rewardRef, rewardData);
      finalReward = rewardData;
    }

    // Dispatch notification asynchronously
    import('./notificationService')
      .then((ns) => {
        ns.createNotificationAndPush({
          userId,
          type: 'mission_reward',
          channel: 'both',
          title: 'Recompensa Reclamada 🎉',
          body: `Has reclamado tu recompensa de ${progress.rewardAmount} ${progress.rewardType.toUpperCase()} por completar "${mission.title}".`,
          actionType: 'open_missions',
        });
      })
      .catch((err) => console.error('Failed to send claim push:', err));
  });

  if (!finalReward) {
    throw new Error('Reward process failed');
  }

  return finalReward;
}

/**
 * Reverts a previously claimed reward (Admin moderation).
 */
export async function reverseMissionReward(rewardId: string, adminId: string, reason: string): Promise<void> {
  const rewardRef = db.collection('missionRewards').doc(rewardId);
  
  await db.runTransaction(async (transaction) => {
    const rewardDoc = await transaction.get(rewardRef);
    if (!rewardDoc.exists) throw new Error('Reward record not found');
    const reward = rewardDoc.data() as MissionReward;
    if (reward.status !== 'claimed') throw new Error('Reward is not in claimed state');

    const progressRef = db.collection('userMissionProgress').doc(reward.progressId);
    const userRef = db.collection('users').doc(reward.userId);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error('User not found');
    const user = userDoc.data()!;

    // Subtract credited balance
    if (reward.rewardType === 'xp') {
      const newXp = Math.max((user.xp || 0) - reward.rewardAmount, 0);
      transaction.update(userRef, { xp: newXp });
    } else if (reward.rewardType === 'diamonds') {
      const walletRef = db.collection('wallets').doc(reward.userId);
      const walletDoc = await transaction.get(walletRef);
      if (walletDoc.exists) {
        const wallet = walletDoc.data()!;
        transaction.update(walletRef, {
          diamonds: Math.max((wallet.diamonds || 0) - reward.rewardAmount, 0),
        });
      }
    } else if (reward.rewardType === 'gift_ticket') {
      const tickets = user.giftTickets || 0;
      transaction.update(userRef, { giftTickets: Math.max(tickets - reward.rewardAmount, 0) });
    }

    // Revert state
    transaction.update(rewardRef, {
      status: 'reversed',
      adminNote: `Reverted by ${adminId}. Reason: ${reason}`,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.update(progressRef, {
      isClaimed: false,
      isCompleted: false, // forces them to complete again or locks them out
      progress: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}
