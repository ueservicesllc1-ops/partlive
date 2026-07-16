import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { PkBattle, PkInvite, PkGiftContribution, PkBattleResult } from '../types/pk';
import { createNotificationAndPush } from './notificationService';

const PK_BATTLES = 'pkBattles';
const PK_INVITES = 'pkInvites';
const PK_GIFT_CONTRIBUTIONS = 'pkGiftContributions';
const LIVES = 'lives';
const USERS = 'users';

// Helpers
async function getActiveLiveForHost(hostId: string): Promise<any> {
  const snap = await db.collection(LIVES)
    .where('hostId', '==', hostId)
    .where('status', '==', 'live')
    .limit(1)
    .get();
  
  if (snap.empty) return null;
  return snap.docs[0].data();
}

export const inviteHostToPk = async (
  fromHostId: string,
  toHostId: string,
  fromLiveId: string,
  message?: string
): Promise<PkInvite> => {
  if (fromHostId === toHostId) throw new Error('No puedes invitarte a ti mismo.');

  // Validate fromHost profile & live
  const fromHostDoc = await db.collection(USERS).doc(fromHostId).get();
  if (!fromHostDoc.exists) throw new Error('Host emisor no encontrado.');
  const fromHostData = fromHostDoc.data()!;
  
  if (fromHostData.status === 'suspended' || fromHostData.status === 'banned') {
    throw new Error('Tu cuenta está suspendida o baneada y no puedes iniciar PK.');
  }

  // Validate toHost profile & live
  const toHostDoc = await db.collection(USERS).doc(toHostId).get();
  if (!toHostDoc.exists) throw new Error('Host receptor no encontrado.');
  const toHostData = toHostDoc.data()!;
  if (toHostData.status === 'suspended' || toHostData.status === 'banned') {
    throw new Error('El host receptor se encuentra suspendido o baneado.');
  }

  // Validate active lives
  const fromLive = await getActiveLiveForHost(fromHostId);
  if (!fromLive || fromLive.id !== fromLiveId) throw new Error('Tu transmisión no está activa.');
  if (fromLive.isInPkBattle) throw new Error('Ya estás en una batalla PK activa.');

  const toLive = await getActiveLiveForHost(toHostId);
  if (!toLive) throw new Error('El host receptor no está transmitiendo en vivo.');
  if (toLive.isInPkBattle) throw new Error('El host receptor ya se encuentra en una batalla PK activa.');

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 60 * 1000); // 60s expiration

  const battleRef = db.collection(PK_BATTLES).doc();
  const inviteRef = db.collection(PK_INVITES).doc();

  const newBattle: PkBattle = {
    id: battleRef.id,
    hostAId: fromHostId,
    hostBId: toHostId,
    hostALiveId: fromLiveId,
    hostAName: fromHostData.displayName || fromHostData.username || 'Host A',
    hostBName: toHostData.displayName || toHostData.username || 'Host B',
    hostAPhotoURL: fromHostData.photoURL || '',
    hostBPhotoURL: toHostData.photoURL || '',
    status: 'invited',
    durationSeconds: 300,
    hostAScore: 0,
    hostBScore: 0,
    hostADiamonds: 0,
    hostBDiamonds: 0,
    hostAGiftsCount: 0,
    hostBGiftsCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const newInvite: PkInvite = {
    id: inviteRef.id,
    pkBattleId: battleRef.id,
    fromHostId,
    toHostId,
    fromLiveId,
    status: 'pending',
    message: message || '¿Duelo PK 1vs1?',
    expiresAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const batch = db.batch();
  batch.set(battleRef, newBattle);
  batch.set(inviteRef, newInvite);
  await batch.commit();

  // Notify recipient host
  await createNotificationAndPush({
    userId: toHostId,
    type: 'pk_invite',
    channel: 'both',
    title: '🏆 Desafío PK Recibido',
    body: `${newBattle.hostAName} te ha invitado a un duelo PK 1vs1.`,
    actionType: 'open_live',
    actionValue: toLive.id,
  });

  return { ...newInvite, expiresAt: new Date(Date.now() + 60000), createdAt: new Date(), updatedAt: new Date() };
};

export const acceptPkInvite = async (
  toHostId: string,
  inviteId: string,
  toLiveId: string
): Promise<PkBattle> => {
  const inviteRef = db.collection(PK_INVITES).doc(inviteId);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) throw new Error('Invitación no encontrada.');
  const invite = inviteSnap.data() as PkInvite;

  if (invite.toHostId !== toHostId) throw new Error('Acción no autorizada.');
  if (invite.status !== 'pending') throw new Error('Esta invitación ya fue respondida o expiró.');

  const nowMs = Date.now();
  const expMs = invite.expiresAt ? (invite.expiresAt.toMillis ? invite.expiresAt.toMillis() : new Date(invite.expiresAt).getTime()) : 0;
  if (nowMs > expMs) {
    await inviteRef.update({ status: 'expired', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    throw new Error('La invitación ha expirado.');
  }

  const battleRef = db.collection(PK_BATTLES).doc(invite.pkBattleId);
  const battleSnap = await battleRef.get();
  if (!battleSnap.exists) throw new Error('Batalla PK asociada no encontrada.');
  const battle = battleSnap.data() as PkBattle;

  // Confirm target lives are still active and not in a PK battle
  const hostALiveSnap = await db.collection(LIVES).doc(invite.fromLiveId).get();
  const hostBLiveSnap = await db.collection(LIVES).doc(toLiveId).get();

  if (!hostALiveSnap.exists || hostALiveSnap.data()!.status !== 'live') {
    throw new Error('La transmisión del anfitrión desafiante ya no está activa.');
  }
  if (!hostBLiveSnap.exists || hostBLiveSnap.data()!.status !== 'live') {
    throw new Error('Tu transmisión ya no está activa.');
  }

  const hostALive = hostALiveSnap.data()!;
  const hostBLive = hostBLiveSnap.data()!;

  if (hostALive.isInPkBattle || hostBLive.isInPkBattle) {
    throw new Error('Uno de los anfitriones ya se encuentra en otra batalla PK.');
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const startedAt = timestamp;
  const endsAt = admin.firestore.Timestamp.fromMillis(Date.now() + 300 * 1000); // 300s duration

  const updatedBattle: Partial<PkBattle> = {
    status: 'active',
    hostBLiveId: toLiveId,
    startedAt,
    endsAt,
    updatedAt: timestamp,
  };

  const batch = db.batch();
  batch.update(inviteRef, {
    status: 'accepted',
    toLiveId,
    respondedAt: timestamp,
    updatedAt: timestamp,
  });

  batch.update(battleRef, updatedBattle);

  // Update Lives state
  batch.update(hostALiveSnap.ref, {
    activePkBattleId: battle.id,
    isInPkBattle: true,
    pkOpponentHostId: toHostId,
    pkOpponentLiveId: toLiveId,
    updatedAt: timestamp,
  });

  batch.update(hostBLiveSnap.ref, {
    activePkBattleId: battle.id,
    isInPkBattle: true,
    pkOpponentHostId: invite.fromHostId,
    pkOpponentLiveId: invite.fromLiveId,
    updatedAt: timestamp,
  });

  await batch.commit();

  // Notify challenger
  await createNotificationAndPush({
    userId: invite.fromHostId,
    type: 'pk_update',
    channel: 'both',
    title: '🏆 PK Aceptada',
    body: `${battle.hostBName} aceptó tu desafío. ¡Que comience el duelo!`,
    actionType: 'open_live',
    actionValue: invite.fromLiveId,
  });

  return { ...battle, ...updatedBattle, startedAt: new Date(), endsAt: new Date(Date.now() + 300000) };
};

export const rejectPkInvite = async (
  toHostId: string,
  inviteId: string,
  reason?: string
): Promise<void> => {
  const inviteRef = db.collection(PK_INVITES).doc(inviteId);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) throw new Error('Invitación no encontrada.');
  const invite = inviteSnap.data() as PkInvite;

  if (invite.toHostId !== toHostId) throw new Error('Acción no autorizada.');
  if (invite.status !== 'pending') throw new Error('Invitación no disponible para rechazar.');

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  batch.update(inviteRef, {
    status: 'rejected',
    respondedAt: timestamp,
    updatedAt: timestamp,
  });

  batch.update(db.collection(PK_BATTLES).doc(invite.pkBattleId), {
    status: 'rejected',
    updatedAt: timestamp,
  });

  await batch.commit();

  // Notify sender
  await createNotificationAndPush({
    userId: invite.fromHostId,
    type: 'pk_update',
    channel: 'in_app',
    title: '❌ Desafío PK Rechazado',
    body: `Tu invitación fue rechazada. Razón: ${reason || 'Ninguna'}`,
    actionType: 'open_live',
    actionValue: invite.fromLiveId,
  });
};

export const cancelPkInvite = async (
  fromHostId: string,
  inviteId: string
): Promise<void> => {
  const inviteRef = db.collection(PK_INVITES).doc(inviteId);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) throw new Error('Invitación no encontrada.');
  const invite = inviteSnap.data() as PkInvite;

  if (invite.fromHostId !== fromHostId) throw new Error('Acción no autorizada.');
  if (invite.status !== 'pending') throw new Error('Invitación no disponible para cancelar.');

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  batch.update(inviteRef, {
    status: 'cancelled',
    updatedAt: timestamp,
  });

  batch.update(db.collection(PK_BATTLES).doc(invite.pkBattleId), {
    status: 'cancelled',
    updatedAt: timestamp,
  });

  await batch.commit();
};

export const updatePkScores = async (
  pkBattleId: string,
  receiverHostId: string,
  diamonds: number,
  beansGenerated: number,
  giftEventId: string,
  senderId: string,
  giftId: string,
  giftName: string
): Promise<void> => {
  const battleRef = db.collection(PK_BATTLES).doc(pkBattleId);
  const battleSnap = await battleRef.get();
  if (!battleSnap.exists) return;
  const battle = battleSnap.data() as PkBattle;

  if (battle.status !== 'active') return;

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const contributionRef = db.collection(PK_GIFT_CONTRIBUTIONS).doc();

  const contribution: PkGiftContribution = {
    id: contributionRef.id,
    pkBattleId,
    giftEventId,
    senderId,
    receiverHostId,
    giftId,
    giftName,
    diamonds,
    beansGenerated,
    createdAt: timestamp,
  };

  const isHostA = battle.hostAId === receiverHostId;

  await db.runTransaction(async (transaction) => {
    transaction.set(contributionRef, contribution);
    if (isHostA) {
      transaction.update(battleRef, {
        hostAScore: admin.firestore.FieldValue.increment(diamonds),
        hostADiamonds: admin.firestore.FieldValue.increment(diamonds),
        hostAGiftsCount: admin.firestore.FieldValue.increment(1),
        updatedAt: timestamp,
      });
    } else {
      transaction.update(battleRef, {
        hostBScore: admin.firestore.FieldValue.increment(diamonds),
        hostBDiamonds: admin.firestore.FieldValue.increment(diamonds),
        hostBGiftsCount: admin.firestore.FieldValue.increment(1),
        updatedAt: timestamp,
      });
    }
  });
};

export const finishPkBattle = async (
  pkBattleId: string,
  reason?: string
): Promise<PkBattle> => {
  const battleRef = db.collection(PK_BATTLES).doc(pkBattleId);
  const battleSnap = await battleRef.get();
  if (!battleSnap.exists) throw new Error('Batalla PK no encontrada.');
  const battle = battleSnap.data() as PkBattle;

  if (battle.status !== 'active') {
    return battle;
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  // Determine winner
  let winnerId: string | undefined;
  let result: PkBattleResult = 'draw';

  if (battle.hostAScore > battle.hostBScore) {
    winnerId = battle.hostAId;
    result = 'hostA_win';
  } else if (battle.hostBScore > battle.hostAScore) {
    winnerId = battle.hostBId;
    result = 'hostB_win';
  }

  const batch = db.batch();

  batch.update(battleRef, {
    status: 'finished',
    winnerId: winnerId || null,
    result,
    finishedAt: timestamp,
    updatedAt: timestamp,
  });

  // Clear live flags
  if (battle.hostALiveId) {
    batch.update(db.collection(LIVES).doc(battle.hostALiveId), {
      activePkBattleId: admin.firestore.FieldValue.delete(),
      isInPkBattle: false,
      pkOpponentHostId: admin.firestore.FieldValue.delete(),
      pkOpponentLiveId: admin.firestore.FieldValue.delete(),
      updatedAt: timestamp,
    });
  }

  if (battle.hostBLiveId) {
    batch.update(db.collection(LIVES).doc(battle.hostBLiveId), {
      activePkBattleId: admin.firestore.FieldValue.delete(),
      isInPkBattle: false,
      pkOpponentHostId: admin.firestore.FieldValue.delete(),
      pkOpponentLiveId: admin.firestore.FieldValue.delete(),
      updatedAt: timestamp,
    });
  }

  // Update Host Statistics
  const statsARef = db.collection('hostStats').doc(battle.hostAId);
  const statsBRef = db.collection('hostStats').doc(battle.hostBId);

  const wonA = result === 'hostA_win';
  const wonB = result === 'hostB_win';
  const draw = result === 'draw';

  batch.set(statsARef, {
    pkBattlesCount: admin.firestore.FieldValue.increment(1),
    pkWinsCount: admin.firestore.FieldValue.increment(wonA ? 1 : 0),
    pkLossesCount: admin.firestore.FieldValue.increment(wonB ? 1 : 0),
    pkDrawsCount: admin.firestore.FieldValue.increment(draw ? 1 : 0),
    pkDiamondsReceived: admin.firestore.FieldValue.increment(battle.hostADiamonds),
    updatedAt: timestamp,
  }, { merge: true });

  batch.set(statsBRef, {
    pkBattlesCount: admin.firestore.FieldValue.increment(1),
    pkWinsCount: admin.firestore.FieldValue.increment(wonB ? 1 : 0),
    pkLossesCount: admin.firestore.FieldValue.increment(wonA ? 1 : 0),
    pkDrawsCount: admin.firestore.FieldValue.increment(draw ? 1 : 0),
    pkDiamondsReceived: admin.firestore.FieldValue.increment(battle.hostBDiamonds),
    updatedAt: timestamp,
  }, { merge: true });

  // 1. Fetch contributions to find top MVPs for Host A and Host B
  const contributionsSnap = await db.collection(PK_GIFT_CONTRIBUTIONS)
    .where('pkBattleId', '==', pkBattleId)
    .get();

  const contribsA: Record<string, number> = {};
  const contribsB: Record<string, number> = {};

  contributionsSnap.forEach(doc => {
    const data = doc.data();
    const senderId = data.senderId;
    const receiverHostId = data.receiverHostId;
    const diamonds = data.diamonds || 0;

    if (receiverHostId === battle.hostAId) {
      contribsA[senderId] = (contribsA[senderId] || 0) + diamonds;
    } else if (receiverHostId === battle.hostBId) {
      contribsB[senderId] = (contribsB[senderId] || 0) + diamonds;
    }
  });

  let mvpAId: string | null = null;
  let maxDiamondsA = 0;
  for (const [senderId, diamonds] of Object.entries(contribsA)) {
    if (diamonds > maxDiamondsA) {
      maxDiamondsA = diamonds;
      mvpAId = senderId;
    }
  }

  let mvpBId: string | null = null;
  let maxDiamondsB = 0;
  for (const [senderId, diamonds] of Object.entries(contribsB)) {
    if (diamonds > maxDiamondsB) {
      maxDiamondsB = diamonds;
      mvpBId = senderId;
    }
  }

  // 2. Fetch current wallet balances to prepare batched balance updates
  const hostAWalletRef = db.collection('wallets').doc(battle.hostAId);
  const hostBWalletRef = db.collection('wallets').doc(battle.hostBId);
  const mvpAWalletRef = mvpAId ? db.collection('wallets').doc(mvpAId) : null;
  const mvpBWalletRef = mvpBId ? db.collection('wallets').doc(mvpBId) : null;

  const hostAWalletSnap = await hostAWalletRef.get();
  const hostBWalletSnap = await hostBWalletRef.get();
  
  const mvpAWalletSnap = mvpAId && mvpAWalletRef ? await mvpAWalletRef.get() : null;
  const mvpBWalletSnap = mvpBId && mvpBWalletRef ? await mvpBWalletRef.get() : null;

  const hostAUserRef = db.collection('users').doc(battle.hostAId);
  const hostBUserRef = db.collection('users').doc(battle.hostBId);
  const mvpAUserRef = mvpAId ? db.collection('users').doc(mvpAId) : null;
  const mvpBUserRef = mvpBId ? db.collection('users').doc(mvpBId) : null;

  // 3. Process Host A (50% beans) and MVP A (10% diamonds)
  const hostADiamonds = battle.hostADiamonds || 0;
  if (hostADiamonds > 0) {
    const hostABeansEarned = Math.floor(hostADiamonds * 0.50);
    const wA = hostAWalletSnap.exists ? hostAWalletSnap.data()! : { beans: 0, lifetimeBeansEarned: 0 };
    const newBeansA = (wA.beans || 0) + hostABeansEarned;
    const newLifetimeA = (wA.lifetimeBeansEarned || 0) + hostABeansEarned;

    batch.set(hostAWalletRef, {
      userId: battle.hostAId,
      beans: newBeansA,
      lifetimeBeansEarned: newLifetimeA,
      status: 'active',
      updatedAt: timestamp,
    }, { merge: true });

    batch.update(hostAUserRef, {
      beans: newBeansA,
      updatedAt: timestamp,
    });

    const hostATxRef = db.collection('walletTransactions').doc();
    batch.set(hostATxRef, {
      id: hostATxRef.id,
      userId: battle.hostAId,
      type: 'beans_earned',
      direction: 'credit',
      currencyType: 'beans',
      amount: hostABeansEarned,
      balanceAfter: newBeansA,
      status: 'completed',
      description: `Comisión PK Battle (50% de ${hostADiamonds} diamantes)`,
      relatedLiveId: battle.hostALiveId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (mvpAId && mvpAWalletRef && mvpAUserRef) {
      const mvpADiamondsReward = Math.floor(hostADiamonds * 0.10);
      if (mvpADiamondsReward > 0) {
        const wMvpA = mvpAWalletSnap && mvpAWalletSnap.exists ? mvpAWalletSnap.data()! : { diamonds: 0 };
        const newDiamondsMvpA = (wMvpA.diamonds || 0) + mvpADiamondsReward;

        batch.set(mvpAWalletRef, {
          userId: mvpAId,
          diamonds: newDiamondsMvpA,
          status: 'active',
          updatedAt: timestamp,
        }, { merge: true });

        batch.update(mvpAUserRef, {
          diamonds: newDiamondsMvpA,
          updatedAt: timestamp,
        });

        const mvpATxRef = db.collection('walletTransactions').doc();
        batch.set(mvpATxRef, {
          id: mvpATxRef.id,
          userId: mvpAId,
          type: 'reward',
          direction: 'credit',
          currencyType: 'diamonds',
          amount: mvpADiamondsReward,
          balanceAfter: newDiamondsMvpA,
          status: 'completed',
          description: `Recompensa MVP PK Battle (10% de ${hostADiamonds} diamantes)`,
          relatedLiveId: battle.hostALiveId,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        // Send message to live chat announcing MVP
        try {
          const { sendLiveSystemMessage } = await import('./liveMessagesService');
          if (battle.hostALiveId) {
            await sendLiveSystemMessage(
              battle.hostALiveId,
              `👑 ¡Felicitaciones al MVP de ${battle.hostAName}! Se lleva el 10% (${mvpADiamondsReward} diamantes) de recompensa.`
            );
          }
        } catch (err) {
          console.error('Failed to notify MVP A in chat:', err);
        }
      }
    }
  }

  // 4. Process Host B (50% beans) and MVP B (10% diamonds)
  const hostBDiamonds = battle.hostBDiamonds || 0;
  if (hostBDiamonds > 0) {
    const hostBBeansEarned = Math.floor(hostBDiamonds * 0.50);
    const wB = hostBWalletSnap.exists ? hostBWalletSnap.data()! : { beans: 0, lifetimeBeansEarned: 0 };
    const newBeansB = (wB.beans || 0) + hostBBeansEarned;
    const newLifetimeB = (wB.lifetimeBeansEarned || 0) + hostBBeansEarned;

    batch.set(hostBWalletRef, {
      userId: battle.hostBId,
      beans: newBeansB,
      lifetimeBeansEarned: newLifetimeB,
      status: 'active',
      updatedAt: timestamp,
    }, { merge: true });

    batch.update(hostBUserRef, {
      beans: newBeansB,
      updatedAt: timestamp,
    });

    const hostBTxRef = db.collection('walletTransactions').doc();
    batch.set(hostBTxRef, {
      id: hostBTxRef.id,
      userId: battle.hostBId,
      type: 'beans_earned',
      direction: 'credit',
      currencyType: 'beans',
      amount: hostBBeansEarned,
      balanceAfter: newBeansB,
      status: 'completed',
      description: `Comisión PK Battle (50% de ${hostBDiamonds} diamantes)`,
      relatedLiveId: battle.hostBLiveId || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (mvpBId && mvpBWalletRef && mvpBUserRef) {
      const mvpBDiamondsReward = Math.floor(hostBDiamonds * 0.10);
      if (mvpBDiamondsReward > 0) {
        const wMvpB = mvpBWalletSnap && mvpBWalletSnap.exists ? mvpBWalletSnap.data()! : { diamonds: 0 };
        const newDiamondsMvpB = (wMvpB.diamonds || 0) + mvpBDiamondsReward;

        batch.set(mvpBWalletRef, {
          userId: mvpBId,
          diamonds: newDiamondsMvpB,
          status: 'active',
          updatedAt: timestamp,
        }, { merge: true });

        batch.update(mvpBUserRef, {
          diamonds: newDiamondsMvpB,
          updatedAt: timestamp,
        });

        const mvpBTxRef = db.collection('walletTransactions').doc();
        batch.set(mvpBTxRef, {
          id: mvpBTxRef.id,
          userId: mvpBId,
          type: 'reward',
          direction: 'credit',
          currencyType: 'diamonds',
          amount: mvpBDiamondsReward,
          balanceAfter: newDiamondsMvpB,
          status: 'completed',
          description: `Recompensa MVP PK Battle (10% de ${hostBDiamonds} diamantes)`,
          relatedLiveId: battle.hostBLiveId || null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        // Send message to live chat announcing MVP
        try {
          const { sendLiveSystemMessage } = await import('./liveMessagesService');
          if (battle.hostBLiveId) {
            await sendLiveSystemMessage(
              battle.hostBLiveId,
              `👑 ¡Felicitaciones al MVP de ${battle.hostBName}! Se lleva el 10% (${mvpBDiamondsReward} diamantes) de recompensa.`
            );
          }
        } catch (err) {
          console.error('Failed to notify MVP B in chat:', err);
        }
      }
    }
  }

  await batch.commit();

  // Notify hosts
  const pushMsg = result === 'draw' ? '¡El duelo PK terminó en empate!' : winnerId === battle.hostAId ? `¡${battle.hostAName} ganó el duelo PK!` : `¡${battle.hostBName} ganó el duelo PK!`;

  await createNotificationAndPush({
    userId: battle.hostAId,
    type: 'pk_update',
    channel: 'both',
    title: '🏆 PK Finalizado',
    body: pushMsg,
    actionType: 'open_live',
    actionValue: battle.hostALiveId,
  });

  await createNotificationAndPush({
    userId: battle.hostBId,
    type: 'pk_update',
    channel: 'both',
    title: '🏆 PK Finalizado',
    body: pushMsg,
    actionType: 'open_live',
    actionValue: battle.hostBLiveId || '',
  });

  // Track achievements & missions safely in background
  try {
    const { incrementMissionProgress } = await import('./missionService');
    await incrementMissionProgress(battle.hostAId, 'pk_battle_played', 1);
    await incrementMissionProgress(battle.hostBId, 'pk_battle_played', 1);
    if (wonA) await incrementMissionProgress(battle.hostAId, 'pk_battle_won', 1);
    if (wonB) await incrementMissionProgress(battle.hostBId, 'pk_battle_won', 1);
  } catch (err) {
    console.error('Failed to update PK missions:', err);
  }

  return { ...battle, status: 'finished', winnerId, result };
};

export const cancelPkBattle = async (
  actorId: string,
  pkBattleId: string,
  reason?: string
): Promise<void> => {
  const battleRef = db.collection(PK_BATTLES).doc(pkBattleId);
  const battleSnap = await battleRef.get();
  if (!battleSnap.exists) throw new Error('Batalla PK no encontrada.');
  const battle = battleSnap.data() as PkBattle;

  // Only participants or admins can cancel
  const actorDoc = await db.collection(USERS).doc(actorId).get();
  const isAdmin = actorDoc.exists && actorDoc.data()!.role === 'admin';
  const isParticipant = battle.hostAId === actorId || battle.hostBId === actorId;

  if (!isAdmin && !isParticipant) {
    throw new Error('No tienes permisos para cancelar esta batalla.');
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  batch.update(battleRef, {
    status: 'cancelled',
    result: 'cancelled',
    finishedAt: timestamp,
    updatedAt: timestamp,
  });

  // Clear live flags
  if (battle.hostALiveId) {
    batch.update(db.collection(LIVES).doc(battle.hostALiveId), {
      activePkBattleId: admin.firestore.FieldValue.delete(),
      isInPkBattle: false,
      pkOpponentHostId: admin.firestore.FieldValue.delete(),
      pkOpponentLiveId: admin.firestore.FieldValue.delete(),
      updatedAt: timestamp,
    });
  }

  if (battle.hostBLiveId) {
    batch.update(db.collection(LIVES).doc(battle.hostBLiveId), {
      activePkBattleId: admin.firestore.FieldValue.delete(),
      isInPkBattle: false,
      pkOpponentHostId: admin.firestore.FieldValue.delete(),
      pkOpponentLiveId: admin.firestore.FieldValue.delete(),
      updatedAt: timestamp,
    });
  }

  await batch.commit();
};

export const getActivePkBattleByLive = async (liveId: string): Promise<PkBattle | null> => {
  const snap = await db.collection(PK_BATTLES)
    .where('status', '==', 'active')
    .get();

  const battle = snap.docs.find(doc => {
    const data = doc.data();
    return data.hostALiveId === liveId || data.hostBLiveId === liveId;
  });

  return battle ? (battle.data() as PkBattle) : null;
};

export const getHostPkHistory = async (hostId: string, limitCount = 20): Promise<PkBattle[]> => {
  const snapA = await db.collection(PK_BATTLES)
    .where('hostAId', '==', hostId)
    .where('status', '==', 'finished')
    .orderBy('finishedAt', 'desc')
    .limit(limitCount)
    .get();

  const snapB = await db.collection(PK_BATTLES)
    .where('hostBId', '==', hostId)
    .where('status', '==', 'finished')
    .orderBy('finishedAt', 'desc')
    .limit(limitCount)
    .get();

  const list = [...snapA.docs, ...snapB.docs].map(doc => doc.data() as PkBattle);
  return list.sort((x, y) => {
    const tX = x.finishedAt?.toMillis ? x.finishedAt.toMillis() : new Date(x.finishedAt).getTime();
    const tY = y.finishedAt?.toMillis ? y.finishedAt.toMillis() : new Date(y.finishedAt).getTime();
    return tY - tX;
  }).slice(0, limitCount);
};

export const expireOldPkInvites = async (): Promise<void> => {
  const now = admin.firestore.Timestamp.now();
  const snap = await db.collection(PK_INVITES)
    .where('status', '==', 'pending')
    .where('expiresAt', '<', now)
    .get();

  if (snap.empty) return;

  const batch = db.batch();
  snap.forEach(doc => {
    batch.update(doc.ref, {
      status: 'expired',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const data = doc.data();
    batch.update(db.collection(PK_BATTLES).doc(data.pkBattleId), {
      status: 'expired',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
};

export const rollPkDice = async (
  pkBattleId: string,
  hostId: string
): Promise<PkBattle> => {
  const battleRef = db.collection(PK_BATTLES).doc(pkBattleId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const battleSnap = await battleRef.get();
  if (!battleSnap.exists) throw new Error('Batalla PK no encontrada.');
  const battle = battleSnap.data() as PkBattle;

  if (battle.status !== 'active') throw new Error('La batalla PK no está activa.');

  const isHostA = battle.hostAId === hostId;
  const isHostB = battle.hostBId === hostId;
  if (!isHostA && !isHostB) throw new Error('No eres participante de esta batalla.');

  const diceAvailable = isHostA ? battle.hostADiceAvailable : battle.hostBDiceAvailable;
  if (!diceAvailable) throw new Error('No tienes un dado disponible para lanzar.');

  const powers: ('steal_100' | 'double_points' | 'block_gifts' | 'reset_power' | 'shield')[] = [
    'steal_100',
    'double_points',
    'block_gifts',
    'reset_power',
    'shield'
  ];
  const rolledPower = powers[Math.floor(Math.random() * powers.length)];

  const updates: any = {
    updatedAt: timestamp,
  };

  if (isHostA) {
    updates.hostADiceAvailable = false;
  } else {
    updates.hostBDiceAvailable = false;
  }

  let chatMsg = '';
  const hostName = isHostA ? battle.hostAName : battle.hostBName;
  const opponentName = isHostA ? battle.hostBName : battle.hostAName;

  const opponentShield = isHostA ? battle.hostBActivePower === 'shield' : battle.hostAActivePower === 'shield';
  const opponentShieldExpiry = isHostA ? battle.hostBPowerExpiry : battle.hostAPowerExpiry;
  
  let shieldActive = false;
  if (opponentShield && opponentShieldExpiry) {
    const expiryMs = opponentShieldExpiry.toMillis ? opponentShieldExpiry.toMillis() : new Date(opponentShieldExpiry).getTime();
    if (Date.now() < expiryMs) {
      shieldActive = true;
    }
  }

  if (rolledPower === 'steal_100') {
    if (shieldActive) {
      chatMsg = `🛡️ ¡${opponentName} usó su ESCUDO para bloquear el robo de 100 diamantes de ${hostName}!`;
      if (isHostA) {
        updates.hostBActivePower = null;
        updates.hostBPowerExpiry = null;
      } else {
        updates.hostAActivePower = null;
        updates.hostAPowerExpiry = null;
      }
    } else {
      const opponentScoreField = isHostA ? 'hostBScore' : 'hostAScore';
      const hostScoreField = isHostA ? 'hostAScore' : 'hostBScore';
      const opponentScore = isHostA ? (battle.hostBScore || 0) : (battle.hostAScore || 0);
      const stealAmount = Math.min(100, opponentScore);
      
      updates[opponentScoreField] = admin.firestore.FieldValue.increment(-stealAmount);
      updates[hostScoreField] = admin.firestore.FieldValue.increment(stealAmount);
      chatMsg = `⚡ ¡${hostName} lanzó el DADO ❓ y obtuvo ROBO! Robó ${stealAmount} diamantes a ${opponentName}.`;
    }
  } else if (rolledPower === 'reset_power') {
    if (shieldActive) {
      chatMsg = `🛡️ ¡${opponentName} usó su ESCUDO para bloquear el reseteo de poder de ${hostName}!`;
      if (isHostA) {
        updates.hostBActivePower = null;
        updates.hostBPowerExpiry = null;
      } else {
        updates.hostAActivePower = null;
        updates.hostAPowerExpiry = null;
      }
    } else {
      const opponentPowerField = isHostA ? 'hostBPowerBar' : 'hostAPowerBar';
      updates[opponentPowerField] = 0;
      chatMsg = `💥 ¡${hostName} lanzó el DADO ❓ y obtuvo RESET! Redujo la barra de poder de ${opponentName} a cero.`;
    }
  } else if (rolledPower === 'double_points') {
    const expiry = admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 1000); // 30 seconds
    if (isHostA) {
      updates.hostAActivePower = 'double_points';
      updates.hostAPowerExpiry = expiry;
    } else {
      updates.hostBActivePower = 'double_points';
      updates.hostBPowerExpiry = expiry;
    }
    chatMsg = `🔥 ¡${hostName} lanzó el DADO ❓ y obtuvo DOBLE PUNTOS (2x) por 30 segundos!`;
  } else if (rolledPower === 'block_gifts') {
    const expiry = admin.firestore.Timestamp.fromMillis(Date.now() + 15 * 1000); // 15 seconds
    if (isHostA) {
      updates.hostAActivePower = 'block_gifts';
      updates.hostAPowerExpiry = expiry;
    } else {
      updates.hostBActivePower = 'block_gifts';
      updates.hostBPowerExpiry = expiry;
    }
    chatMsg = `❄️ ¡${hostName} lanzó el DADO ❓ y obtuvo BLOQUEO! Congeló al oponente ${opponentName} por 15 segundos.`;
  } else if (rolledPower === 'shield') {
    const expiry = admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 1000); // 30 seconds
    if (isHostA) {
      updates.hostAActivePower = 'shield';
      updates.hostAPowerExpiry = expiry;
    } else {
      updates.hostBActivePower = 'shield';
      updates.hostBPowerExpiry = expiry;
    }
    chatMsg = `🛡️ ¡${hostName} lanzó el DADO ❓ y obtuvo un ESCUDO protector por 30 segundos!`;
  }

  await battleRef.update(updates);

  try {
    const { sendLiveSystemMessage } = await import('./liveMessagesService');
    if (battle.hostALiveId) {
      await sendLiveSystemMessage(battle.hostALiveId, chatMsg);
    }
    if (battle.hostBLiveId) {
      await sendLiveSystemMessage(battle.hostBLiveId, chatMsg);
    }
  } catch (err) {
    console.error('Failed to send PK dice roll system chat message:', err);
  }

  const freshSnap = await battleRef.get();
  return { id: freshSnap.id, ...freshSnap.data() } as PkBattle;
};
