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
import { getLiveKitLiveToken } from '../services/api/livekitApi';
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

export const useLiveKitLive = (
  liveId: string,
  currentUser: any,
  currentViewer: any,
  currentUserRole: string | null,
  enabled: boolean = true
) => {
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<any>(ConnectionState.Disconnected);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [localMuted, setLocalMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const roomRef = useRef<Room | null>(null);
  const roleRef = useRef(currentUserRole);
  const isMutedFirestoreRef = useRef(currentViewer?.isMuted || false);

  useEffect(() => {
    isMutedFirestoreRef.current = currentViewer?.isMuted || false;
  }, [currentViewer]);

  const connect = useCallback(async () => {
    if (!liveId || !currentUser || !enabled) return;

    setConnecting(true);
    setError(null);
    setConnectionState(ConnectionState.Connecting);

    try {
      // 1. Fetch live kit token specifically for live streams
      const tokenData = await getLiveKitLiveToken(liveId);

      // 2. Setup room options
      const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
      };

      const roomInstance = new Room(roomOptions);
      roomRef.current = roomInstance;

      // 3. Register listeners
      roomInstance.on(RoomEvent.ConnectionStateChanged, (state: any) => {
        setConnectionState(state);
      });

      roomInstance.on(RoomEvent.ParticipantConnected, () => {
        setParticipants(Array.from(roomInstance.remoteParticipants.values()));
      });

      roomInstance.on(RoomEvent.ParticipantDisconnected, () => {
        setParticipants(Array.from(roomInstance.remoteParticipants.values()));
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

      // 4. Connect to server (prioritize dynamic URL from token response)
      const connectionUrl = tokenData.url || LIVEKIT_CONFIG.LIVEKIT_WS_URL;
      await roomInstance.connect(connectionUrl, tokenData.token);
      setLivekitRoom(roomInstance);
      setParticipants(Array.from(roomInstance.remoteParticipants.values()));

      // 5. If role allows publishing, request mic and camera permissions and start tracks
      if (tokenData.canPublish) {
        const micStatus = await checkDevicePermission('microphone');
        const cameraStatus = await checkDevicePermission('camera');

        let hasMic = micStatus === 'granted';
        let hasCamera = cameraStatus === 'granted';

        if (micStatus !== 'granted' && micStatus !== 'blocked') {
          const reqMic = await requestDevicePermission('microphone');
          if (reqMic === 'granted') hasMic = true;
        }

        if (cameraStatus !== 'granted' && cameraStatus !== 'blocked') {
          const reqCamera = await requestDevicePermission('camera');
          if (reqCamera === 'granted') hasCamera = true;
        }

        const shouldBeMuted = isMutedFirestoreRef.current;

        if (hasMic) {
          await roomInstance.localParticipant.setMicrophoneEnabled(!shouldBeMuted);
          setLocalMuted(shouldBeMuted);
        } else {
          setLocalMuted(true);
        }

        if (hasCamera) {
          await roomInstance.localParticipant.setCameraEnabled(true);
          setCameraEnabled(true);
        } else {
          setCameraEnabled(false);
        }

        if (hasMic || hasCamera) {
          setIsPublishing(true);
        }
      }
    } catch (err: any) {
      console.error('LiveKit connection error:', err);
      setError(err?.message || 'Error al conectar al servidor de transmisiones');
      setConnectionState(ConnectionState.Disconnected);
    } finally {
      setConnecting(false);
    }
  }, [liveId, currentUser, enabled]);

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
    setParticipants([]);
  }, []);

  // Listen for Firestore mute changes dynamically
  useEffect(() => {
    const applyMute = async () => {
      const roomInstance = roomRef.current;
      if (roomInstance && isPublishing) {
        const shouldMute = currentViewer?.isMuted || false;
        if (roomInstance.localParticipant.isMicrophoneEnabled === shouldMute) {
          await roomInstance.localParticipant.setMicrophoneEnabled(!shouldMute);
          setLocalMuted(shouldMute);
        }
      }
    };
    applyMute();
  }, [currentViewer?.isMuted, isPublishing]);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  // Handle dynamic Role Upgrade/Downgrade (e.g. Co-Host <=> Viewer)
  useEffect(() => {
    if (!livekitRoom || connectionState !== ConnectionState.Connected) return;

    const prevRole = roleRef.current;
    const newRole = currentUserRole;

    if (prevRole === newRole) return;
    roleRef.current = newRole;

    const handleRoleUpdate = async () => {
      const wasPrivileged = ['host', 'cohost'].includes(prevRole || '');
      const isPrivilegedNow = ['host', 'cohost'].includes(newRole || '');

      if (isPrivilegedNow !== wasPrivileged) {
        console.log(`Co-hosting privileges changed from ${prevRole} to ${newRole}, reconnecting LiveKit...`);
        await disconnect();
        await connect();
      }
    };

    handleRoleUpdate();
  }, [currentUserRole, connectionState, livekitRoom, connect, disconnect]);

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

  // Toggle local camera
  const toggleCamera = async () => {
    const roomInstance = roomRef.current;
    if (!roomInstance || !isPublishing) return;

    try {
      const newCameraState = !cameraEnabled;
      await roomInstance.localParticipant.setCameraEnabled(newCameraState);
      setCameraEnabled(newCameraState);
    } catch (e) {
      console.error('Error toggling camera:', e);
    }
  };

  return {
    livekitRoom,
    connected: connectionState === ConnectionState.Connected,
    connecting,
    error,
    participants,
    isPublishing,
    localMuted,
    cameraEnabled,
    toggleMute,
    toggleCamera,
    disconnect,
    reconnect: connect,
  };
};



