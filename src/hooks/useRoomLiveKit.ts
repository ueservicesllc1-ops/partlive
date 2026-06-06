import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  Room,
  RoomEvent,
  Track,
  Participant,
  RoomOptions,
  RemoteParticipant,
  LocalParticipant,
  ConnectionState,
} from 'livekit-client';
import { registerGlobals } from '@livekit/react-native-webrtc';
import { RoomMember } from '../types';
import { getLiveKitRoomToken } from '../services/api/livekitApi';
import { requestMicrophonePermission } from '../utils/permissions';

// Register WebRTC Globals for React Native WebRTC engine
if (Platform.OS !== 'web') {
  registerGlobals();
}

export const useRoomLiveKit = (
  roomId: string,
  currentUser: any,
  currentMember: RoomMember | null,
  currentUserRole: string | null,
  enabled: boolean = true
) => {
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMuted, setLocalMuted] = useState(false);
  const [canPublish, setCanPublish] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeSpeakers, setActiveSpeakers] = useState<Participant[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Keep references to prevent loop closures
  const isMutedFirestoreRef = useRef(currentMember?.isMuted || false);
  const roleFirestoreRef = useRef(currentUserRole);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    isMutedFirestoreRef.current = currentMember?.isMuted || false;
    roleFirestoreRef.current = currentUserRole;
  }, [currentMember, currentUserRole]);

  // Connect helper
  const connect = useCallback(async () => {
    if (!roomId || !currentUser || !enabled) return;

    setConnecting(true);
    setError(null);
    setConnectionState(ConnectionState.Connecting);

    try {
      // 1. Get token from backend
      const tokenData = await getLiveKitRoomToken(roomId);
      setCanPublish(tokenData.canPublish);

      // 2. Create LiveKit Room instance
      const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
      };

      const roomInstance = new Room(roomOptions);
      roomRef.current = roomInstance;

      // 3. Register Event Listeners
      roomInstance.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        setConnectionState(state);
      });

      roomInstance.on(RoomEvent.ParticipantConnected, () => {
        setParticipants(Array.from(roomInstance.remoteParticipants.values()));
      });

      roomInstance.on(RoomEvent.ParticipantDisconnected, () => {
        setParticipants(Array.from(roomInstance.remoteParticipants.values()));
      });

      roomInstance.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        setActiveSpeakers(speakers);
      });

      roomInstance.on(RoomEvent.Disconnected, () => {
        setConnectionState(ConnectionState.Disconnected);
      });

      // 4. Connect to WebRTC server
      await roomInstance.connect(tokenData.url, tokenData.token);
      setLivekitRoom(roomInstance);
      setParticipants(Array.from(roomInstance.remoteParticipants.values()));

      // 5. If role allows publishing, request mic permission and start audio track
      if (tokenData.canPublish) {
        const hasMicPerm = await requestMicrophonePermission();
        if (hasMicPerm) {
          const shouldBeMuted = isMutedFirestoreRef.current;
          await roomInstance.localParticipant.setMicrophoneEnabled(!shouldBeMuted);
          setLocalMuted(shouldBeMuted);
          setIsPublishing(true);
        } else {
          setError('Permiso de micrófono denegado. Solo escuchando.');
        }
      }
    } catch (err: any) {
      console.error('LiveKit connection error:', err);
      setError(err?.message || 'Error al conectar al servidor de audio');
      setConnectionState(ConnectionState.Disconnected);
    } finally {
      setConnecting(false);
    }
  }, [roomId, currentUser, enabled]);

  // Disconnect helper
  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      try {
        roomRef.current.removeAllListeners();
        await roomRef.current.disconnect();
      } catch (e) {
        console.error('Error disconnecting LiveKit room:', e);
      }
      roomRef.current = null;
    }
    setLivekitRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    setIsPublishing(false);
    setActiveSpeakers([]);
    setParticipants([]);
  }, []);

  // Connect on mount
  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  // Listen for Firestore mute changes dynamically
  useEffect(() => {
    const applyMute = async () => {
      const roomInstance = roomRef.current;
      if (roomInstance && isPublishing) {
        const shouldMute = currentMember?.isMuted || false;
        if (roomInstance.localParticipant.isMicrophoneEnabled === shouldMute) {
          await roomInstance.localParticipant.setMicrophoneEnabled(!shouldMute);
          setLocalMuted(shouldMute);
        }
      }
    };
    applyMute();
  }, [currentMember?.isMuted, isPublishing]);

  // Handle dynamic Role Upgrade/Downgrade (eg. Listener <=> Speaker)
  useEffect(() => {
    if (!livekitRoom || connectionState !== ConnectionState.Connected) return;

    const handleRoleUpdate = async () => {
      const isPrivileged = ['owner', 'host', 'moderator', 'speaker'].includes(currentUserRole || '');
      
      // If upgraded and not yet publishing, request token and reconnect to publish
      if (isPrivileged && !isPublishing) {
        await disconnect();
        await connect();
      }
      // If downgraded to listener and publishing, disable track
      else if (!isPrivileged && isPublishing) {
        await livekitRoom.localParticipant.setMicrophoneEnabled(false);
        setIsPublishing(false);
        setCanPublish(false);
        await disconnect();
        await connect();
      }
    };

    handleRoleUpdate();
  }, [currentUserRole, livekitRoom, connectionState, isPublishing, connect, disconnect]);

  // Toggle local mute
  const toggleMute = async () => {
    const roomInstance = roomRef.current;
    if (!roomInstance || !isPublishing) return;

    try {
      const newMuteState = !localMuted;
      await roomInstance.localParticipant.setMicrophoneEnabled(!newMuteState);
      setLocalMuted(newMuteState);
    } catch (e) {
      console.error('Error toggling mute:', e);
    }
  };

  return {
    livekitRoom,
    connected: connectionState === ConnectionState.Connected,
    connecting,
    error,
    localMuted,
    canPublish,
    participants,
    activeSpeakers,
    isPublishing,
    toggleMute,
    disconnect,
    reconnect: connect,
  };
};
