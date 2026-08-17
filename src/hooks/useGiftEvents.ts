import { useEffect, useState, useCallback, useRef } from 'react';
import firestore from '@react-native-firebase/firestore';
import { getGiftById } from '../services/firebase/firestore/giftsService';
import { GiftEventQueue } from '../services/gifts/GiftEventQueue';
import { RecentGiftItem } from '../components/lives/RecentGiftsTicker';

export interface GiftAnimationEvent {
  id: string;
  giftId: string;
  giftName: string;
  giftIconUrl: string;
  senderId: string;
  senderName: string;
  receiverName: string;
  quantity: number;
  animationType: 'small' | 'medium' | 'big' | 'global';
  createdAt: any;
}

export const useGiftEvents = (
  targetType: 'room' | 'live' | 'game',
  targetId: string
) => {
  const [lastEvent, setLastEvent] = useState<GiftAnimationEvent | null>(null);
  const [activeToasts, setActiveToasts] = useState<any[]>([]);
  const [activeBanners, setActiveBanners] = useState<any[]>([]);
  const [recentGifts, setRecentGifts] = useState<RecentGiftItem[]>([]);

  // Combo tracking state
  const [comboCount, setComboCount] = useState(1);
  const [comboSenderName, setComboSenderName] = useState('');
  const [comboGiftName, setComboGiftName] = useState('');
  const [comboEmoji, setComboEmoji] = useState('🎁');
  const [comboVisible, setComboVisible] = useState(false);

  const lastComboRef = useRef<{ senderId: string; giftId: string; time: number }>({
    senderId: '',
    giftId: '',
    time: 0,
  });
  const comboTimerRef = useRef<any>(null);

  useEffect(() => {
    // Connect queue playback to component state
    GiftEventQueue.setPlayCallback((event) => {
      setLastEvent(event);
      setTimeout(() => {
        GiftEventQueue.finishAnimation();
      }, 2500);
    });

    return () => {
      GiftEventQueue.clearQueue();
    };
  }, []);

  useEffect(() => {
    if (!targetId) return;

    let path = '';
    if (targetType === 'room') {
      path = `rooms/${targetId}/giftEvents`;
    } else if (targetType === 'live') {
      path = `lives/${targetId}/giftEvents`;
    } else if (targetType === 'game') {
      path = `gameSessions/${targetId}/giftEvents`;
    }

    if (!path) return;

    // Listen only to events created after hook is loaded to prevent old logs playing
    const subscribeTime = firestore.Timestamp.now();

    const unsubscribe = firestore()
      .collection(path)
      .where('createdAt', '>=', subscribeTime)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) return;

          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (!data.createdAt) return;

              let animationType: 'small' | 'medium' | 'big' | 'global' = 'small';
              try {
                const gift = await getGiftById(data.giftId);
                if (gift) {
                  animationType = gift.animationType || 'small';
                }
              } catch (err) {
                console.error('[useGiftEvents] Failed to fetch gift details:', err);
              }

              const event: GiftAnimationEvent = {
                id: change.doc.id,
                giftId: data.giftId,
                giftName: data.giftName || 'Regalo',
                giftIconUrl: data.giftIconUrl || data.giftIconEmoji || '🎁',
                senderId: data.senderId,
                senderName: data.senderName || 'Usuario',
                receiverName: data.receiverName || 'Host',
                quantity: data.quantity || 1,
                animationType,
                createdAt: data.createdAt,
              };

              // Enqueue into GiftEventQueue
              GiftEventQueue.enqueue(event);

              // Update Recent Gifts Ticker
              setRecentGifts((prev) => [
                ...prev.slice(-10),
                {
                  id: event.id,
                  senderName: event.senderName,
                  giftName: event.giftName,
                  giftEmoji: event.giftIconUrl,
                  quantity: event.quantity,
                },
              ]);

              // Manage Combo Logic
              const now = Date.now();
              const isSameSenderAndGift =
                lastComboRef.current.senderId === event.senderId &&
                lastComboRef.current.giftId === event.giftId &&
                now - lastComboRef.current.time < 3500;

              if (isSameSenderAndGift) {
                setComboCount((c) => c + event.quantity);
              } else {
                setComboCount(event.quantity);
                setComboSenderName(event.senderName);
                setComboGiftName(event.giftName);
                setComboEmoji(event.giftIconUrl);
              }

              lastComboRef.current = {
                senderId: event.senderId,
                giftId: event.giftId,
                time: now,
              };

              setComboVisible(true);
              if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
              comboTimerRef.current = setTimeout(() => {
                setComboVisible(false);
              }, 3000);

              // Add side toast notification
              setActiveToasts((prev) => [
                ...prev,
                {
                  id: event.id,
                  senderName: event.senderName,
                  receiverName: event.receiverName,
                  giftName: event.giftName,
                  giftIconEmoji: event.giftIconUrl,
                  quantity: event.quantity,
                },
              ]);

              // If global gift, trigger top global marquee banner
              if (animationType === 'global') {
                setActiveBanners((prev) => [
                  ...prev,
                  {
                    id: event.id,
                    senderName: event.senderName,
                    receiverName: event.receiverName,
                    giftName: event.giftName,
                    giftIconEmoji: event.giftIconUrl,
                  },
                ]);
              }
            }
          });
        },
        (error) => {
          console.error('[useGiftEvents] Realtime listener error:', error);
        }
      );

    return () => unsubscribe();
  }, [targetType, targetId]);

  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissBanner = useCallback((id: string) => {
    setActiveBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return {
    lastEvent,
    activeToasts,
    activeBanners,
    recentGifts,
    comboCount,
    comboSenderName,
    comboGiftName,
    comboEmoji,
    comboVisible,
    dismissToast,
    dismissBanner,
  };
};
