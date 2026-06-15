import firestore from '@react-native-firebase/firestore';
import { PkBattle, PkInvite, PkGiftContribution } from '../../../types/pk';

const PK_BATTLES = 'pkBattles';
const PK_INVITES = 'pkInvites';
const PK_GIFT_CONTRIBUTIONS = 'pkGiftContributions';

export const subscribeToPkBattle = (
  battleId: string,
  onUpdate: (battle: PkBattle) => void,
  onError?: (error: Error) => void
): (() => void) => {
  return firestore()
    .collection(PK_BATTLES)
    .doc(battleId)
    .onSnapshot(
      (doc) => {
        if (doc.exists()) {
          onUpdate({ id: doc.id, ...doc.data() } as PkBattle);
        }
      },
      (err) => {
        console.error('Error listening to PK Battle:', err);
        if (onError) onError(err);
      }
    );
};

export const subscribeToPendingPkInvites = (
  hostId: string,
  onInvite: (invite: PkInvite | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  return firestore()
    .collection(PK_INVITES)
    .where('toHostId', '==', hostId)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .onSnapshot(
      (snap) => {
        if (!snap.empty) {
          const doc = snap.docs[0];
          onInvite({ id: doc.id, ...doc.data() } as PkInvite);
        } else {
          onInvite(null);
        }
      },
      (err) => {
        console.error('Error listening to pending PK invites:', err);
        if (onError) onError(err);
      }
    );
};

export const subscribeToPkContributions = (
  battleId: string,
  onContributions: (contributions: PkGiftContribution[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  return firestore()
    .collection(PK_GIFT_CONTRIBUTIONS)
    .where('pkBattleId', '==', battleId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(
      (snap) => {
        const contributions = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PkGiftContribution[];
        onContributions(contributions);
      },
      (err) => {
        console.error('Error listening to PK contributions:', err);
        if (onError) onError(err);
      }
    );
};
