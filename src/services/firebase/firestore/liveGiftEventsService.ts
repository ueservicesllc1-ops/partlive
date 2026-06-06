import firestore from '@react-native-firebase/firestore';
import { Gift } from '../../../types';
import { getLiveGiftEventsPath, FirestoreCollections } from '../../../constants/firestoreCollections';
import { sendLiveGiftMessage } from './liveMessagesService';
import { GIFT_WALLET_MODE } from '../../../constants/giftConfig';
import { apiFetch } from '../../api/apiClient';

/**
 * Sends a gift in a live room, updates live count totals (giftsCount, diamondsEarned),
 * and creates corresponding event log and chat notification message.
 */
export const sendLiveGift = async (
  liveId: string,
  senderProfile: { uid: string; displayName: string },
  receiverProfile: { uid: string; displayName: string },
  gift: Gift,
  quantity: number = 1
): Promise<void> => {
  const db = firestore();
  const totalCoins = gift.priceCoins * quantity;
  const totalDiamonds = gift.valueDiamonds * quantity;

  if (GIFT_WALLET_MODE === 'backend') {
    // API backend integration
    await apiFetch('/gifts/live/send', {
      method: 'POST',
      body: JSON.stringify({
        liveId,
        receiverId: receiverProfile.uid,
        giftId: gift.id,
        quantity,
      }),
    });
    return;
  }

  // GIFT_WALLET_MODE === 'mock'
  const liveRef = db.collection(FirestoreCollections.LIVES).doc(liveId);
  const eventRef = db.collection(getLiveGiftEventsPath(liveId)).doc();

  const giftEvent = {
    id: eventRef.id,
    giftId: gift.id,
    giftName: gift.name,
    giftIconUrl: gift.iconUrl || '🎁',
    senderId: senderProfile.uid,
    senderName: senderProfile.displayName,
    receiverId: receiverProfile.uid,
    receiverName: receiverProfile.displayName,
    liveId,
    quantity,
    totalCoins,
    totalDiamonds,
    createdAt: firestore.FieldValue.serverTimestamp(),
  };

  // Run transaction to increment counts on live document
  await db.runTransaction(async transaction => {
    const liveSnap = await transaction.get(liveRef);
    if (!liveSnap.exists()) return;
    
    const liveData = liveSnap.data() || {};
    transaction.set(eventRef, giftEvent);
    transaction.update(liveRef, {
      giftsCount: (liveData.giftsCount || 0) + quantity,
      diamondsEarned: (liveData.diamondsEarned || 0) + totalDiamonds,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  // Post dynamic notification to live messages
  await sendLiveGiftMessage(liveId, {
    senderId: senderProfile.uid,
    senderName: senderProfile.displayName,
    giftName: gift.name,
    quantity,
    receiverName: receiverProfile.displayName,
    giftIconUrl: gift.iconUrl,
    totalCoins,
    totalDiamonds,
  });
};

/**
 * Subscribe to realtime live gift event logs.
 */
export const listenToLiveGiftEvents = (
  liveId: string,
  callback: (events: any[]) => void,
  limitCount: number = 30
) => {
  return firestore()
    .collection(getLiveGiftEventsPath(liveId))
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .onSnapshot(snap => {
      if (snap) {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });
};

/**
 * Fetch recent live gift events.
 */
export const getRecentLiveGiftEvents = async (liveId: string, limitCount: number = 30): Promise<any[]> => {
  const snap = await firestore()
    .collection(getLiveGiftEventsPath(liveId))
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
