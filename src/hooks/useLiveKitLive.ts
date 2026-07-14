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
  const [videoTracks, setVideoTracks] = useState<{ participantSid: string; track: any; identity: string }[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [localMuted, setLocalMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const roomRef = useRef<Room | null>(null);
  const roleRef = useRef(currentUserRole);
  const isMutedFirestoreRef = useRef(currentViewer?.isMuted || false);

  useEffect(() => {
    isMutedFirestoreRef.current = currentViewer?.isMuted || false;
  }, [currentViewer]);

  const updateVideoTracks = useCallback((roomInstance: Room) => {
    const tracks: { participantSid: string; track: any; identity: string }[] = [];
    const allParticipants = [roomInstance.localParticipant, ...Array.from(roomInstance.remoteParticipants.values())];

    for (const p of allParticipants) {
      if (!p) continue;
      const videoPub = Array.from(p.videoTrackPublications.values() as any).find(
        (pub: any) => pub.track && pub.kind === 'video'
      ) as any;
      if (videoPub && videoPub.track) {
        tracks.push({
          participantSid: p.sid,
          track: videoPub.track,
          identity: p.identity,
        });
      }
    }
    setVideoTracks(tracks);
  }, []);

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
        updateVideoTracks(roomInstance);
      });

      roomInstance.on(RoomEvent.ParticipantDisconnected, () => {
        setParticipants(Array.from(roomInstance.remoteParticipants.values()));
        updateVideoTracks(roomInstance);
      });

      roomInstance.on(RoomEvent.Disconnected, () => {
        setConnectionState(ConnectionState.Disconnected);
      });

      roomInstance.on(RoomEvent.LocalTrackPublished, () => {
        updateVideoTracks(roomInstance);
      });

      roomInstance.on(RoomEvent.LocalTrackUnpublished, () => {
        updateVideoTracks(roomInstance);
      });

      roomInstance.on(RoomEvent.TrackPublished, () => {
        updateVideoTracks(roomInstance);
      });

      roomInstance.on(RoomEvent.TrackUnpublished, () => {
        updateVideoTracks(roomInstance);
      });

      roomInstance.on(RoomEvent.TrackSubscribed, () => {
        updateVideoTracks(roomInstance);
      });

      roomInstance.on(RoomEvent.TrackUnsubscribed, () => {
        updateVideoTracks(roomInstance);
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
      updateVideoTracks(roomInstance);

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
          updateVideoTracks(roomInstance);
        }
      }
    } catch (err: any) {
      console.error('LiveKit connection error:', err);
      setError(err?.message || 'Error al conectar al servidor de transmisiones');
      setConnectionState(ConnectionState.Disconnected);
    } finally {
      setConnecting(false);
    }
  }, [liveId, currentUser, enabled, updateVideoTracks]);

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
    setVideoTracks([]);
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
      updateVideoTracks(roomInstance);
    } catch (e) {
      console.error('Error toggling camera:', e);
    }
  };

  // Switch camera
  const switchCamera = async () => {
    const roomInstance = roomRef.current;
    if (!roomInstance) return;

    try {
      const videoPubs = Array.from(roomInstance.localParticipant.videoTrackPublications.values() as any) as any[];
      for (const pub of videoPubs) {
        if (pub && pub.track && pub.track.kind === 'video') {
          await pub.track.switchCamera();
        }
      }
    } catch (e) {
      console.error('Error switching camera:', e);
    }
  };

  return {
    livekitRoom,
    connected: connectionState === ConnectionState.Connected,
    connecting,
    error,
    participants,
    videoTracks,
    isPublishing,
    localMuted,
    cameraEnabled,
    toggleMute,
    toggleCamera,
    switchCamera,
    disconnect,
    reconnect: connect,
  };
};



