import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import {
  Room,
  RoomEvent,
  Track,
  Participant,
  RoomOptions,
  ConnectionState,
} from 'livekit-client';
import { registerGlobals } from '@livekit/react-native-webrtc';
import { getLiveKitLiveToken } from '../services/api/livekitApi';
import { requestCameraAndMicrophonePermissions } from '../utils/permissions';

if (Platform.OS !== 'web') {
  registerGlobals();
}

export const useLiveKitLive = (
  liveId: string,
  currentUser: any,
  currentViewer: any,
  currentUserRole: string | null,
  enabled: boolean = true
) => {
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const roleRef = useRef(currentUserRole);

  useEffect(() => {
    roleRef.current = currentUserRole;
  }, [currentUserRole]);

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
      roomInstance.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
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

      // 4. Connect to server
      await roomInstance.connect(tokenData.url, tokenData.token);
      setLivekitRoom(roomInstance);
      setParticipants(Array.from(roomInstance.remoteParticipants.values()));

      // 5. If host (publisher), request cam/mic and publish tracks
      if (tokenData.canPublish) {
        const hasPerms = await requestCameraAndMicrophonePermissions();
        if (hasPerms) {
          // Publish camera and mic track
          await roomInstance.localParticipant.setCameraEnabled(true);
          await roomInstance.localParticipant.setMicrophoneEnabled(true);
          setIsPublishing(true);
        } else {
          setError('Permisos de cámara y/o micrófono denegados.');
        }
      }
    } catch (err: any) {
      console.error('LiveKit Live Video Connection error:', err);
      setError(err?.message || 'Error al conectar con el servidor LiveKit');
      setConnectionState(ConnectionState.Disconnected);
    } finally {
      setConnecting(false);
    }
  }, [liveId, currentUser, enabled]);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      try {
        roomRef.current.removeAllListeners();
        await roomRef.current.disconnect();
      } catch (e) {
        console.error('Error disconnecting LiveKit Live Room:', e);
      }
      roomRef.current = null;
    }
    setLivekitRoom(null);
    setConnectionState(ConnectionState.Disconnected);
    setIsPublishing(false);
    setParticipants([]);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return {
    livekitRoom,
    connected: connectionState === ConnectionState.Connected,
    connecting,
    error,
    participants,
    isPublishing,
    disconnect,
    reconnect: connect,
  };
};
