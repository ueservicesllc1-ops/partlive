import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { checkGiftFraud } from './fraudService';
import { calculateBeansForGift } from './hostMonetizationService';
import { calculateAgencyCommission } from './agencyService';
import { recordGiftPlatformMargin } from './revenueService';

export interface SendGiftParams {
  roomId?: string;
  liveId?: string;
  senderId: string;
  receiverId: string;
  giftId: string;
  quantity: number;
}

export const sendRoomGiftWithWallet = async (params: SendGiftParams): Promise<any> => {
  const { roomId, liveId, senderId, receiverId, giftId, quantity } = params;

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  // 1. Get Gift Details
  const giftRef = db.collection('gifts').doc(giftId);
  const giftSnap = await giftRef.get();
  if (!giftSnap.exists) throw new Error('El regalo no existe');
  const gift = giftSnap.data()!;
  if (!gift.isActive) throw new Error('El regalo no está activo');

  const giftPriceDiamonds = gift.priceDiamonds || 0;
  const totalDiamondsSpent = giftPriceDiamonds * quantity;

  // 2. Pre-Check Anti-Fraud
  await checkGiftFraud(senderId, receiverId, giftId, quantity, giftPriceDiamonds);

  // 3. Calculate Beans split
  const totalBeansToHost = await calculateBeansForGift(receiverId, totalDiamondsSpent);

  const senderWalletRef = db.collection('wallets').doc(senderId);
  const receiverWalletRef = db.collection('wallets').doc(receiverId);
  const senderUserRef = db.collection('users').doc(senderId);
  const receiverUserRef = db.collection('users').doc(receiverId);

  // Subcollection paths depending on target (room vs live)
  const isRoom = !!roomId;
  const targetId = isRoom ? roomId! : liveId!;
  const collectionName = isRoom ? 'rooms' : 'lives';
  const targetRef = db.collection(collectionName).doc(targetId);

  const giftEventRef = db.collection(collectionName).doc(targetId).collection('giftEvents').doc();
  const chatMessageRef = db.collection(collectionName).doc(targetId).collection('messages').doc();

  const senderTxRef = db.collection('walletTransactions').doc();
  const receiverTxRef = db.collection('walletTransactions').doc();

  let finalGiftEvent: any = null;
  let senderCountry = 'CL';
  let receiverCountry = 'CL';
  let agencyId: string | undefined = undefined;

  await db.runTransaction(async (transaction) => {
    // Get profiles and wallets inside transaction
    const [senderUserSnap, receiverUserSnap, senderWalletSnap, receiverWalletSnap, targetSnap] = await Promise.all([
      transaction.get(senderUserRef),
      transaction.get(receiverUserRef),
      transaction.get(senderWalletRef),
      transaction.get(receiverWalletRef),
      transaction.get(targetRef),
    ]);

    if (!senderUserSnap.exists) throw new Error('Sender user profile not found');
    if (!receiverUserSnap.exists) throw new Error('Receiver user profile not found');

    const senderUser = senderUserSnap.data()!;
    const receiverUser = receiverUserSnap.data()!;

    senderCountry = senderUser.country || 'CL';
    receiverCountry = receiverUser.country || 'CL';
    agencyId = receiverUser.agencyId || undefined;

    let senderWallet = senderWalletSnap.exists ? senderWalletSnap.data()! : null;
    let receiverWallet = receiverWalletSnap.exists ? receiverWalletSnap.data()! : null;

    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    if (!senderWallet) {
      throw new Error('Tu billetera no está inicializada.');
    }
    if (!receiverWallet) {
      receiverWallet = {
        userId: receiverId,
        diamonds: 0,
        beans: 0,
        lifetimeDiamondsPurchased: 0,
        lifetimeDiamondsSpent: 0,
        lifetimeBeansEarned: 0,
        lifetimeBeansWithdrawn: 0,
        pendingBeans: 0,
        lockedBeans: 0,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }

    if (senderWallet.status !== 'active') throw new Error('Tu billetera está bloqueada.');
    if (receiverWallet.status !== 'active') throw new Error('La billetera del destinatario está inactiva.');

    // Validate Balance
    if (senderWallet.diamonds < totalDiamondsSpent) {
      throw new Error('Saldo insuficiente de diamantes para enviar este regalo.');
    }

    // New Balances
    const newSenderDiamonds = senderWallet.diamonds - totalDiamondsSpent;
    const newSenderLifetimeSpent = (senderWallet.lifetimeDiamondsSpent || 0) + totalDiamondsSpent;

    const newReceiverBeans = (receiverWallet.beans || 0) + totalBeansToHost;
    const newReceiverLifetimeEarned = (receiverWallet.lifetimeBeansEarned || 0) + totalBeansToHost;

    // Update Sender Wallet & User profile cache
    transaction.update(senderWalletRef, {
      diamonds: newSenderDiamonds,
      lifetimeDiamondsSpent: newSenderLifetimeSpent,
      updatedAt: timestamp,
    });
    transaction.update(senderUserRef, {
      diamonds: newSenderDiamonds,
      updatedAt: timestamp,
    });

    // Update Receiver Wallet & User profile cache
    if (!receiverWalletSnap.exists) {
      transaction.set(receiverWalletRef, {
        ...receiverWallet,
        beans: newReceiverBeans,
        lifetimeBeansEarned: newReceiverLifetimeEarned,
      });
    } else {
      transaction.update(receiverWalletRef, {
        beans: newReceiverBeans,
        lifetimeBeansEarned: newReceiverLifetimeEarned,
        updatedAt: timestamp,
      });
    }
    transaction.update(receiverUserRef, {
      beans: newReceiverBeans,
      totalGiftsReceived: admin.firestore.FieldValue.increment(quantity),
      updatedAt: timestamp,
    });

    // Create Audit Transactions
    transaction.set(senderTxRef, {
      id: senderTxRef.id,
      userId: senderId,
      type: 'gift_sent',
      direction: 'debit',
      currencyType: 'diamonds',
      amount: totalDiamondsSpent,
      balanceAfter: newSenderDiamonds,
      status: 'completed',
      description: `Envió ${quantity}x ${gift.name} a ${receiverUser.displayName || 'usuario'}`,
      relatedUserId: receiverId,
      relatedRoomId: roomId || null,
      relatedLiveId: liveId || null,
      relatedGiftId: giftId,
      relatedGiftEventId: giftEventRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    transaction.set(receiverTxRef, {
      id: receiverTxRef.id,
      userId: receiverId,
      type: 'gift_received',
      direction: 'credit',
      currencyType: 'beans',
      amount: totalBeansToHost,
      balanceAfter: newReceiverBeans,
      status: 'completed',
      description: `Recibió ${quantity}x ${gift.name} de ${senderUser.displayName || 'usuario'}`,
      relatedUserId: senderId,
      relatedRoomId: roomId || null,
      relatedLiveId: liveId || null,
      relatedGiftId: giftId,
      relatedGiftEventId: giftEventRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Create GiftEvent Document
    const giftEventData = {
      id: giftEventRef.id,
      roomId: roomId || null,
      liveId: liveId || null,
      senderId,
      senderName: senderUser.displayName || 'Usuario',
      senderPhotoURL: senderUser.photoURL || '',
      receiverId,
      receiverName: receiverUser.displayName || 'Usuario',
      giftId,
      giftName: gift.name,
      giftIconUrl: gift.iconUrl || '🎁',
      quantity,
      totalDiamonds: totalDiamondsSpent,
      totalBeans: totalBeansToHost,
      createdAt: timestamp,
    };
    transaction.set(giftEventRef, giftEventData);
    finalGiftEvent = giftEventData;

    // Send Chat Message
    const chatMsgText = `${senderUser.displayName || 'Usuario'} envió ${quantity}x ${gift.name} a ${receiverUser.displayName || 'Usuario'} ${gift.iconUrl || '🎁'}`;
    transaction.set(chatMessageRef, {
      id: chatMessageRef.id,
      roomId: roomId || null,
      liveId: liveId || null,
      senderId,
      senderName: senderUser.displayName || 'Usuario',
      senderPhotoURL: senderUser.photoURL || '',
      senderRole: 'listener',
      text: chatMsgText,
      type: 'gift',
      status: 'active',
      giftId,
      giftName: gift.name,
      giftIconUrl: gift.iconUrl || '🎁',
      quantity,
      receiverId,
      receiverName: receiverUser.displayName || 'Usuario',
      totalDiamonds: totalDiamondsSpent,
      totalBeans: totalBeansToHost,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Check if live stream is in active PK Battle
    if (!isRoom && targetSnap.exists) {
      const liveData = targetSnap.data();
      if (liveData && liveData.isInPkBattle && liveData.activePkBattleId) {
        const pkBattleRef = db.collection('pkBattles').doc(liveData.activePkBattleId);
        const isHostA = liveData.hostId === receiverId; // Target receiver matches active stream host A

        if (isHostA) {
          transaction.update(pkBattleRef, {
            hostAScore: admin.firestore.FieldValue.increment(totalDiamondsSpent),
            hostADiamonds: admin.firestore.FieldValue.increment(totalDiamondsSpent),
            hostAGiftsCount: admin.firestore.FieldValue.increment(quantity),
            updatedAt: timestamp,
          });
        } else {
          transaction.update(pkBattleRef, {
            hostBScore: admin.firestore.FieldValue.increment(totalDiamondsSpent),
            hostBDiamonds: admin.firestore.FieldValue.increment(totalDiamondsSpent),
            hostBGiftsCount: admin.firestore.FieldValue.increment(quantity),
            updatedAt: timestamp,
          });
        }

        const contributionRef = db.collection('pkGiftContributions').doc();
        transaction.set(contributionRef, {
          id: contributionRef.id,
          pkBattleId: liveData.activePkBattleId,
          giftEventId: giftEventRef.id,
          senderId,
          receiverHostId: receiverId,
          giftId,
          giftName: gift.name,
          diamonds: totalDiamondsSpent,
          beansGenerated: totalBeansToHost,
          createdAt: timestamp,
        });
      }
    }

    // Update Room/Live statistics
    transaction.update(targetRef, {
      giftsCount: admin.firestore.FieldValue.increment(quantity),
      diamondsGenerated: admin.firestore.FieldValue.increment(totalDiamondsSpent),
      updatedAt: timestamp,
    });
  });

  // Calculate Agency Commission & Revenue Margin in background
  try {
    const commissionBeans = await calculateAgencyCommission(receiverId, finalGiftEvent.id, totalBeansToHost);
    await recordGiftPlatformMargin(totalDiamondsSpent, totalBeansToHost, commissionBeans);

    // Track gift in analytical collections
    try {
      const { recordGiftSent } = await import('./analyticsService');
      await recordGiftSent(
        senderId,
        receiverId,
        giftId,
        gift.name,
        totalDiamondsSpent,
        totalBeansToHost,
        senderCountry,
        receiverCountry,
        agencyId
      );
    } catch (anErr) {
      console.error('Failed to log gift sent to analytics:', anErr);
    }
    
    // Increment missions progress safely in the background
    const { incrementMissionProgress } = await import('./missionService');
    await incrementMissionProgress(senderId, 'send_gift', quantity);
    await incrementMissionProgress(receiverId, 'receive_gift', quantity);

    // Integrate with active Karaoke Sessions
    try {
      const targetType = roomId ? 'room' : 'live';
      const targetId = roomId || liveId;
      if (targetId) {
        const { getActiveKaraokeSession, updatePerformanceGifts } = await import('./karaokeService');
        const session = await getActiveKaraokeSession(targetType, targetId);
        if (session && session.currentSingerId === receiverId) {
          // Find the active performance document
          const perfSnap = await db.collection('karaokePerformances')
            .where('sessionId', '==', session.id)
            .where('singerId', '==', receiverId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

          if (!perfSnap.empty) {
            const perfId = perfSnap.docs[0].id;
            await updatePerformanceGifts(perfId, totalDiamondsSpent, totalBeansToHost);
          }
        }
      }
    } catch (kErr) {
      console.error('Failed to update Karaoke performance with gift statistics:', kErr);
    }
  } catch (commErr) {
    console.error('Failed to log agency commissions / platform revenue margin / mission increments:', commErr);
  }

  return {
    ...finalGiftEvent,
    totalBeans: totalBeansToHost,
  };
};
