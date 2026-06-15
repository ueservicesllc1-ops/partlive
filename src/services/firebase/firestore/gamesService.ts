import firestore from '@react-native-firebase/firestore';
import { Game, GameType } from '../../../types/game';
import { FirestoreCollections } from '../../../constants/firestoreCollections';

// ─── Listeners ────────────────────────────────────────────────────────────────

/** Escucha todos los juegos activos en tiempo real */
export const listenToActiveGames = (
  onGames: (games: Game[]) => void,
  onError?: (err: Error) => void,
) => {
  return firestore()
    .collection(FirestoreCollections.GAMES)
    .where('isActive', '==', true)
    .onSnapshot(
      snapshot => {
        const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
        onGames(games);
      },
      error => onError?.(error),
    );
};

// ─── One-time Reads ───────────────────────────────────────────────────────────

export const getActiveGames = async (): Promise<Game[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.GAMES)
    .where('isActive', '==', true)
    .orderBy('playersOnline', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
};

export const getGameById = async (id: string): Promise<Game | null> => {
  const doc = await firestore().collection(FirestoreCollections.GAMES).doc(id).get();
  if (doc.exists()) {
    return { id: doc.id, ...doc.data() } as Game;
  }
  return null;
};

export const getGameBySlug = async (slug: GameType): Promise<Game | null> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.GAMES)
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Game;
};

export const getComingSoonGames = async (): Promise<Game[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.GAMES)
    .where('status', '==', 'coming_soon')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
};
