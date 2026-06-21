import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Room, RoomMember, ChatMessage, MicRequest } from '../types';
import { useAuth } from '../store/AuthContext';
import {
  getRoomById,
  joinRoom,
  leaveRoom,
  listenToRoom,
  listenToRoomMembers,
  endRoom as apiEndRoom,
} from '../services/firebase/firestore/roomsService';
import {
  assignSeat,
  removeFromSeat,
  muteMember,
  kickMember,
} from '../services/firebase/firestore/roomMembersService';
import {
  requestMic as apiRequestMic,
  cancelMicRequest as apiCancelMicRequest,
  approveMicRequest as apiApproveMicRequest,
  rejectMicRequest as apiRejectMicRequest,
  listenToPendingMicRequests,
} from '../services/firebase/firestore/micRequestsService';
import {
  sendRoomMessage,
  sendRoomEmoji,
  listenToRoomMessages,
  getOlderRoomMessages,
  hideRoomMessage,
  deleteOwnRoomMessage,
  reportRoomMessage,
} from '../services/firebase/firestore/messagesService';
import { sendUserJoinedMessage, sendUserLeftMessage } from '../services/firebase/firestore/roomSystemMessages';
import { blockUser, listenToBlockedUsers } from '../services/firebase/firestore/blocksService';
import { apiFetch } from '../services/api/apiClient';

export const useRoom = (roomId: string) => {
  const { userProfile } = useAuth();
  const profileRef = useRef(userProfile);
  
  useEffect(() => {
    profileRef.current = userProfile;
  }, [userProfile]);

  const userUid = userProfile?.uid;
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [micRequests, setMicRequests] = useState<MicRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Listen to blocked users list in real-time
  useEffect(() => {
    if (!userUid) {
      setBlockedUserIds([]);
      return;
    }
    const unsubscribe = listenToBlockedUsers(userUid, (ids) => {
      setBlockedUserIds(ids);
    });
    return () => unsubscribe();
  }, [userUid]);

  // Get current member inside this room
  const currentMember = useMemo(() => {
    if (!userUid) return null;
    return members.find(m => m.userId === userUid) || null;
  }, [members, userUid]);

  // Role helper
  const currentUserRole = useMemo(() => {
    return currentMember?.role || null;
  }, [currentMember]);

  // Is administrator or moderator?
  const isPrivileged = useMemo(() => {
    return currentUserRole === 'owner' || currentUserRole === 'host' || currentUserRole === 'moderator';
  }, [currentUserRole]);

  // Filter messages dynamically by locally blocked users or hidden/deleted status
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      // 1. Remove messages from blocked users
      if (blockedUserIds.includes(msg.senderId)) return false;
      return true;
    });
  }, [messages, blockedUserIds]);

  // First fetch and join
  useEffect(() => {
    if (!roomId || !userUid) return;

    let active = true;
    setLoading(true);
    setError(null);

    const initRoom = async () => {
      try {
        const currentProfile = profileRef.current;
        if (!currentProfile) return;

        const roomData = await getRoomById(roomId);
        if (!roomData) {
          if (active) {
            setError('La sala no existe o ha sido eliminada.');
            setLoading(false);
          }
          return;
        }

        // Join room in firestore
        const profileData = {
          uid: currentProfile.uid,
          displayName: currentProfile.displayName,
          photoURL: currentProfile.photoURL,
          username: currentProfile.username,
        };
        await joinRoom(roomId, profileData);
        await sendUserJoinedMessage(roomId, currentProfile.displayName);

        if (active) setLoading(false);
      } catch (err: any) {
        console.error('Error joining room:', err);
        if (active) {
          setError(err?.message || 'Error al entrar a la sala');
          setLoading(false);
        }
      }
    };

    initRoom();

    return () => {
      active = false;
    };
  }, [roomId, userUid]);

  // Real-time subscriptions
  useEffect(() => {
    if (!roomId || loading || error) return;

    // Listen to Room Document
    const unsubscribeRoom = listenToRoom(roomId, roomData => {
      setRoom(roomData);
    });

    // Listen to Members
    const unsubscribeMembers = listenToRoomMembers(roomId, membersData => {
      setMembers(membersData);
    });

    // Listen to Chat Messages
    const unsubscribeMessages = listenToRoomMessages(roomId, messagesData => {
      setMessages(messagesData);
    });

    return () => {
      unsubscribeRoom();
      unsubscribeMembers();
      unsubscribeMessages();
      const currentProfile = profileRef.current;
      if (currentProfile) {
        sendUserLeftMessage(roomId, currentProfile.displayName).catch(console.error);
      }
    };
  }, [roomId, loading, error]);

  // Real-time subscription to Mic Requests (only for privileged users)
  useEffect(() => {
    if (!roomId || !isPrivileged || loading || error) {
      setMicRequests([]);
      return;
    }

    const unsubscribeMicRequests = listenToPendingMicRequests(roomId, requests => {
      setMicRequests(requests);
    });

    return () => {
      unsubscribeMicRequests();
    };
  }, [roomId, isPrivileged, loading, error]);

  // Actions
  const join = useCallback(async () => {
    if (!roomId || !userProfile) return;
    const profileData = {
      uid: userProfile.uid,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      username: userProfile.username,
    };
    await joinRoom(roomId, profileData);
  }, [roomId, userProfile]);

  const leave = useCallback(async () => {
    if (!roomId || !userProfile) return;
    await leaveRoom(roomId, userProfile.uid);
  }, [roomId, userProfile]);

  const sendMessage = useCallback(async (text: string) => {
    if (!roomId || !userProfile || !text.trim()) return;
    const senderProfile = {
      uid: userProfile.uid,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      username: userProfile.username,
    };
    await sendRoomMessage(roomId, senderProfile, text.trim(), currentUserRole || 'listener');
  }, [roomId, userProfile, currentUserRole]);

  const sendEmoji = useCallback(async (emoji: string) => {
    if (!roomId || !userProfile) return;
    const senderProfile = {
      uid: userProfile.uid,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      username: userProfile.username,
    };
    await sendRoomEmoji(roomId, senderProfile, emoji, currentUserRole || 'listener');
  }, [roomId, userProfile, currentUserRole]);

  const hideMessageAction = useCallback(async (messageId: string, reason: string) => {
    if (!roomId || !userProfile) return;
    await hideRoomMessage(roomId, messageId, userProfile.uid, reason);
  }, [roomId, userProfile]);

  const deleteOwnMessageAction = useCallback(async (messageId: string) => {
    if (!roomId || !userProfile) return;
    await deleteOwnRoomMessage(roomId, messageId, userProfile.uid);
  }, [roomId, userProfile]);

  const reportMessageAction = useCallback(async (messageId: string, reason: string, description?: string) => {
    if (!roomId || !userProfile) return '';
    return await reportRoomMessage(roomId, messageId, userProfile.uid, reason, description);
  }, [roomId, userProfile]);

  const blockUserFromRoom = useCallback(async (targetUserId: string) => {
    if (!userProfile) return;
    await blockUser(userProfile.uid, targetUserId);
    setBlockedUserIds(prev => [...prev, targetUserId]);
  }, [userProfile]);

  const banMember = useCallback(async (targetUserId: string, reason?: string) => {
    if (!userProfile) return;
    try {
      await apiFetch(`/rooms/${roomId}/ban`, {
        method: 'POST',
        body: JSON.stringify({
          actorId: userProfile.uid,
          targetUserId,
          isPermanent: true,
          reason: reason || 'Bloqueado por el anfitrión',
        }),
      });
    } catch (e) {
      console.error('Failed to ban member:', e);
    }
  }, [roomId, userProfile]);

  const kickMember = useCallback(async (targetUserId: string, reason?: string) => {
    if (!userProfile) return;
    try {
      await apiFetch(`/rooms/${roomId}/kick`, {
        method: 'POST',
        body: JSON.stringify({
          actorId: userProfile.uid,
          targetUserId,
          reason: reason || 'Expulsado por el anfitrión',
        }),
      });
    } catch (e) {
      console.error('Failed to kick member:', e);
    }
  }, [roomId, userProfile]);

  const loadOlderMessages = useCallback(async () => {
    if (!roomId || messages.length === 0 || messagesLoading) return;
    setMessagesLoading(true);
    try {
      const oldestMessage = messages[0];
      const older = await getOlderRoomMessages(roomId, oldestMessage.createdAt);
      setMessages(prev => [...older, ...prev]);
    } catch (e) {
      console.error('Error loading older messages:', e);
    } finally {
      setMessagesLoading(false);
    }
  }, [roomId, messages, messagesLoading]);

  const requestMic = useCallback(async () => {
    if (!roomId || !userProfile) return;
    const profileData = {
      uid: userProfile.uid,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      username: userProfile.username,
    };
    await apiRequestMic(roomId, profileData);
  }, [roomId, userProfile]);

  const cancelMic = useCallback(async () => {
    if (!roomId || !userProfile) return;
    await apiCancelMicRequest(roomId, userProfile.uid);
  }, [roomId, userProfile]);

  const approveMic = useCallback(async (requestId: string, seatIndex: number) => {
    if (!roomId || !userProfile) return;
    await apiApproveMicRequest(roomId, requestId, userProfile.uid, seatIndex);
  }, [roomId, userProfile]);

  const rejectMic = useCallback(async (requestId: string) => {
    if (!roomId || !userProfile) return;
    await apiRejectMicRequest(roomId, requestId, userProfile.uid);
  }, [roomId, userProfile]);

  const promoteToHostAction = useCallback(async (targetUserId: string) => {
    if (!roomId || !userProfile) return;
    const { promoteToHost } = await import('../services/firebase/firestore/roomMembersService');
    await promoteToHost(roomId, targetUserId, userProfile.uid);
  }, [roomId, userProfile]);

  const removeHostAction = useCallback(async (targetUserId: string) => {
    if (!roomId || !userProfile) return;
    const { removeHost } = await import('../services/firebase/firestore/roomMembersService');
    await removeHost(roomId, targetUserId, userProfile.uid);
  }, [roomId, userProfile]);

  const promoteToModeratorAction = useCallback(async (targetUserId: string) => {
    if (!roomId || !userProfile) return;
    const { promoteToModerator } = await import('../services/firebase/firestore/roomMembersService');
    await promoteToModerator(roomId, targetUserId, userProfile.uid);
  }, [roomId, userProfile]);

  const removeModeratorAction = useCallback(async (targetUserId: string) => {
    if (!roomId || !userProfile) return;
    const { removeModerator } = await import('../services/firebase/firestore/roomMembersService');
    await removeModerator(roomId, targetUserId, userProfile.uid);
  }, [roomId, userProfile]);

  const promoteToSpeakerAction = useCallback(async (targetUserId: string, seatIndex?: number) => {
    if (!roomId || !userProfile) return;
    const { promoteToSpeaker } = await import('../services/firebase/firestore/roomMembersService');
    await promoteToSpeaker(roomId, targetUserId, userProfile.uid, seatIndex);
  }, [roomId, userProfile]);

  const removeSpeakerAction = useCallback(async (targetUserId: string) => {
    if (!roomId || !userProfile) return;
    const { removeSpeaker } = await import('../services/firebase/firestore/roomMembersService');
    await removeSpeaker(roomId, targetUserId, userProfile.uid);
  }, [roomId, userProfile]);

  const muteUser = useCallback(async (userId: string, isMuted: boolean) => {
    if (!roomId || !userProfile) return;
    await muteMember(roomId, userId, userProfile.uid, isMuted);
  }, [roomId, userProfile]);

  const removeUserFromSeat = useCallback(async (userId: string) => {
    if (!roomId || !userProfile) return;
    await removeFromSeat(roomId, userId, userProfile.uid);
  }, [roomId, userProfile]);


  const endRoom = useCallback(async () => {
    if (!roomId || !userProfile) return;
    await apiEndRoom(roomId, userProfile.uid);
  }, [roomId, userProfile]);

  return {
    room,
    members,
    messages: filteredMessages,
    micRequests,
    currentMember,
    currentUserRole,
    loading,
    error,
    messagesLoading,
    join,
    leave,
    sendMessage,
    sendEmoji,
    hideMessage: hideMessageAction,
    deleteOwnMessage: deleteOwnMessageAction,
    reportMessage: reportMessageAction,
    blockUserFromRoom,
    loadOlderMessages,
    requestMic,
    cancelMic,
    approveMic,
    rejectMic,
    promoteToHost: promoteToHostAction,
    removeHost: removeHostAction,
    promoteToModerator: promoteToModeratorAction,
    removeModerator: removeModeratorAction,
    promoteToSpeaker: promoteToSpeakerAction,
    removeSpeaker: removeSpeakerAction,
    muteMember: muteUser,
    removeFromSeat: removeUserFromSeat,
    kickMember,
    banMember,
    endRoom,
  };
};
