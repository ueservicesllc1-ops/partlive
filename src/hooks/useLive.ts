import { useState, useEffect, useCallback, useMemo } from 'react';
import { LiveStream, LiveViewer, LiveMessage } from '../types/live';
import { useAuth } from '../store/AuthContext';
import {
  getLiveById,
  joinLive,
  leaveLive,
  listenToLive,
  likeLive as apiLikeLive,
  unlikeLive as apiUnlikeLive,
  endLive as apiEndLive,
} from '../services/firebase/firestore/livesService';
import {
  sendLiveMessage,
  sendLiveEmoji,
  listenToLiveMessages,
  hideLiveMessage,
  reportLiveMessage,
  deleteOwnLiveMessage,
} from '../services/firebase/firestore/liveMessagesService';
import {
  addLiveModerator,
  removeLiveModerator,
  muteLiveViewer,
  kickLiveViewer,
  listenToLiveViewers,
} from '../services/firebase/firestore/liveViewersService';
import {
  sendLiveGift,
  listenToLiveGiftEvents,
} from '../services/firebase/firestore/liveGiftEventsService';
import { Gift } from '../types';

export const useLive = (liveId: string) => {
  const { userProfile } = useAuth();
  const [live, setLive] = useState<LiveStream | null>(null);
  const [viewers, setViewers] = useState<LiveViewer[]>([]);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [giftEvents, setGiftEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  // Get current user viewer document
  const currentViewer = useMemo(() => {
    if (!userProfile) return null;
    return viewers.find(v => v.userId === userProfile.uid) || null;
  }, [viewers, userProfile]);

  // Evaluate current user role
  const currentUserRole = useMemo(() => {
    if (live?.hostId === userProfile?.uid) return 'host';
    return currentViewer?.role || 'viewer';
  }, [live, currentViewer, userProfile]);

  // Filter messages dynamically (by blocked status, hidden status, etc.)
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      if (blockedUserIds.includes(msg.senderId)) return false;
      return true;
    });
  }, [messages, blockedUserIds]);

  // Join live stream automatically
  useEffect(() => {
    if (!liveId || !userProfile) return;

    let active = true;
    setLoading(true);
    setError(null);

    const initLive = async () => {
      try {
        const liveData = await getLiveById(liveId);
        if (!liveData) {
          if (active) {
            setError('La transmisión no existe o ha sido finalizada.');
            setLoading(false);
          }
          return;
        }

        const profileData = {
          uid: userProfile.uid,
          displayName: userProfile.displayName || 'User',
          photoURL: userProfile.photoURL,
          username: userProfile.username,
        };

        await joinLive(liveId, profileData);
        if (active) {
          setJoined(true);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error joining live:', err);
        if (active) {
          setError(err?.message || 'Error al entrar al live');
          setLoading(false);
        }
      }
    };

    initLive();

    return () => {
      active = false;
    };
  }, [liveId, userProfile]);

  // Real-time subscriptions
  useEffect(() => {
    if (!liveId || loading || error) return;

    const unsubscribeLive = listenToLive(liveId, liveData => {
      setLive(liveData);
    });

    const unsubscribeViewers = listenToLiveViewers(liveId, (viewersData: LiveViewer[]) => {
      setViewers(viewersData);
    });

    const unsubscribeMessages = listenToLiveMessages(liveId, messagesData => {
      setMessages(messagesData);
    });

    const unsubscribeGifts = listenToLiveGiftEvents(liveId, giftsData => {
      setGiftEvents(giftsData);
    });

    return () => {
      unsubscribeLive();
      unsubscribeViewers();
      unsubscribeMessages();
      unsubscribeGifts();
      if (userProfile) {
        leaveLive(liveId, userProfile.uid).catch(console.error);
      }
    };
  }, [liveId, loading, error, userProfile]);

  // Actions
  const join = useCallback(async () => {
    if (!liveId || !userProfile) return;
    const profileData = {
      uid: userProfile.uid,
      displayName: userProfile.displayName || 'User',
      photoURL: userProfile.photoURL,
      username: userProfile.username,
    };
    await joinLive(liveId, profileData);
    setJoined(true);
  }, [liveId, userProfile]);

  const leave = useCallback(async () => {
    if (!liveId || !userProfile) return;
    await leaveLive(liveId, userProfile.uid);
    setJoined(false);
  }, [liveId, userProfile]);

  const sendMessage = useCallback(async (text: string) => {
    if (!liveId || !userProfile || !text.trim()) return;
    if (live && !live.allowChat && currentUserRole !== 'host') {
      throw new Error('El chat está deshabilitado en este live.');
    }
    const senderProfile = {
      uid: userProfile.uid,
      displayName: userProfile.displayName || 'User',
      photoURL: userProfile.photoURL,
      username: userProfile.username,
    };
    await sendLiveMessage(liveId, senderProfile, text.trim(), currentUserRole);
  }, [liveId, userProfile, currentUserRole, live]);

  const sendEmoji = useCallback(async (emoji: string) => {
    if (!liveId || !userProfile) return;
    if (live && !live.allowChat && currentUserRole !== 'host') {
      throw new Error('El chat está deshabilitado en este live.');
    }
    const senderProfile = {
      uid: userProfile.uid,
      displayName: userProfile.displayName || 'User',
      photoURL: userProfile.photoURL,
      username: userProfile.username,
    };
    await sendLiveEmoji(liveId, senderProfile, emoji, currentUserRole);
  }, [liveId, userProfile, currentUserRole, live]);

  const sendGiftAction = useCallback(async (gift: Gift, quantity: number = 1) => {
    if (!liveId || !userProfile || !live) return;
    if (!live.allowGifts && currentUserRole !== 'host') {
      throw new Error('Los regalos están deshabilitados en este live.');
    }
    const senderProfile = {
      uid: userProfile.uid,
      displayName: userProfile.displayName || 'User',
    };
    const receiverProfile = {
      uid: live.hostId,
      displayName: live.hostName,
    };
    await sendLiveGift(liveId, senderProfile, receiverProfile, gift, quantity);
  }, [liveId, userProfile, live, currentUserRole]);

  const like = useCallback(async () => {
    if (!liveId || !userProfile) return;
    await apiLikeLive(liveId, {
      uid: userProfile.uid,
      displayName: userProfile.displayName || 'User',
    });
    setLiked(true);
  }, [liveId, userProfile]);

  const unlike = useCallback(async () => {
    if (!liveId || !userProfile) return;
    await apiUnlikeLive(liveId, userProfile.uid);
    setLiked(false);
  }, [liveId, userProfile]);

  const hideMessageAction = useCallback(async (messageId: string, reason: string) => {
    if (!liveId || !userProfile) return;
    await hideLiveMessage(liveId, messageId, userProfile.uid, reason);
  }, [liveId, userProfile]);

  const reportMessageAction = useCallback(async (messageId: string, reason: string, description?: string) => {
    if (!liveId || !userProfile) return '';
    return await reportLiveMessage(liveId, messageId, userProfile.uid, reason, description);
  }, [liveId, userProfile]);

  const muteViewerAction = useCallback(async (targetUserId: string, isMuted: boolean) => {
    if (!liveId || !userProfile) return;
    await muteLiveViewer(liveId, targetUserId, userProfile.uid, isMuted);
  }, [liveId, userProfile]);

  const kickViewerAction = useCallback(async (targetUserId: string) => {
    if (!liveId || !userProfile) return;
    await kickLiveViewer(liveId, targetUserId, userProfile.uid);
  }, [liveId, userProfile]);

  const addModeratorAction = useCallback(async (targetUserId: string) => {
    if (!liveId || !userProfile) return;
    await addLiveModerator(liveId, targetUserId, userProfile.uid);
  }, [liveId, userProfile]);

  const removeModeratorAction = useCallback(async (targetUserId: string) => {
    if (!liveId || !userProfile) return;
    await removeLiveModerator(liveId, targetUserId, userProfile.uid);
  }, [liveId, userProfile]);

  const endLive = useCallback(async () => {
    if (!liveId || !userProfile) return;
    await apiEndLive(liveId, userProfile.uid);
  }, [liveId, userProfile]);

  const refresh = useCallback(async () => {
    if (!liveId) return;
    try {
      const liveData = await getLiveById(liveId);
      setLive(liveData);
    } catch (e) {
      console.error(e);
    }
  }, [liveId]);

  return {
    live,
    viewers,
    messages: filteredMessages,
    giftEvents,
    currentViewer,
    currentUserRole,
    loading,
    error,
    joined,
    liked,
    join,
    leave,
    sendMessage,
    sendEmoji,
    sendGift: sendGiftAction,
    like,
    unlike,
    hideMessage: hideMessageAction,
    reportMessage: reportMessageAction,
    muteMember: muteViewerAction,
    kickViewer: kickViewerAction,
    addModerator: addModeratorAction,
    removeModerator: removeModeratorAction,
    endLive,
    refresh,
  };
};
