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
  const isReconnectingRef = useRef(false);
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
      if (tokenData.canPublish) {
        const micStatus = await checkDevicePermission('microphone');
        if (micStatus === 'granted') {
          const shouldBeMuted = isMutedFirestoreRef.current;
          await roomInstance.localParticipant.setMicrophoneEnabled(!shouldBeMuted);
          setLocalMuted(shouldBeMuted);
          setIsPublishing(true);
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
            setIsPublishing(true);
          } else {
            setError('Permiso de micrófono denegado. Solo escuchando.');
            if (reqStatus === 'blocked') {
              showPermissionBlockedAlert(
                'Para usar esta función necesitamos permiso de micrófono. Actívalo para poder hablar.'
              );
            }
          }
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
      if (roomInstance && isPublishing) {
        const shouldMute = currentMember?.isMuted || false;
        // Fix: isMicrophoneEnabled is the OPPOSITE of muted state
        // We only apply if the current state does NOT match the desired state
        if (roomInstance.localParticipant.isMicrophoneEnabled === shouldMute) {
          // isMicrophoneEnabled === shouldMute means:
          //   - if shouldMute=true and mic is enabled → need to disable
          //   - if shouldMute=false and mic is disabled → need to enable
          await roomInstance.localParticipant.setMicrophoneEnabled(!shouldMute);
          setLocalMuted(shouldMute);
        }
      }
    };
    applyMute();
  }, [currentMember?.isMuted, isPublishing]);

  // Handle dynamic Role Upgrade/Downgrade (eg. Listener <=> Speaker)
  // Uses a ref to prevent infinite reconnect loops
  useEffect(() => {
    if (!livekitRoom || connectionState !== ConnectionState.Connected) return;
    if (isReconnectingRef.current) return;

    const prevRole = roleFirestoreRef.current;
    const newRole = currentUserRole;

    // Only reconnect when role actually changed
    if (prevRole === newRole) return;
    roleFirestoreRef.current = newRole;

    const handleRoleUpdate = async () => {
      const isPrivileged = ['owner', 'host', 'moderator', 'speaker'].includes(newRole || '');
      const wasPrivileged = ['owner', 'host', 'moderator', 'speaker'].includes(prevRole || '');

      // Role went from unprivileged → privileged: reconnect to get publish token
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
      else if (!isPrivileged && wasPrivileged && isPublishing) {
        isReconnectingRef.current = true;
        setIsReconnecting(true);
        try {
          await livekitRoom.localParticipant.setMicrophoneEnabled(false);
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
  }, [currentUserRole, connectionState]);

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
