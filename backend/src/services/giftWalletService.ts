import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { checkGiftFraud } from './fraudService';
import { calculateGiftMonetization } from '../config/monetizationConfig';
import { calculateAgencyCommission } from './agencyService';
import { recordGiftPlatformMargin } from './revenueService';

export interface SendGiftParams {
  targetType: 'room' | 'live' | 'game';
  targetId: string;
  senderId: string;
  receiverId: string;
  giftId: string;
  quantity: number;
}

export const sendGiftWithWallet = async (params: SendGiftParams): Promise<any> => {
  const { targetType, targetId, senderId, receiverId, giftId, quantity } = params;

  if (quantity < 1 || quantity > 99) {
    throw new Error('La cantidad de regalos debe ser entre 1 y 99.');
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

  // 3. Calculate Monetization
  const monetization = await calculateGiftMonetization({
    totalDiamonds: totalDiamondsSpent,
    receiverId,
    targetType,
    targetId,
  });

  const {
    platformCommissionPercent,
    receiverSharePercent,
    platformDiamondsValue,
    beansGenerated,
  } = monetization;

  const senderWalletRef = db.collection('wallets').doc(senderId);
  const receiverWalletRef = db.collection('wallets').doc(receiverId);
  const senderUserRef = db.collection('users').doc(senderId);
  const receiverUserRef = db.collection('users').doc(receiverId);

  // Collection name mapping based on targetType
  let collectionName = 'rooms';
  if (targetType === 'live') {
    collectionName = 'lives';
  } else if (targetType === 'game') {
    collectionName = 'gameSessions';
  }

  const targetRef = db.collection(collectionName).doc(targetId);

  const giftTxRef = db.collection('giftTransactions').doc();
  const giftEventRef = db.collection('giftEvents').doc();
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
    if (!targetSnap.exists) throw new Error(`El objetivo de tipo ${targetType} no existe o no está activo.`);

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
    if (senderWallet.status !== 'active') {
      throw new Error('Tu billetera está bloqueada o inactiva.');
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

    if (receiverWallet.status !== 'active') {
      throw new Error('La billetera del destinatario está inactiva o bloqueada.');
    }

    // Validate Balance
    if (senderWallet.diamonds < totalDiamondsSpent) {
      throw new Error('Saldo insuficiente de diamantes para enviar este regalo.');
    }

    // New Balances
    const newSenderDiamonds = senderWallet.diamonds - totalDiamondsSpent;
    const newSenderLifetimeSpent = (senderWallet.lifetimeDiamondsSpent || 0) + totalDiamondsSpent;

    const newReceiverBeans = (receiverWallet.beans || 0) + beansGenerated;
    const newReceiverLifetimeEarned = (receiverWallet.lifetimeBeansEarned || 0) + beansGenerated;

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

    // Create giftTransaction record
    const giftTxData = {
      id: giftTxRef.id,
      senderId,
      receiverId,
      targetType,
      targetId,
      giftId,
      giftName: gift.name,
      quantity,
      priceDiamonds: giftPriceDiamonds,
      totalDiamonds: totalDiamondsSpent,
      platformCommissionPercent,
      platformDiamondsValue,
      receiverSharePercent,
      beansGenerated,
      status: 'completed',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    transaction.set(giftTxRef, giftTxData);

    // Create giftEvents record
    const giftEventData = {
      id: giftEventRef.id,
      giftTransactionId: giftTxRef.id,
      senderId,
      senderName: senderUser.displayName || 'Usuario',
      senderPhotoURL: senderUser.photoURL || '',
      receiverId,
      receiverName: receiverUser.displayName || 'Usuario',
      targetType,
      targetId,
      giftId,
      giftName: gift.name,
      giftIconUrl: gift.iconUrl || '',
      giftEmoji: gift.iconEmoji || '🎁',
      quantity,
      totalDiamonds: totalDiamondsSpent,
      beansGenerated,
      rarity: gift.rarity || 'common',
      animationType: gift.animationType || 'small',
      roomEffectType: gift.roomEffectType || null,
      isGlobal: gift.animationType === 'global',
      createdAt: timestamp,
    };
    transaction.set(giftEventRef, giftEventData);
    finalGiftEvent = giftEventData;

    // Create Room Effect if configured
    if (gift.roomEffectType) {
      const durationMs = 15000; // 15 seconds duration for room effects
      const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + durationMs));
      const effectRef = db.collection('activeRoomEffects').doc();
      transaction.set(effectRef, {
        id: effectRef.id,
        roomId: targetType === 'room' ? targetId : (targetType === 'live' ? targetId : 'global'),
        effectType: gift.roomEffectType,
        senderId,
        senderName: senderUser.displayName || 'Usuario',
        receiverId,
        receiverName: receiverUser.displayName || 'Usuario',
        giftName: gift.name,
        quantity,
        expiresAt,
        createdAt: timestamp,
      });
    }

    // Assign temporary Sender Title if configured
    if (gift.senderTitle) {
      const durationDays = gift.senderTitleDurationDays || 1;
      const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000));
      const titleId = `${senderId}_${gift.senderTitle}`;
      const titleRef = db.collection('temporaryUserTitles').doc(titleId);
      transaction.set(titleRef, {
        id: titleId,
        userId: senderId,
        userName: senderUser.displayName || 'Usuario',
        title: gift.senderTitle,
        expiresAt,
        isActive: true,
        updatedAt: timestamp,
      }, { merge: true });
    }

    // Assign temporary Host Badge if configured
    if (gift.hostBadge) {
      const durationDays = gift.hostBadgeDurationDays || 1;
      const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000));
      const badgeId = `${receiverId}_${gift.hostBadge}`;
      const badgeRef = db.collection('temporaryHostBadges').doc(badgeId);
      transaction.set(badgeRef, {
        id: badgeId,
        userId: receiverId, // host
        userName: receiverUser.displayName || 'Usuario',
        badge: gift.hostBadge,
        expiresAt,
        isActive: true,
        updatedAt: timestamp,
      }, { merge: true });
    }

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
      relatedRoomId: targetType === 'room' ? targetId : null,
      relatedLiveId: targetType === 'live' ? targetId : null,
      relatedGiftId: giftId,
      relatedGiftEventId: giftEventRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    transaction.set(receiverTxRef, {
      id: receiverTxRef.id,
      userId: receiverId,
      type: 'beans_earned',
      direction: 'credit',
      currencyType: 'beans',
      amount: beansGenerated,
      balanceAfter: newReceiverBeans,
      status: 'completed',
      description: `Recibió ${quantity}x ${gift.name} de ${senderUser.displayName || 'usuario'}`,
      relatedUserId: senderId,
      relatedRoomId: targetType === 'room' ? targetId : null,
      relatedLiveId: targetType === 'live' ? targetId : null,
      relatedGiftId: giftId,
      relatedGiftEventId: giftEventRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Send Chat Message as a "gift" type message
    const chatMsgText = `${senderUser.displayName || 'Usuario'} envió ${quantity}x ${gift.name} a ${receiverUser.displayName || 'Usuario'} ${gift.iconEmoji || '🎁'}`;
    transaction.set(chatMessageRef, {
      id: chatMessageRef.id,
      targetType,
      targetId,
      senderId,
      senderName: senderUser.displayName || 'Usuario',
      senderPhotoURL: senderUser.photoURL || '',
      senderRole: senderUser.role || 'listener',
      type: 'gift',
      text: chatMsgText,
      giftEventId: giftEventRef.id,
      giftName: gift.name,
      giftIconUrl: gift.iconUrl || '',
      giftEmoji: gift.iconEmoji || '🎁',
      giftQuantity: quantity,
      giftDiamonds: totalDiamondsSpent,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Check if live stream is in active PK Battle
    if (targetType === 'live') {
      const liveData = targetSnap.data();
      if (liveData && liveData.isInPkBattle && liveData.activePkBattleId) {
        const pkBattleRef = db.collection('pkBattles').doc(liveData.activePkBattleId);
        const isHostA = liveData.hostId === receiverId;

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
          beansGenerated,
          createdAt: timestamp,
        });
      }
    }

    // Update Room/Live/Game statistics
    transaction.update(targetRef, {
      giftsCount: admin.firestore.FieldValue.increment(quantity),
      diamondsGenerated: admin.firestore.FieldValue.increment(totalDiamondsSpent),
      updatedAt: timestamp,
    });

    // Update targetGiftStats (Ranking)
    const statsId = `${targetType}_${targetId}_${senderId}`;
    const statsRef = db.collection('targetGiftStats').doc(statsId);
    transaction.set(statsRef, {
      id: statsId,
      targetType,
      targetId,
      userId: senderId,
      userName: senderUser.displayName || 'Usuario',
      userPhotoURL: senderUser.photoURL || '',
      totalDiamonds: admin.firestore.FieldValue.increment(totalDiamondsSpent),
      giftsCount: admin.firestore.FieldValue.increment(quantity),
      lastGiftAt: timestamp,
    }, { merge: true });
  });

  // Background operations
  try {
    const commissionBeans = await calculateAgencyCommission(receiverId, finalGiftEvent.id, beansGenerated);
    await recordGiftPlatformMargin(totalDiamondsSpent, beansGenerated, commissionBeans);

    // Track gift in analytical collections
    try {
      const { recordGiftSent } = await import('./analyticsService');
      await recordGiftSent(
        senderId,
        receiverId,
        giftId,
        gift.name,
        totalDiamondsSpent,
        beansGenerated,
        senderCountry,
        receiverCountry,
        agencyId
      );
    } catch (anErr) {
      console.error('Failed to log gift sent to analytics:', anErr);
    }
    
    // Increment missions progress safely
    const { incrementMissionProgress } = await import('./missionService');
    await incrementMissionProgress(senderId, 'send_gift', quantity);
    await incrementMissionProgress(receiverId, 'receive_gift', quantity);

    // Integrate with active Karaoke Sessions
    if (targetType === 'room' || targetType === 'live') {
      try {
        const { getActiveKaraokeSession, updatePerformanceGifts } = await import('./karaokeService');
        const session = await getActiveKaraokeSession(targetType, targetId);
        if (session && session.currentSingerId === receiverId) {
          const perfSnap = await db.collection('karaokePerformances')
            .where('sessionId', '==', session.id)
            .where('singerId', '==', receiverId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

          if (!perfSnap.empty) {
            const perfId = perfSnap.docs[0].id;
            await updatePerformanceGifts(perfId, totalDiamondsSpent, beansGenerated);
          }
        }
      } catch (kErr) {
        console.error('Failed to update Karaoke performance stats:', kErr);
      }
    }
  } catch (commErr) {
    console.error('Failed background operations for gift send:', commErr);
  }

  return finalGiftEvent;
};
