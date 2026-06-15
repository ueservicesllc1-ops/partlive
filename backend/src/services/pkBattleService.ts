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
    durationSeconds: 180,
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
  const endsAt = admin.firestore.Timestamp.fromMillis(Date.now() + 180 * 1000); // 180s duration

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

  return { ...battle, ...updatedBattle, startedAt: new Date(), endsAt: new Date(Date.now() + 180000) };
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
