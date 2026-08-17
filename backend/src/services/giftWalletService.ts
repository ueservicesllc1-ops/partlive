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

  const giftCoinCost = gift.coinCost || gift.priceDiamonds || 1;
  const giftDiamondReward = gift.diamondReward || gift.beansValue || giftCoinCost;

  const totalCoinsSpent = giftCoinCost * quantity;
  const totalDiamondsEarned = giftDiamondReward * quantity;

  // 2. Pre-Check Anti-Fraud
  await checkGiftFraud(senderId, receiverId, giftId, quantity, totalCoinsSpent);

  // 3. Calculate Monetization
  const monetization = await calculateGiftMonetization({
    totalDiamonds: totalCoinsSpent,
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

    if (!senderUserSnap.exists) throw new Error('Perfil de usuario emisor no encontrado');
    if (!receiverUserSnap.exists) throw new Error('Perfil de usuario receptor no encontrado');
    if (!targetSnap.exists) throw new Error(`El objetivo de tipo ${targetType} no existe o no está activo.`);

    const senderUser = senderUserSnap.data()!;
    const receiverUser = receiverUserSnap.data()!;

    senderCountry = senderUser.country || 'CL';
    receiverCountry = receiverUser.country || 'CL';
    agencyId = receiverUser.agencyId || null;

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
        coins: 0,
        coinsBalance: 0,
        diamonds: 0,
        diamondBalance: 0,
        availableDiamonds: 0,
        pendingDiamonds: 0,
        lifetimeDiamonds: 0,
        withdrawnDiamonds: 0,
        beans: 0,
        lifetimeDiamondsPurchased: 0,
        lifetimeDiamondsSpent: 0,
        lifetimeBeansEarned: 0,
        lifetimeBeansWithdrawn: 0,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }

    if (receiverWallet.status !== 'active') {
      throw new Error('La billetera del destinatario está inactiva o bloqueada.');
    }

    // Validate Sender Coins Balance
    const senderCoins = senderWallet.coins ?? senderWallet.coinsBalance ?? senderWallet.diamonds ?? 0;
    if (senderCoins < totalCoinsSpent) {
      throw new Error(`Saldo insuficiente de Coins (${senderCoins} disponibles, se requieren ${totalCoinsSpent}).`);
    }

    let finalDiamondsEarned = totalDiamondsEarned;
    let scoreAddition = totalCoinsSpent;
    let battle: any = null;

    if (targetType === 'live' && targetSnap.exists) {
      const liveData = targetSnap.data();
      if (liveData && liveData.isInPkBattle && liveData.activePkBattleId) {
        const pkBattleSnap = await transaction.get(db.collection('pkBattles').doc(liveData.activePkBattleId));
        if (pkBattleSnap.exists) {
          battle = pkBattleSnap.data();
          const isHostA = battle.hostAId === receiverId;

          // Check powerups...
          const opponentActivePower = isHostA ? battle.hostBActivePower : battle.hostAActivePower;
          const opponentPowerExpiry = isHostA ? battle.hostBPowerExpiry : battle.hostAPowerExpiry;
          if (opponentActivePower === 'block_gifts') {
            const expiryMs = opponentPowerExpiry ? (opponentPowerExpiry.toMillis ? opponentPowerExpiry.toMillis() : new Date(opponentPowerExpiry).getTime()) : 0;
            if (Date.now() < expiryMs) {
              throw new Error('¡El oponente ha bloqueado tus regalos! Inténtalo de nuevo en unos segundos.');
            }
          }

          const hostActivePower = isHostA ? battle.hostAActivePower : battle.hostBActivePower;
          const hostPowerExpiry = isHostA ? battle.hostAPowerExpiry : battle.hostBPowerExpiry;
          if (hostActivePower === 'double_points') {
            const expiryMs = hostPowerExpiry ? (hostPowerExpiry.toMillis ? hostPowerExpiry.toMillis() : new Date(hostPowerExpiry).getTime()) : 0;
            if (Date.now() < expiryMs) {
              scoreAddition = totalCoinsSpent * 2;
            }
          }
        }
      }
    }

    // New Balances
    const newSenderCoins = senderCoins - totalCoinsSpent;
    const newSenderLifetimeSpent = (senderWallet.lifetimeDiamondsSpent || 0) + totalCoinsSpent;

    const receiverDiamonds = receiverWallet.diamonds ?? receiverWallet.availableDiamonds ?? receiverWallet.beans ?? 0;
    const newReceiverDiamonds = receiverDiamonds + finalDiamondsEarned;
    const newAvailableDiamonds = (receiverWallet.availableDiamonds ?? receiverWallet.beans ?? 0) + finalDiamondsEarned;
    const newLifetimeDiamonds = (receiverWallet.lifetimeDiamonds ?? receiverWallet.lifetimeBeansEarned ?? 0) + finalDiamondsEarned;

    // Update Sender Wallet & User profile cache
    transaction.update(senderWalletRef, {
      coins: newSenderCoins,
      coinsBalance: newSenderCoins,
      diamonds: newSenderCoins, // Legacy compatibility
      lifetimeDiamondsSpent: newSenderLifetimeSpent,
      updatedAt: timestamp,
    });
    transaction.update(senderUserRef, {
      coins: newSenderCoins,
      coinsBalance: newSenderCoins,
      diamonds: newSenderCoins,
      updatedAt: timestamp,
    });

    // Update Receiver Wallet & User profile cache
    if (!receiverWalletSnap.exists) {
      transaction.set(receiverWalletRef, {
        ...receiverWallet,
        diamonds: newReceiverDiamonds,
        diamondBalance: newReceiverDiamonds,
        availableDiamonds: newAvailableDiamonds,
        lifetimeDiamonds: newLifetimeDiamonds,
        beans: newReceiverDiamonds, // Legacy compatibility
        lifetimeBeansEarned: newLifetimeDiamonds,
      });
    } else {
      transaction.update(receiverWalletRef, {
        diamonds: newReceiverDiamonds,
        diamondBalance: newReceiverDiamonds,
        availableDiamonds: newAvailableDiamonds,
        lifetimeDiamonds: newLifetimeDiamonds,
        beans: newReceiverDiamonds,
        lifetimeBeansEarned: newLifetimeDiamonds,
        updatedAt: timestamp,
      });
    }
    transaction.update(receiverUserRef, {
      diamonds: newReceiverDiamonds,
      diamondBalance: newReceiverDiamonds,
      beans: newReceiverDiamonds,
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
      coinCost: giftCoinCost,
      diamondReward: giftDiamondReward,
      totalCoinsSpent,
      totalDiamondsEarned,
      priceDiamonds: giftCoinCost,
      totalDiamonds: totalCoinsSpent,
      platformCommissionPercent,
      platformDiamondsValue,
      receiverSharePercent,
      beansGenerated: finalDiamondsEarned,
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
      totalCoins: totalCoinsSpent,
      totalDiamonds: totalDiamondsEarned,
      beansGenerated: finalDiamondsEarned,
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

    // Create Audit Transactions
    transaction.set(senderTxRef, {
      id: senderTxRef.id,
      transactionId: senderTxRef.id,
      userId: senderId,
      type: 'GIFT_SENT',
      direction: 'debit',
      currency: 'coins',
      currencyType: 'coins',
      amount: totalCoinsSpent,
      balanceAfter: newSenderCoins,
      status: 'completed',
      description: `Envió ${quantity}x ${gift.name} a ${receiverUser.displayName || 'usuario'}`,
      recipientId: receiverId,
      relatedUserId: receiverId,
      relatedRoomId: targetType === 'room' ? targetId : null,
      relatedLiveId: targetType === 'live' ? targetId : null,
      relatedGiftId: giftId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    transaction.set(receiverTxRef, {
      id: receiverTxRef.id,
      transactionId: receiverTxRef.id,
      userId: receiverId,
      type: 'DIAMOND_EARNED',
      direction: 'credit',
      currency: 'diamonds',
      currencyType: 'diamonds',
      amount: finalDiamondsEarned,
      balanceAfter: newReceiverDiamonds,
      status: 'completed',
      description: `Recibió ${quantity}x ${gift.name} de ${senderUser.displayName || 'usuario'}`,
      recipientId: receiverId,
      relatedUserId: senderId,
      relatedRoomId: targetType === 'room' ? targetId : null,
      relatedLiveId: targetType === 'live' ? targetId : null,
      relatedGiftId: giftId,
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
      giftDiamonds: totalCoinsSpent,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Check if live stream is in active PK Battle
    if (targetType === 'live' && battle && targetSnap.exists) {
      const liveData = targetSnap.data();
      const activePkBattleId = liveData?.activePkBattleId;
      if (activePkBattleId) {
        const pkBattleRef = db.collection('pkBattles').doc(activePkBattleId);
        const isHostA = (liveData?.hostId || liveData?.ownerId) === receiverId;

        const currentPowerBar = isHostA ? (battle.hostAPowerBar || 0) : (battle.hostBPowerBar || 0);
        const currentDice = isHostA ? (battle.hostADiceAvailable || false) : (battle.hostBDiceAvailable || false);

        let newPowerBar = currentPowerBar + totalCoinsSpent;
        let diceAvailable = currentDice;

        if (newPowerBar >= 100) {
          diceAvailable = true;
          newPowerBar = newPowerBar % 100;
        }

        if (isHostA) {
          transaction.update(pkBattleRef, {
            hostAScore: admin.firestore.FieldValue.increment(scoreAddition),
            hostADiamonds: admin.firestore.FieldValue.increment(totalDiamondsEarned),
            hostAGiftsCount: admin.firestore.FieldValue.increment(quantity),
            hostAPowerBar: newPowerBar,
            hostADiceAvailable: diceAvailable,
            updatedAt: timestamp,
          });
        } else {
          transaction.update(pkBattleRef, {
            hostBScore: admin.firestore.FieldValue.increment(scoreAddition),
            hostBDiamonds: admin.firestore.FieldValue.increment(totalDiamondsEarned),
            hostBGiftsCount: admin.firestore.FieldValue.increment(quantity),
            hostBPowerBar: newPowerBar,
            hostBDiceAvailable: diceAvailable,
            updatedAt: timestamp,
          });
        }

        const contributionRef = db.collection('pkGiftContributions').doc();
        transaction.set(contributionRef, {
          id: contributionRef.id,
          pkBattleId: activePkBattleId,
          giftEventId: giftEventRef.id,
          senderId,
          receiverHostId: receiverId,
          giftId,
          giftName: gift.name,
          diamonds: totalDiamondsEarned,
          beansGenerated: totalDiamondsEarned,
          createdAt: timestamp,
        });
      }
    }

    // Update Room/Live/Game statistics
    transaction.update(targetRef, {
      giftsCount: admin.firestore.FieldValue.increment(quantity),
      diamondsGenerated: admin.firestore.FieldValue.increment(totalDiamondsEarned),
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
      totalDiamonds: admin.firestore.FieldValue.increment(totalDiamondsEarned),
      giftsCount: admin.firestore.FieldValue.increment(quantity),
      lastGiftAt: timestamp,
    }, { merge: true });
  });

  // Background operations
  try {
    const commissionBeans = await calculateAgencyCommission(receiverId, finalGiftEvent.id, totalDiamondsEarned);
    await recordGiftPlatformMargin(totalCoinsSpent, totalDiamondsEarned, commissionBeans);

    // Track gift in analytical collections
    try {
      const { recordGiftSent } = await import('./analyticsService');
      await recordGiftSent(
        senderId,
        receiverId,
        giftId,
        gift.name,
        totalCoinsSpent,
        totalDiamondsEarned,
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

    // Award XP and Recalculate VIP Level
    try {
      const { addXpToUser } = await import('./levelService');
      const { recalculateUserVip } = await import('./vipService');
      await addXpToUser(senderId, totalCoinsSpent * 10, 'gift_sent');
      await addXpToUser(receiverId, totalDiamondsEarned * 5, 'gift_received');
      await recalculateUserVip(senderId);
    } catch (xpErr) {
      console.error('Failed to update XP/VIP level post gift:', xpErr);
    }

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
            await updatePerformanceGifts(perfId, totalDiamondsEarned, totalDiamondsEarned);
          }
        }
      } catch (kErr) {
        console.error('Failed to update Karaoke performance stats:', kErr);
      }
    }
  } catch (commErr) {
    console.error('Failed post-gift background operations:', commErr);
  }

  return finalGiftEvent;
};
