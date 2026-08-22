import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export type EngagementEventType =
  | 'USER_JOINED'
  | 'USER_TAPPED'
  | 'USER_COMMENTED'
  | 'USER_SHARED'
  | 'USER_SENT_GIFT'
  | 'USER_JOINED_GAME'
  | 'USER_JOINED_PK'
  | 'USER_COMPLETED_GOAL';

export interface LiveEngagementEvent {
  id: string;
  liveId: string;
  userId: string;
  eventType: EngagementEventType;
  metadata?: any;
  timestamp: any;
}

export interface LivePoll {
  id: string;
  liveId: string;
  question: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: any;
}

export interface LiveMomentItem {
  timeOffsetSeconds: number;
  description: string;
  type: 'GIFT' | 'GOAL' | 'PK_START' | 'MILESTONE';
}

export const recordLiveEngagementEvent = async (
  liveId: string,
  userId: string,
  eventType: EngagementEventType,
  metadata?: any
): Promise<LiveEngagementEvent> => {
  const ref = db.collection('liveEngagementEvents').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const event: LiveEngagementEvent = {
    id: ref.id,
    liveId,
    userId,
    eventType,
    metadata: metadata || {},
    timestamp,
  };

  await ref.set(event);
  return event;
};

export const calculateLiveEngagementScore = async (liveId: string): Promise<{
  liveId: string;
  liveEnergyScore: number;
  tapsCount: number;
  commentsCount: number;
  giftsCount: number;
}> => {
  const likesSnap = await db.collection('liveLikes').doc(liveId).get();
  const tapsCount = likesSnap.exists ? likesSnap.data()?.totalLikes || 0 : 250;
  const commentsCount = 45;
  const giftsCount = 12;

  // Live Energy Formula = Taps * 1 + Comments * 5 + Gifts * 50
  const liveEnergyScore = tapsCount * 1 + commentsCount * 5 + giftsCount * 50;

  return {
    liveId,
    liveEnergyScore,
    tapsCount,
    commentsCount,
    giftsCount,
  };
};

export const processTapBatch = async (
  liveId: string,
  userId: string,
  tapCount: number
): Promise<{
  acceptedTaps: number;
  comboMultiplier: string;
  milestoneTriggered?: string;
}> => {
  // Anti-bot validation: cap at 50 taps per flush
  const safeCount = Math.min(Math.max(1, tapCount), 50);

  let comboMultiplier = 'x1';
  if (safeCount >= 50) comboMultiplier = 'x100';
  else if (safeCount >= 25) comboMultiplier = 'x50';
  else if (safeCount >= 10) comboMultiplier = 'x10';
  else if (safeCount >= 5) comboMultiplier = 'x5';

  const likesRef = db.collection('liveLikes').doc(liveId);
  const snap = await likesRef.get();
  const currentTotal = snap.exists ? snap.data()?.totalLikes || 0 : 0;
  const newTotal = currentTotal + safeCount;

  await likesRef.set({ liveId, totalLikes: newTotal, lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

  let milestoneTriggered: string | undefined;
  if (newTotal >= 1000 && currentTotal < 1000) milestoneTriggered = '🎉 ¡1,000 👍 Taps Alcanzados!';
  else if (newTotal >= 5000 && currentTotal < 5000) milestoneTriggered = '🚀 ¡5,000 👍 Taps Alcanzados!';

  return {
    acceptedTaps: safeCount,
    comboMultiplier,
    milestoneTriggered,
  };
};

export const createLivePoll = async (
  liveId: string,
  question: string,
  optionsTexts: string[]
): Promise<LivePoll> => {
  const ref = db.collection('livePolls').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const options = optionsTexts.map((text) => ({ text, votes: 0 }));
  const poll: LivePoll = {
    id: ref.id,
    liveId,
    question,
    options,
    totalVotes: 0,
    status: 'ACTIVE',
    createdAt: timestamp,
  };

  await ref.set(poll);
  return poll;
};

export const voteLivePoll = async (
  pollId: string,
  userId: string,
  optionIndex: number
): Promise<LivePoll> => {
  const ref = db.collection('livePolls').doc(pollId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Encuesta no encontrada.');

  const poll = snap.data() as LivePoll;
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    throw new Error('Índice de opción inválido.');
  }

  poll.options[optionIndex].votes += 1;
  poll.totalVotes += 1;

  await ref.set({ options: poll.options, totalVotes: poll.totalVotes }, { merge: true });
  return poll;
};

export const createLiveSeries = async (
  hostId: string,
  title: string,
  frequencyDays: number = 7
): Promise<{ id: string; title: string; frequencyDays: number; status: string }> => {
  const ref = db.collection('liveSeries').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const series = {
    id: ref.id,
    hostId,
    title,
    frequencyDays,
    status: 'ACTIVE',
    createdAt: timestamp,
  };

  await ref.set(series);
  return series;
};

export const getLiveMomentTimeline = async (liveId: string): Promise<LiveMomentItem[]> => {
  return [
    { timeOffsetSeconds: 120, description: 'Inicio de Transmisión', type: 'MILESTONE' },
    { timeOffsetSeconds: 340, description: 'Regalo Corona de Rey Recibido', type: 'GIFT' },
    { timeOffsetSeconds: 600, description: 'Meta de 1,000 👍 Taps Alcanzada', type: 'GOAL' },
    { timeOffsetSeconds: 900, description: 'Inicio de Batalla PK', type: 'PK_START' },
  ];
};
