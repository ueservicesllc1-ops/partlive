import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  RoomEvent,
  Participant,
  RoomOptions,
  LogLevel,
  setLogLevel,
} from 'livekit-client';
import { AudioSession } from '@livekit/react-native';
import { RoomMember } from '../types';
import { getLiveKitRoomToken } from '../services/api/livekitApi';
import {
  checkDevicePermission,
  requestDevicePermission,
  showPermissionBlockedAlert,
} from '../utils/permissions';
import { LIVEKIT_CONFIG } from '../config/livekit';

// Enable verbose LiveKit logs to capture exact details in logcat
setLogLevel(LogLevel.debug);

// Safe local ConnectionState definition compatible with livekit-client ConnectionState strings
const ConnectionState = {
  Disconnected: 'disconnected',
  Connecting: 'connecting',
  Connected: 'connected',
  Reconnecting: 'reconnecting',
} as const;


export const useRoomLiveKit = (
  roomId: string,
  currentUser: any,
  currentMember: RoomMember | null,
  currentUserRole: string | null,
  enabled: boolean = true
) => {
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<any>(ConnectionState.Disconnected);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMuted, setLocalMuted] = useState(false);
  const [canPublish, setCanPublish] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeSpeakers, setActiveSpeakers] = useState<Participant[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Keep references to prevent loop closures
  const isMutedFirestoreRef = useRef(currentMember?.isMuted || false);
  const roleFirestoreRef = useRef(currentUserRole);
  const hasSeatInit = currentMember?.seatIndex !== undefined;
  const isPrivilegedInit = ['owner', 'host', 'moderator', 'speaker'].includes(currentUserRole || '') || hasSeatInit;
  const prevPrivilegedRef = useRef<boolean>(isPrivilegedInit);
  const isReconnectingRef = useRef(false);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    isMutedFirestoreRef.current = currentMember?.isMuted || false;
  }, [currentMember?.isMuted]);

  // Connect helper
  const connect = useCallback(async () => {
    if (!roomId || !currentUser || !enabled) return;

    setConnecting(true);
    setError(null);
    setConnectionState(ConnectionState.Connecting);

    try {
      // 1. Get token from backend
      const tokenData = await getLiveKitRoomToken(roomId);

      // 2. Create LiveKit Room instance with high fidelity audio settings (Karaoke Mode)
      const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          channelCount: 2, // Stereo if supported
        },
      };

      const roomInstance = new Room(roomOptions);
      roomRef.current = roomInstance;

      // 3. Register Event Listeners
      roomInstance.on(RoomEvent.ConnectionStateChanged, (state: any) => {
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

      // 3.5 Start native AudioSession before connecting (required for Android WebRTC)
      try {
        await AudioSession.startAudioSession();
      } catch (audioErr) {
        console.warn('[LiveKit] Failed to start native AudioSession:', audioErr);
      }

      // 4. Connect to WebRTC server (prioritize dynamic URL from token response)
      const connectionUrl = tokenData.url || LIVEKIT_CONFIG.LIVEKIT_WS_URL;
      await roomInstance.connect(connectionUrl, tokenData.token);
      setLivekitRoom(roomInstance);
      setParticipants(Array.from(roomInstance.remoteParticipants.values()));

      // 5. If role allows publishing, request mic permission and start audio track
      const isPrivilegedUser =
        ['owner', 'host', 'moderator', 'speaker'].includes(roleFirestoreRef.current || '') ||
        (currentMember?.seatIndex !== undefined);

      if (tokenData.canPublish || isPrivilegedUser) {
        setCanPublish(true);
        const micStatus = await checkDevicePermission('microphone');
        if (micStatus === 'granted') {
          const shouldBeMuted = isMutedFirestoreRef.current;
          await roomInstance.localParticipant.setMicrophoneEnabled(!shouldBeMuted);
          setLocalMuted(shouldBeMuted);
          setIsPublishing(!shouldBeMuted);
        } else if (micStatus === 'blocked') {
          setError('Micrófono bloqueado en ajustes.');
          showPermissionBlockedAlert(
            'Para usar esta función necesitamos permiso de micrófono. Actívalo para poder hablar.'
          );
        } else {
          const reqStatus = await requestDevicePermission('microphone');
          if (reqStatus === 'granted') {
            const shouldBeMuted = isMutedFirestoreRef.current;
            await roomInstance.localParticipant.setMicrophoneEnabled(!shouldBeMuted);
            setLocalMuted(shouldBeMuted);
            setIsPublishing(!shouldBeMuted);
          } else {
            setError('Permiso de micrófono denegado. Solo escuchando.');
            if (reqStatus === 'blocked') {
              showPermissionBlockedAlert(
                'Para usar esta función necesitamos permiso de micrófono. Actívalo para poder hablar.'
              );
            }
          }
        }
      } else {
        setCanPublish(false);
      }
    } catch (err: any) {
      console.error('LiveKit connection error:', err);
      setError(err?.message || 'Error al conectar al servidor de audio');
      setConnectionState(ConnectionState.Disconnected);
    } finally {
      setConnecting(false);
    }
  }, [roomId, currentUser, enabled, currentMember?.seatIndex]);

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
    try {
      await AudioSession.stopAudioSession();
    } catch (e) {
      console.warn('[LiveKit] Error stopping AudioSession:', e);
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
      if (roomInstance && roomInstance.localParticipant) {
        const hasSeat = currentMember?.seatIndex !== undefined;
        const isPrivileged = ['owner', 'host', 'moderator', 'speaker'].includes(currentUserRole || '');
        
        if (hasSeat || isPrivileged) {
          const shouldMute = currentMember?.isMuted || false;
          try {
            if (roomInstance.localParticipant.isMicrophoneEnabled === shouldMute) {
              await roomInstance.localParticipant.setMicrophoneEnabled(!shouldMute);
            }
            setLocalMuted(shouldMute);
            setIsPublishing(!shouldMute);
          } catch (err) {
            console.warn('[LiveKit] Error applying mute state:', err);
          }
        }
      }
    };
    applyMute();
  }, [currentMember?.isMuted, currentMember?.seatIndex, currentUserRole]);

  // Handle dynamic Role Upgrade/Downgrade (eg. Listener <=> Speaker)
  useEffect(() => {
    const hasSeat = currentMember?.seatIndex !== undefined;
    const isPrivileged = ['owner', 'host', 'moderator', 'speaker'].includes(currentUserRole || '') || hasSeat;
    const wasPrivileged = prevPrivilegedRef.current;

    if (isPrivileged === wasPrivileged) return;
    prevPrivilegedRef.current = isPrivileged;
    roleFirestoreRef.current = currentUserRole;

    if (!livekitRoom || connectionState !== ConnectionState.Connected) return;
    if (isReconnectingRef.current) return;

    const handleRoleUpdate = async () => {
      // Role went from unprivileged → privileged: reconnect to get publish token & start mic
      if (isPrivileged && !wasPrivileged) {
        isReconnectingRef.current = true;
        setIsReconnecting(true);
        try {
          await disconnect();
          await connect();
        } finally {
          isReconnectingRef.current = false;
          setIsReconnecting(false);
        }
      }
      // Role went from privileged → unprivileged: stop mic and reconnect as listener
      else if (!isPrivileged && wasPrivileged) {
        isReconnectingRef.current = true;
        setIsReconnecting(true);
        try {
          if (livekitRoom?.localParticipant) {
            await livekitRoom.localParticipant.setMicrophoneEnabled(false);
          }
          setIsPublishing(false);
          setCanPublish(false);
          await disconnect();
          await connect();
        } finally {
          isReconnectingRef.current = false;
          setIsReconnecting(false);
        }
      }
    };

    handleRoleUpdate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserRole, currentMember?.seatIndex, connectionState]);

  // Toggle local mute
  const toggleMute = async () => {
    const roomInstance = roomRef.current;
    if (!roomInstance || !roomInstance.localParticipant) return;

    try {
      const micStatus = await checkDevicePermission('microphone');
      if (micStatus !== 'granted') {
        const req = await requestDevicePermission('microphone');
        if (req !== 'granted') {
          showPermissionBlockedAlert('Activa el permiso de micrófono para poder hablar.');
          return;
        }
      }

      const newMuteState = !localMuted;
      await roomInstance.localParticipant.setMicrophoneEnabled(!newMuteState);
      setLocalMuted(newMuteState);
      setIsPublishing(!newMuteState);
    } catch (e) {
      console.error('Error toggling mute:', e);
    }
  };

  return {
    livekitRoom,
    connected: connectionState === ConnectionState.Connected,
    connecting: connecting || isReconnecting,
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
