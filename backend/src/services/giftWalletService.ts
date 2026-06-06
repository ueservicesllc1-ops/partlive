import * as admin from 'firebase-admin';
import { db } from '../config/firebase';

export interface SendGiftParams {
  roomId: string;
  senderId: string;
  receiverId: string;
  giftId: string;
  quantity: number;
}

export const sendRoomGiftWithWallet = async (params: SendGiftParams): Promise<any> => {
  const { roomId, senderId, receiverId, giftId, quantity } = params;

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  const giftRef = db.collection('gifts').doc(giftId);
  const senderWalletRef = db.collection('wallets').doc(senderId);
  const receiverWalletRef = db.collection('wallets').doc(receiverId);
  const senderUserRef = db.collection('users').doc(senderId);
  const receiverUserRef = db.collection('users').doc(receiverId);
  const roomRef = db.collection('rooms').doc(roomId);

  const giftEventRef = db.collection('rooms').doc(roomId).collection('giftEvents').doc();
  const chatMessageRef = db.collection('rooms').doc(roomId).collection('messages').doc();

  const senderTxRef = db.collection('walletTransactions').doc();
  const receiverTxRef = db.collection('walletTransactions').doc();

  let finalGiftEvent: any = null;

  await db.runTransaction(async (transaction) => {
    // 1. Get Gift Details
    const giftSnap = await transaction.get(giftRef);
    if (!giftSnap.exists) {
      throw new Error('Gift not found');
    }
    const gift = giftSnap.data()!;
    if (!gift.isActive) {
      throw new Error('Gift is not active');
    }

    const totalCoins = (gift.priceCoins || 0) * quantity;
    const totalDiamonds = (gift.valueDiamonds || 0) * quantity;

    // 2. Get Users profiles for metadata and cache updates
    const senderUserSnap = await transaction.get(senderUserRef);
    const receiverUserSnap = await transaction.get(receiverUserRef);

    if (!senderUserSnap.exists) throw new Error('Sender user profile not found');
    if (!receiverUserSnap.exists) throw new Error('Receiver user profile not found');

    const senderUser = senderUserSnap.data()!;
    const receiverUser = receiverUserSnap.data()!;

    // 3. Get Wallets
    const senderWalletSnap = await transaction.get(senderWalletRef);
    const receiverWalletSnap = await transaction.get(receiverWalletRef);

    let senderWallet = senderWalletSnap.exists ? senderWalletSnap.data()! : null;
    let receiverWallet = receiverWalletSnap.exists ? receiverWalletSnap.data()! : null;

    // Handle missing wallets (ensure wallets)
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const createWalletObj = (uid: string) => ({
      id: uid,
      userId: uid,
      coins: 0,
      diamonds: 0,
      lifetimeCoinsPurchased: 0,
      lifetimeCoinsSpent: 0,
      lifetimeDiamondsEarned: 0,
      lifetimeDiamondsWithdrawn: 0,
      pendingDiamonds: 0,
      lockedDiamonds: 0,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (!senderWallet) {
      senderWallet = createWalletObj(senderId);
    }
    if (!receiverWallet) {
      receiverWallet = createWalletObj(receiverId);
    }

    if (senderWallet.status !== 'active') throw new Error('Sender wallet is not active');
    if (receiverWallet.status !== 'active') throw new Error('Receiver wallet is not active');

    // 4. Validate Balance
    if (senderWallet.coins < totalCoins) {
      throw new Error('Insufficient coins balance to buy this gift');
    }

    // 5. Calculate New Balances
    const newSenderCoins = senderWallet.coins - totalCoins;
    const newSenderLifetimeSpent = (senderWallet.lifetimeCoinsSpent || 0) + totalCoins;

    const newReceiverDiamonds = receiverWallet.diamonds + totalDiamonds;
    const newReceiverLifetimeEarned = (receiverWallet.lifetimeDiamondsEarned || 0) + totalDiamonds;

    // 6. Update Sender Wallet & User profile cache
    const senderWalletUpdates = {
      coins: newSenderCoins,
      lifetimeCoinsSpent: newSenderLifetimeSpent,
      updatedAt: timestamp,
    };
    if (!senderWalletSnap.exists) {
      transaction.set(senderWalletRef, { ...senderWallet, ...senderWalletUpdates });
    } else {
      transaction.update(senderWalletRef, senderWalletUpdates);
    }
    transaction.update(senderUserRef, {
      coins: newSenderCoins,
      updatedAt: timestamp,
    });

    // 7. Update Receiver Wallet & User profile cache
    const receiverWalletUpdates = {
      diamonds: newReceiverDiamonds,
      lifetimeDiamondsEarned: newReceiverLifetimeEarned,
      updatedAt: timestamp,
    };
    if (!receiverWalletSnap.exists) {
      transaction.set(receiverWalletRef, { ...receiverWallet, ...receiverWalletUpdates });
    } else {
      transaction.update(receiverWalletRef, receiverWalletUpdates);
    }
    transaction.update(receiverUserRef, {
      diamonds: newReceiverDiamonds,
      totalGiftsReceived: admin.firestore.FieldValue.increment(quantity),
      updatedAt: timestamp,
    });

    // 8. Create Audit WalletTransaction Documents
    const senderTx = {
      id: senderTxRef.id,
      userId: senderId,
      type: 'gift_sent',
      direction: 'debit',
      currencyType: 'coins',
      amount: totalCoins,
      balanceAfter: newSenderCoins,
      status: 'completed',
      description: `Envió ${quantity}x ${gift.name} a ${receiverUser.displayName || 'usuario'}`,
      relatedUserId: receiverId,
      relatedRoomId: roomId,
      relatedGiftId: giftId,
      relatedGiftEventId: giftEventRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    transaction.set(senderTxRef, senderTx);

    const receiverTx = {
      id: receiverTxRef.id,
      userId: receiverId,
      type: 'gift_received',
      direction: 'credit',
      currencyType: 'diamonds',
      amount: totalDiamonds,
      balanceAfter: newReceiverDiamonds,
      status: 'completed',
      description: `Recibió ${quantity}x ${gift.name} de ${senderUser.displayName || 'usuario'}`,
      relatedUserId: senderId,
      relatedRoomId: roomId,
      relatedGiftId: giftId,
      relatedGiftEventId: giftEventRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    transaction.set(receiverTxRef, receiverTx);

    // 9. Create GiftEvent Document
    const giftEventData = {
      id: giftEventRef.id,
      roomId,
      senderId,
      senderName: senderUser.displayName || 'Usuario',
      senderPhotoURL: senderUser.photoURL || '',
      receiverId,
      receiverName: receiverUser.displayName || 'Usuario',
      giftId,
      giftName: gift.name,
      giftIconUrl: gift.iconUrl || '🎁',
      quantity,
      totalCoins,
      totalDiamonds,
      createdAt: timestamp,
    };
    transaction.set(giftEventRef, giftEventData);
    finalGiftEvent = giftEventData;

    // 10. Send Chat Message
    const chatMsgText = `${senderUser.displayName || 'Usuario'} envió ${quantity}x ${gift.name} a ${receiverUser.displayName || 'Usuario'} ${gift.iconUrl || '🎁'}`;
    const chatMessage = {
      id: chatMessageRef.id,
      roomId,
      senderId,
      senderName: senderUser.displayName || 'Usuario',
      senderPhotoURL: senderUser.photoURL || '',
      senderRole: 'listener', // Will display system message color
      text: chatMsgText,
      type: 'gift',
      status: 'active',
      giftId,
      giftName: gift.name,
      giftIconUrl: gift.iconUrl || '🎁',
      quantity,
      receiverId,
      receiverName: receiverUser.displayName || 'Usuario',
      totalCoins,
      totalDiamonds,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    transaction.set(chatMessageRef, chatMessage);

    // 11. Update Room statistics
    transaction.update(roomRef, {
      giftsCount: admin.firestore.FieldValue.increment(quantity),
      diamondsGenerated: admin.firestore.FieldValue.increment(totalDiamonds),
      updatedAt: timestamp,
    });
  });

  return finalGiftEvent;
};
