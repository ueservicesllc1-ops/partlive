import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import { addXpToUser } from './levelService';

export interface LiveActivity {
  id: string;
  liveId: string;
  hostId: string;
  type: 'KARAOKE' | 'TRIVIA' | 'POLL' | 'QUIZ' | 'WORD_GAME' | 'CHALLENGE';
  title: string;
  status: 'DRAFT' | 'READY' | 'LIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  configuration: any;
  createdAt: any;
  updatedAt: any;
}

export const startLiveActivity = async (
  hostId: string,
  liveId: string,
  type: 'KARAOKE' | 'TRIVIA' | 'POLL' | 'QUIZ' | 'WORD_GAME' | 'CHALLENGE',
  title: string,
  configuration?: any
): Promise<LiveActivity> => {
  const activityRef = db.collection('liveActivities').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newActivity: LiveActivity = {
    id: activityRef.id,
    liveId,
    hostId,
    type,
    title,
    status: 'LIVE',
    configuration: configuration || {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await activityRef.set(newActivity);
  return newActivity;
};

export const submitTriviaAnswer = async (
  userId: string,
  activityId: string,
  questionIndex: number,
  optionIndex: number
): Promise<{ correct: boolean; xpEarned: number }> => {
  const activityRef = db.collection('liveActivities').doc(activityId);
  const activitySnap = await activityRef.get();
  if (!activitySnap.exists) throw new Error('Actividad no encontrada.');
  const activity = activitySnap.data() as LiveActivity;

  const questions = activity.configuration?.questions || [];
  const question = questions[questionIndex];
  if (!question) throw new Error('Pregunta no encontrada.');

  const isCorrect = question.correctOptionIndex === optionIndex;
  const xpEarned = isCorrect ? 50 : 5;

  const answerRef = activityRef.collection('triviaAnswers').doc(`${userId}_${questionIndex}`);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await answerRef.set({
    userId,
    questionIndex,
    optionIndex,
    isCorrect,
    createdAt: timestamp,
  });

  // Award status XP (non-financial)
  await addXpToUser(userId, xpEarned, 'mission');

  return { correct: isCorrect, xpEarned };
};

export const castPollVote = async (
  userId: string,
  activityId: string,
  optionIndex: number
): Promise<void> => {
  const activityRef = db.collection('liveActivities').doc(activityId);
  const voteRef = activityRef.collection('pollVotes').doc(userId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await voteRef.set({
    userId,
    optionIndex,
    createdAt: timestamp,
  });

  // Award participation XP
  await addXpToUser(userId, 10, 'mission');
};

export const submitWordGuess = async (
  userId: string,
  activityId: string,
  guess: string
): Promise<{ correct: boolean; xpEarned: number }> => {
  const activityRef = db.collection('liveActivities').doc(activityId);
  const activitySnap = await activityRef.get();
  if (!activitySnap.exists) throw new Error('Actividad no encontrada.');
  const activity = activitySnap.data() as LiveActivity;

  const targetWord = (activity.configuration?.targetWord || '').toUpperCase().trim();
  const userGuess = (guess || '').toUpperCase().trim();
  const isCorrect = targetWord === userGuess && targetWord !== '';

  const xpEarned = isCorrect ? 100 : 5;
  const guessRef = activityRef.collection('wordGuesses').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await guessRef.set({
    userId,
    guess: userGuess,
    isCorrect,
    createdAt: timestamp,
  });

  if (isCorrect) {
    await activityRef.update({
      status: 'COMPLETED',
      winnerId: userId,
      updatedAt: timestamp,
    });
    await addXpToUser(userId, xpEarned, 'mission');
  }

  return { correct: isCorrect, xpEarned };
};

export const endLiveActivity = async (hostId: string, activityId: string): Promise<void> => {
  const activityRef = db.collection('liveActivities').doc(activityId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await activityRef.update({
    status: 'COMPLETED',
    updatedAt: timestamp,
  });
};
