import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { getGiftById } from '../services/firebase/firestore/giftsService';

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
              
              // Skip if created is null (local optimistic writes before server timestamp)
              if (!data.createdAt) return;

              let animationType: 'small' | 'medium' | 'big' | 'global' = 'small';
              try {
                const gift = await getGiftById(data.giftId);
                if (gift) {
                  animationType = gift.animationType;
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

              // Trigger full-screen animation overlay
              setLastEvent(event);

              // Add to side toast notifications queue
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

              // If legendary/global gift, also trigger top global marquee banner
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

  const dismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const dismissBanner = (id: string) => {
    setActiveBanners((prev) => prev.filter((b) => b.id !== id));
  };

  return {
    lastEvent,
    activeToasts,
    activeBanners,
    dismissToast,
    dismissBanner,
  };
};
