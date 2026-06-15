import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import {
  KaraokeSession,
  KaraokeQueueItem,
  KaraokePerformance,
  KaraokeBattle,
} from '../../../types/karaoke';

/**
 * Listens to the active Karaoke session in a voice room or live stream.
 */
export const listenToActiveSession = (
  targetType: 'room' | 'live',
  targetId: string,
  callback: (session: KaraokeSession | null) => void
): (() => void) => {
  const queryField = targetType === 'room' ? 'roomId' : 'liveId';
  return firestore()
    .collection(FirestoreCollections.KARAOKE_SESSIONS)
    .where(queryField, '==', targetId)
    .where('status', '==', 'active')
    .limit(1)
    .onSnapshot(
      snapshot => {
        if (!snapshot || snapshot.empty) {
          callback(null);
          return;
        }
        callback(snapshot.docs[0].data() as KaraokeSession);
      },
      error => {
        console.error('listenToActiveSession error:', error);
        callback(null);
      }
    );
};

/**
 * Listens to the current Karaoke queue (pending, approved, and singing) for a session.
 */
export const listenToQueue = (
  sessionId: string,
  callback: (queue: KaraokeQueueItem[]) => void
): (() => void) => {
  return firestore()
    .collection(FirestoreCollections.KARAOKE_QUEUE)
    .where('sessionId', '==', sessionId)
    .where('status', 'in', ['pending', 'approved', 'singing'])
    .orderBy('position', 'asc')
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          callback([]);
          return;
        }
        const queue = snapshot.docs.map(doc => doc.data() as KaraokeQueueItem);
        callback(queue);
      },
      error => {
        console.error('listenToQueue error:', error);
        callback([]);
      }
    );
};

/**
 * Listens to active user's queued items.
 */
export const listenToUserQueue = (
  userId: string,
  callback: (items: KaraokeQueueItem[]) => void
): (() => void) => {
  return firestore()
    .collection(FirestoreCollections.KARAOKE_QUEUE)
    .where('singerId', '==', userId)
    .where('status', 'in', ['pending', 'approved', 'singing'])
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          callback([]);
          return;
        }
        callback(snapshot.docs.map(doc => doc.data() as KaraokeQueueItem));
      },
      error => {
        console.error('listenToUserQueue error:', error);
        callback([]);
      }
    );
};

/**
 * Listens to performance logs for a specific singer.
 */
export const listenToSingerHistory = (
  userId: string,
  callback: (performances: KaraokePerformance[]) => void,
  limitCount = 20
): (() => void) => {
  return firestore()
    .collection(FirestoreCollections.KARAOKE_PERFORMANCES)
    .where('singerId', '==', userId)
    .orderBy('completedAt', 'desc')
    .limit(limitCount)
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          callback([]);
          return;
        }
        const history = snapshot.docs.map(doc => doc.data() as KaraokePerformance);
        callback(history);
      },
      error => {
        console.error('listenToSingerHistory error:', error);
        callback([]);
      }
    );
};

/**
 * Listens to active Karaoke battles in a room or live.
 */
export const listenToActiveBattle = (
  targetType: 'room' | 'live',
  targetId: string,
  callback: (battle: KaraokeBattle | null) => void
): (() => void) => {
  const queryField = targetType === 'room' ? 'roomId' : 'liveId';
  return firestore()
    .collection(FirestoreCollections.KARAOKE_BATTLES)
    .where(queryField, '==', targetId)
    .where('status', 'in', ['scheduled', 'active'])
    .limit(1)
    .onSnapshot(
      snapshot => {
        if (!snapshot || snapshot.empty) {
          callback(null);
          return;
        }
        callback(snapshot.docs[0].data() as KaraokeBattle);
      },
      error => {
        console.error('listenToActiveBattle error:', error);
        callback(null);
      }
    );
};

/**
 * Listens to real-time vote totals for an active battle.
 */
export const listenToBattleVotesCount = (
  battleId: string,
  callback: (votes: Record<string, number>) => void
): (() => void) => {
  return firestore()
    .collection(FirestoreCollections.KARAOKE_VOTES)
    .where('battleId', '==', battleId)
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          callback({});
          return;
        }
        const votesCount: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
          const vote = doc.data();
          if (vote.participantId) {
            votesCount[vote.participantId] = (votesCount[vote.participantId] || 0) + 1;
          }
        });
        callback(votesCount);
      },
      error => {
        console.error('listenToBattleVotesCount error:', error);
        callback({});
      }
    );
};
