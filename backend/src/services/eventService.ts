import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { SpecialEvent, EventParticipant, EventReward, SpecialEventType } from '../types/event';
import { createNotificationAndPush } from './notificationService';

const EVENTS_COLLECTION = 'specialEvents';
const PARTICIPANTS_COLLECTION = 'eventParticipants';
const REWARDS_COLLECTION = 'eventRewards';

/**
 * Get active events, optionally filtered.
 */
export async function getActiveEvents(filters?: { type?: string; target?: string }): Promise<SpecialEvent[]> {
  let query: admin.firestore.Query = db.collection(EVENTS_COLLECTION).where('isActive', '==', true);

  if (filters?.type) {
    query = query.where('type', '==', filters.type);
  }
  if (filters?.target) {
    query = query.where('target', '==', filters.target);
  }

  const snap = await query.get();
  const list: SpecialEvent[] = [];
  
  snap.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as SpecialEvent);
  });

  return list;
}

/**
 * Retrieve a special event by ID.
 */
export async function getEventById(eventId: string): Promise<SpecialEvent | null> {
  const doc = await db.collection(EVENTS_COLLECTION).doc(eventId).get();
  return doc.exists ? ({ id: doc.id, ...doc.data() } as SpecialEvent) : null;
}

/**
 * Create a new event (Admin only).
 */
export async function createEvent(adminId: string, data: Omit<SpecialEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<SpecialEvent> {
  const docRef = db.collection(EVENTS_COLLECTION).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const newEvent: SpecialEvent = {
    ...data,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(newEvent);
  return { ...newEvent, createdAt: new Date(), updatedAt: new Date() };
}

/**
 * Update event data (Admin only).
 */
export async function updateEvent(eventId: string, adminId: string, data: Partial<SpecialEvent>): Promise<SpecialEvent> {
  const ref = db.collection(EVENTS_COLLECTION).doc(eventId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await ref.update({
    ...data,
    updatedAt: now,
  });

  const updated = await ref.get();
  return { id: updated.id, ...updated.data() } as SpecialEvent;
}

/**
 * Activate event and notify target users/hosts.
 */
export async function activateEvent(eventId: string, adminId: string): Promise<void> {
  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found.');

  await db.collection(EVENTS_COLLECTION).doc(eventId).update({
    status: 'active',
    isActive: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify target group
  try {
    const notifyType = 'event_started';
    const body = event.subtitle || 'Un nuevo evento especial ha comenzado. ¡Entra y participa!';
    
    // Broadcast push
    await createNotificationAndPush({
      userId: 'global_broadcast', // special handler identifier or handle individually
      type: notifyType,
      channel: 'both',
      title: event.title,
      body: body,
      actionType: 'open_event',
      actionValue: eventId,
    });
  } catch (err) {
    console.error('Failed to notify event start:', err);
  }
}

/**
 * Cancel an active event.
 */
export async function cancelEvent(eventId: string, adminId: string, reason?: string): Promise<void> {
  await db.collection(EVENTS_COLLECTION).doc(eventId).update({
    status: 'cancelled',
    isActive: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * End event and generate final reward allocations.
 */
export async function endEvent(eventId: string, adminId: string): Promise<void> {
  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found.');

  await db.runTransaction(async (transaction) => {
    transaction.update(db.collection(EVENTS_COLLECTION).doc(eventId), {
      status: 'ended',
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  // Automatically recalculate and trigger manual or automatic rewards for top 3 participants if config exists
  await recalculateEventRanking(eventId);
}

/**
 * Join event as a user, host, room, or agency.
 */
export async function joinEvent(
  eventId: string,
  participantData: {
    userId?: string;
    hostId?: string;
    roomId?: string;
    liveId?: string;
    agencyId?: string;
    displayName: string;
    username?: string;
    photoURL?: string;
  }
): Promise<EventParticipant> {
  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found.');
  if (event.status !== 'active') throw new Error('Event is not active.');

  const entityId = participantData.userId || participantData.hostId || participantData.roomId || participantData.agencyId;
  if (!entityId) throw new Error('Must provide a valid participant entity (userId, hostId, roomId, or agencyId).');

  const participantId = `${eventId}_${entityId}`;
  const participantRef = db.collection(PARTICIPANTS_COLLECTION).doc(participantId);

  const doc = await participantRef.get();
  if (doc.exists) {
    return doc.data() as EventParticipant;
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const participant: EventParticipant = {
    id: participantId,
    eventId,
    ...participantData,
    score: 0,
    progressValue: 0,
    rewardClaimed: false,
    rewardStatus: 'none',
    joinedAt: now,
    updatedAt: now,
  };

  await participantRef.set(participant);
  return { ...participant, joinedAt: new Date(), updatedAt: new Date() };
}

/**
 * Get participants of an event ordered by ranking position / score.
 */
export async function getEventParticipants(eventId: string, limitCount = 50): Promise<EventParticipant[]> {
  const snap = await db
    .collection(PARTICIPANTS_COLLECTION)
    .where('eventId', '==', eventId)
    .orderBy('score', 'desc')
    .limit(limitCount)
    .get();

  const list: EventParticipant[] = [];
  snap.forEach((doc) => {
    list.push(doc.data() as EventParticipant);
  });
  return list;
}

/**
 * Update event participant score incrementally (Triggered via Backend events like giftWalletService).
 */
export async function updateEventParticipantScore(
  eventId: string,
  entityId: string,
  scoreDelta: number
): Promise<void> {
  const participantId = `${eventId}_${entityId}`;
  const ref = db.collection(PARTICIPANTS_COLLECTION).doc(participantId);
  const doc = await ref.get();

  if (!doc.exists) {
    // Attempt auto-joining if user profile exists
    const userDoc = await db.collection('users').doc(entityId).get();
    if (userDoc.exists) {
      const userData = userDoc.data()!;
      await joinEvent(eventId, {
        userId: entityId,
        displayName: userData.displayName || 'User',
        username: userData.username,
        photoURL: userData.photoURL,
      });
    } else {
      return; // Can't auto-join non-existent profile
    }
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  await ref.update({
    score: admin.firestore.FieldValue.increment(scoreDelta),
    progressValue: admin.firestore.FieldValue.increment(scoreDelta),
    updatedAt: now,
  });
}

/**
 * Recalculate positions/rankings of an event.
 */
export async function recalculateEventRanking(eventId: string): Promise<void> {
  const participants = await getEventParticipants(eventId, 500);
  const batch = db.batch();

  participants.forEach((p, index) => {
    const pRef = db.collection(PARTICIPANTS_COLLECTION).doc(p.id);
    batch.update(pRef, {
      position: index + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}

/**
 * Add event reward for a user participant (Admin only or system auto-triggered).
 */
export async function createEventReward(
  eventId: string,
  participantId: string,
  rewardData: {
    userId: string;
    rewardType: SpecialEvent['rewardType'];
    rewardAmount: number;
  }
): Promise<EventReward> {
  const ref = db.collection(REWARDS_COLLECTION).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const reward: EventReward = {
    id: ref.id,
    eventId,
    participantId,
    userId: rewardData.userId,
    rewardType: rewardData.rewardType!,
    rewardAmount: rewardData.rewardAmount,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(reward);

  // Update participant reward status
  const pRef = db.collection(PARTICIPANTS_COLLECTION).doc(participantId);
  await pRef.update({
    rewardStatus: 'pending',
    updatedAt: now,
  });

  return { ...reward, createdAt: new Date(), updatedAt: new Date() };
}

/**
 * Approve event reward (requires manual review of anti-fraud metrics/risk scores).
 */
export async function approveEventReward(rewardId: string, adminId: string): Promise<void> {
  const rewardRef = db.collection(REWARDS_COLLECTION).doc(rewardId);
  const rewardDoc = await rewardRef.get();
  if (!rewardDoc.exists) throw new Error('Reward not found.');

  const reward = rewardDoc.data() as EventReward;
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(rewardRef, {
      status: 'approved',
      approvedBy: adminId,
      approvedAt: now,
      updatedAt: now,
    });

    transaction.update(db.collection(PARTICIPANTS_COLLECTION).doc(reward.participantId), {
      rewardStatus: 'approved',
      updatedAt: now,
    });
  });

  // Notify user they have a reward ready to claim!
  if (reward.userId) {
    try {
      await createNotificationAndPush({
        userId: reward.userId,
        type: 'event_started',
        channel: 'both',
        title: '¡Felicidades! Recompensa de Evento Aprobada',
        body: `Tu recompensa del evento ha sido aprobada. Ve a tu sección de recompensas para reclamarla.`,
        actionType: 'open_event',
        actionValue: reward.eventId,
      });
    } catch (err) {
      console.error('Failed to notify approved reward:', err);
    }
  }
}

/**
 * Reject event reward (e.g. if fraudulent points/donations detected).
 */
export async function rejectEventReward(rewardId: string, adminId: string, reason: string): Promise<void> {
  const rewardRef = db.collection(REWARDS_COLLECTION).doc(rewardId);
  const rewardDoc = await rewardRef.get();
  if (!rewardDoc.exists) throw new Error('Reward not found.');

  const reward = rewardDoc.data() as EventReward;
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(rewardRef, {
      status: 'rejected',
      updatedAt: now,
    });

    transaction.update(db.collection(PARTICIPANTS_COLLECTION).doc(reward.participantId), {
      rewardStatus: 'rejected',
      updatedAt: now,
    });
  });
}

/**
 * Claim an approved event reward (crediting Diamonds/Beans/XP).
 */
export async function claimEventReward(rewardId: string, userId: string): Promise<void> {
  const rewardRef = db.collection(REWARDS_COLLECTION).doc(rewardId);
  const rewardDoc = await rewardRef.get();
  if (!rewardDoc.exists) throw new Error('Reward not found.');

  const reward = rewardDoc.data() as EventReward;
  if (reward.userId !== userId) throw new Error('This reward does not belong to you.');
  if (reward.status !== 'approved') throw new Error(`Reward is not in approved state (status: ${reward.status})`);

  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error('User not found.');

    const walletRef = db.collection('wallets').doc(userId);
    const walletDoc = await transaction.get(walletRef);

    // Apply reward value safely
    if (reward.rewardType === 'diamonds') {
      if (!walletDoc.exists) throw new Error('User wallet not initialized.');
      transaction.update(walletRef, {
        diamonds: admin.firestore.FieldValue.increment(reward.rewardAmount),
        updatedAt: now,
      });
    } else if (reward.rewardType === 'beans') {
      if (!walletDoc.exists) throw new Error('User wallet not initialized.');
      transaction.update(walletRef, {
        beans: admin.firestore.FieldValue.increment(reward.rewardAmount),
        updatedAt: now,
      });
    } else if (reward.rewardType === 'xp') {
      transaction.update(userRef, {
        rankXp: admin.firestore.FieldValue.increment(reward.rewardAmount),
        updatedAt: now,
      });
    }

    transaction.update(rewardRef, {
      status: 'claimed',
      claimedAt: now,
      updatedAt: now,
    });

    transaction.update(db.collection(PARTICIPANTS_COLLECTION).doc(reward.participantId), {
      rewardClaimed: true,
      rewardStatus: 'paid',
      updatedAt: now,
    });
  });
}

/**
 * Scan for active events that match a category and update entity score (e.g. gift matches).
 */
export async function trackEventGiftActivity(
  senderId: string,
  receiverHostId: string,
  roomId: string | null,
  diamondsGasted: number
): Promise<void> {
  const activeEvents = await getActiveEvents();
  if (activeEvents.length === 0) return;

  for (const event of activeEvents) {
    // Filter type matches
    if (event.type === 'gift_campaign' || event.type === 'top_gifters' || event.type === 'top_donors') {
      await updateEventParticipantScore(event.id, senderId, diamondsGasted);
    }
    if (event.type === 'top_hosts') {
      await updateEventParticipantScore(event.id, receiverHostId, diamondsGasted);
    }
    if (event.type === 'room_tournament' && roomId) {
      await updateEventParticipantScore(event.id, roomId, diamondsGasted);
    }
  }
}
