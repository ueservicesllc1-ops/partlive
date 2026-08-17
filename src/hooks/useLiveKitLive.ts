import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Participant,
  RoomOptions,
  LogLevel,
  setLogLevel,
  createLocalVideoTrack,
  Track,
  LocalVideoTrack,
} from 'livekit-client';
import { AudioSession, AndroidAudioTypePresets } from '@livekit/react-native';
import { getLiveKitLiveToken } from '../services/api/livekitApi';
import {
  checkDevicePermission,
  requestDevicePermission,
} from '../utils/permissions';
import { LIVEKIT_CONFIG } from '../config/livekit';

setLogLevel(LogLevel.warn); // warn only — debug floods logcat and can slow things down

// ─── Camera Device Discovery ───────────────────────────────────────────────
// Uses the WebRTC mediaDevices API (registered by @livekit/react-native-webrtc)
// to enumerate physical cameras and classify them as front/back by label.

interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  facing: 'front' | 'back' | 'unknown';
}

/**
 * Enumerate available video input devices and classify each as front, back, or unknown.
 * Android labels typically contain "front" or "back" / "rear" / "environment".
 * iOS labels typically contain "Front" or "Back".
 * Falls back to index-based heuristic if labels are empty.
 */
const getAvailableCameras = async (): Promise<CameraDeviceInfo[]> => {
  try {
    // mediaDevices is a WebRTC global registered by @livekit/react-native-webrtc
    const devices = await (globalThis as any).navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d: any) => d.kind === 'videoinput');

    console.log('[Camera] Found', videoDevices.length, 'video devices:',
      videoDevices.map((d: any) => ({ id: d.deviceId, label: d.label })));

    if (videoDevices.length === 0) return [];

    return videoDevices.map((d: any, index: number) => {
      const label = (d.label || '').toLowerCase();
      let facing: 'front' | 'back' | 'unknown' = 'unknown';

      if (label.includes('front') || label.includes('user') || label.includes('facing front')) {
        facing = 'front';
      } else if (label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('facing back')) {
        facing = 'back';
      } else if (videoDevices.length === 2) {
        // Heuristic: on most Android phones index 0 = back camera, index 1 = front camera.
        // (labels are empty before permission grant on many Android devices)
        facing = index === 0 ? 'back' : 'front';
      }

      return {
        deviceId: d.deviceId,
        label: d.label || `Camera ${index}`,
        facing,
      };
    });
  } catch (e) {
    console.error('[Camera] enumerateDevices failed:', e);
    return [];
  }
};




// ─── Types ─────────────────────────────────────────────────────────────────

interface VideoTrackInfo {
  participantSid: string;
  track: any;
  identity: string;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export const useLiveKitLive = (
  liveId: string,
  currentUser: any,
  _currentViewer: any,   // kept for API compat but not used as a dep
  _currentUserRole: string | null, // kept for API compat
  enabled: boolean = true
) => {
  // ── State ──
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [videoTracks, setVideoTracks] = useState<VideoTrackInfo[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [localMuted, setLocalMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [cameraLogs, setCameraLogs] = useState<string[]>([]);
  const [showCameraLogs, setShowCameraLogs] = useState(false);
  const [lastCameraError, setLastCameraError] = useState<string | null>(null);

  const logCameraMsg = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] ${msg}`;
    console.log('[CameraLog]', formatted);
    setCameraLogs(prev => [...prev.slice(-40), formatted]);
  }, []);

  const clearCameraLogs = useCallback(() => {
    setCameraLogs([]);
    setLastCameraError(null);
  }, []);

  // ── Refs (stable, don't trigger re-renders) ──
  const roomRef = useRef<Room | null>(null);
  const switchingRef = useRef(false);
  const isFrontCameraRef = useRef(true); // mirrors isFrontCamera state — readable in stable callbacks
  // Store latest user uid in a ref so connect() never needs currentUser in deps
  const userUidRef = useRef<string | null>(currentUser?.uid ?? null);
  useEffect(() => { userUidRef.current = currentUser?.uid ?? null; }, [currentUser?.uid]);

  // Keep references for API compatibility to satisfy TypeScript compilation warnings
  const compatRef = useRef({ _currentViewer, _currentUserRole });
  useEffect(() => {
    compatRef.current = { _currentViewer, _currentUserRole };
  }, [_currentViewer, _currentUserRole]);

  // Keep ref in sync whenever state changes
  useEffect(() => { isFrontCameraRef.current = isFrontCamera; }, [isFrontCamera]);

  // ── updateVideoTracks ─────────────────────────────────────────────────────
  const updateVideoTracks = useCallback((room: Room) => {
    const tracks: VideoTrackInfo[] = [];
    const all = [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
    for (const p of all) {
      if (!p) continue;
      const pub = Array.from(p.videoTrackPublications.values() as any).find(
        (x: any) => x.track && x.kind === 'video'
      ) as any;
      if (pub?.track) {
        tracks.push({ participantSid: p.sid, track: pub.track, identity: p.identity });
      }
    }
    setVideoTracks(tracks);
  }, []);

  // ── Core connection lifecycle ─────────────────────────────────────────────
  // This effect runs ONLY when liveId changes or when enabled flips from false→true.
  // We use a local `mounted` flag to stop state updates after cleanup.
  useEffect(() => {
    if (!enabled || !liveId) return;

    let mounted = true;
    let roomInstance: Room | null = null;

    const doConnect = async () => {
      console.log('[LiveKit] Starting connection for liveId:', liveId);

      if (mounted) { setConnecting(true); setError(null); }

      try {
        const tokenData = await getLiveKitLiveToken(liveId);
        if (!mounted) return;

        // ── Build room ──
        const options: RoomOptions = { adaptiveStream: true, dynacast: true };
        roomInstance = new Room(options);
        roomRef.current = roomInstance;

        // ── Listeners ──
        const onStateChange = () => {
          if (!mounted) return;
          updateVideoTracks(roomInstance!);
        };

        roomInstance.on(RoomEvent.LocalTrackPublished, onStateChange);
        roomInstance.on(RoomEvent.LocalTrackUnpublished, onStateChange);
        roomInstance.on(RoomEvent.TrackPublished, onStateChange);
        roomInstance.on(RoomEvent.TrackUnpublished, onStateChange);
        roomInstance.on(RoomEvent.TrackSubscribed, onStateChange);
        roomInstance.on(RoomEvent.TrackUnsubscribed, onStateChange);
        roomInstance.on(RoomEvent.TrackMuted, onStateChange);
        roomInstance.on(RoomEvent.TrackUnmuted, onStateChange);

        roomInstance.on(RoomEvent.ParticipantConnected, () => {
          if (!mounted) return;
          setParticipants(Array.from(roomInstance!.remoteParticipants.values()));
          updateVideoTracks(roomInstance!);
        });
        roomInstance.on(RoomEvent.ParticipantDisconnected, () => {
          if (!mounted) return;
          setParticipants(Array.from(roomInstance!.remoteParticipants.values()));
          updateVideoTracks(roomInstance!);
        });
        roomInstance.on(RoomEvent.Disconnected, () => {
          if (!mounted) return;
          setConnected(false);
          setIsPublishing(false);
        });

        // ── AudioSession ──
        try {
          await AudioSession.configureAudio({
            android: { audioTypeOptions: AndroidAudioTypePresets.communication },
          });
          await AudioSession.startAudioSession();
          console.log('[LiveKit] AudioSession started');
        } catch (e) {
          console.warn('[LiveKit] AudioSession error (non-fatal):', e);
        }

        // ── Connect ──
        const wsUrl = tokenData.url || LIVEKIT_CONFIG.LIVEKIT_WS_URL;
        await roomInstance.connect(wsUrl, tokenData.token);
        if (!mounted) return;

        setLivekitRoom(roomInstance);
        setConnected(true);
        setParticipants(Array.from(roomInstance.remoteParticipants.values()));
        updateVideoTracks(roomInstance);

        // ── Publish camera + mic ──
        if (tokenData.canPublish) {
          let hasMic = (await checkDevicePermission('microphone')) === 'granted';
          let hasCamera = (await checkDevicePermission('camera')) === 'granted';

          if (!hasMic) {
            hasMic = (await requestDevicePermission('microphone')) === 'granted';
          }
          if (!hasCamera) {
            hasCamera = (await requestDevicePermission('camera')) === 'granted';
          }

          if (!mounted) return;

          if (hasMic) {
            await roomInstance.localParticipant.setMicrophoneEnabled(true);
            if (mounted) setLocalMuted(false);
          }

          if (hasCamera) {
            console.log('[LiveKit] Enabling camera via deviceId discovery...');
            try {
              const cameras = await getAvailableCameras();
              const frontCam = cameras.find(c => c.facing === 'front');

              if (frontCam) {
                console.log('[LiveKit] Using front camera deviceId:', frontCam.deviceId, 'label:', frontCam.label);
                const videoTrack = await createLocalVideoTrack({
                  deviceId: { exact: frontCam.deviceId },
                });
                await roomInstance.localParticipant.publishTrack(videoTrack, {
                  source: Track.Source.Camera,
                });
                console.log('[LiveKit] ✅ Front camera published via deviceId');
              } else {
                // Fallback: no identifiable front camera — use default
                console.warn('[LiveKit] No front camera found by label, using setCameraEnabled fallback');
                await roomInstance.localParticipant.setCameraEnabled(true);
              }

              if (mounted) {
                isFrontCameraRef.current = true;
                setCameraEnabled(true);
                setIsFrontCamera(true);
              }
            } catch (camErr) {
              console.error('[LiveKit] Camera init error, trying fallback:', camErr);
              // Ultimate fallback: plain setCameraEnabled
              try {
                await roomInstance.localParticipant.setCameraEnabled(true);
                if (mounted) {
                  isFrontCameraRef.current = true;
                  setCameraEnabled(true);
                  setIsFrontCamera(true);
                }
              } catch (fallbackErr) {
                console.error('[LiveKit] Camera fallback also failed:', fallbackErr);
              }
            }
          }

          if (mounted && (hasMic || hasCamera)) {
            setIsPublishing(true);
            updateVideoTracks(roomInstance);
            // Second update after a brief delay to ensure VideoView renders
            setTimeout(() => {
              if (mounted && roomRef.current) {
                updateVideoTracks(roomRef.current);
                console.log('[LiveKit] Video track refresh done');
              }
            }, 1000);
          }
        }
      } catch (err: any) {
        console.error('[LiveKit] Connection error:', err);
        if (mounted) {
          setError(err?.message || 'Error al conectar');
          setConnected(false);
        }
      } finally {
        if (mounted) setConnecting(false);
      }
    };

    doConnect();

    // ── Cleanup: runs when liveId changes, component unmounts, or enabled→false ──
    return () => {
      mounted = false;
      console.log('[LiveKit] Cleanup — disconnecting');
      if (roomInstance) {
        roomInstance.removeAllListeners();
        roomInstance.disconnect().catch(() => {});
        roomRef.current = null;
      }
      AudioSession.stopAudioSession().catch(() => {});
      setLivekitRoom(null);
      setConnected(false);
      setConnecting(false);
      setIsPublishing(false);
      setCameraEnabled(false);
      setParticipants([]);
      setVideoTracks([]);
    };
  // ⚠️ INTENTIONAL: only re-run when liveId or enabled changes.
  // All other values are read through refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveId, enabled]);

  // ── Toggle mute ────────────────────────────────────────────────────────────
  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      const nowEnabled = room.localParticipant.isMicrophoneEnabled;
      await room.localParticipant.setMicrophoneEnabled(!nowEnabled);
      setLocalMuted(nowEnabled); // muted = mic disabled
    } catch (e) {
      console.error('[LiveKit] toggleMute error:', e);
    }
  }, []);

  // ── Toggle camera on/off ───────────────────────────────────────────────────
  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      const nowEnabled = room.localParticipant.isCameraEnabled;
      await room.localParticipant.setCameraEnabled(!nowEnabled);
      setCameraEnabled(!nowEnabled);
      updateVideoTracks(room);
    } catch (e) {
      console.error('[LiveKit] toggleCamera error:', e);
    }
  }, [updateVideoTracks]);

  // ── Switch camera (front ↔ back) ─────────────────────────────────────────
  // Cleanly unpublishes current track, releases hardware with safety delay,
  // creates fresh target track (front/back), and publishes it to LiveKit.
  const switchCamera = useCallback(async () => {
    setLastCameraError(null);

    const room = roomRef.current;
    if (!room) {
      const msg = '❌ No room connected - imposible girar cámara';
      logCameraMsg(msg);
      setLastCameraError(msg);
      return;
    }
    if (switchingRef.current) {
      logCameraMsg('⚠️ Cambio de cámara ya en progreso, ignorando click duplicado');
      return;
    }
    switchingRef.current = true;

    const currentlyFront = isFrontCameraRef.current;
    const targetFront = !currentlyFront;
    const targetFacing = targetFront ? 'user' : 'environment';
    const targetLabel = targetFront ? 'FRONTAL' : 'TRASERA';
    logCameraMsg(`🔄 === INICIO GIRO CÁMARA === (Actual: ${currentlyFront ? 'FRONTAL' : 'TRASERA'} → Objetivo: ${targetLabel})`);

    try {
      // 1. Obtener todas las publicaciones de video local existentes
      const localPubs = Array.from(room.localParticipant.videoTrackPublications.values() as any);
      const videoPubs = localPubs.filter((p: any) => p.track && (p.source === Track.Source.Camera || p.kind === 'video')) as any[];

      logCameraMsg(`Deteniendo y despublicando ${videoPubs.length} track(s) de cámara activa(s)...`);
      for (const pub of videoPubs) {
        if (pub.track) {
          try {
            await room.localParticipant.unpublishTrack(pub.track);
            if (typeof pub.track.stop === 'function') pub.track.stop();
            if (pub.track.mediaStreamTrack && typeof pub.track.mediaStreamTrack.stop === 'function') {
              pub.track.mediaStreamTrack.stop();
            }
          } catch (unpubErr: any) {
            logCameraMsg('⚠️ Error al despublicar track previo: ' + (unpubErr?.message || String(unpubErr)));
          }
        }
      }

      // 2. Esperar 250ms para que el CameraManager de Android/Samsung libere el hardware
      logCameraMsg('⏳ Liberando hardware de cámara Samsung (250ms delay)...');
      await new Promise<void>(resolve => setTimeout(resolve, 250));

      // 3. Enumerar cámaras disponibles para obtener deviceId si es posible
      let targetDeviceId: string | undefined;
      try {
        const cameras = await getAvailableCameras();
        logCameraMsg(`Cámaras detectadas (${cameras.length}): ` +
          (cameras.map(c => `${c.label || c.deviceId.substring(0, 8)} [${c.facing}]`).join(', ') || 'ninguna'));
        
        const matchingCam = cameras.find(c => targetFront ? c.facing === 'front' : c.facing === 'back');
        if (matchingCam) {
          targetDeviceId = matchingCam.deviceId;
          logCameraMsg(`Cámara seleccionada por deviceId: ${matchingCam.label || matchingCam.deviceId.substring(0, 10)}`);
        }
      } catch (enumErr: any) {
        logCameraMsg('⚠️ No se pudieron enumerar cámaras, usando facingMode directo.');
      }

      // 4. Crear nuevo track local con la cámara objetivo
      const trackOptions: any = targetDeviceId
        ? { deviceId: targetDeviceId, facingMode: targetFacing as any }
        : { facingMode: targetFacing as any };

      logCameraMsg(`🎥 Creando nuevo track local (${targetLabel}) con opciones: ${JSON.stringify(trackOptions)}...`);
      const newTrack = await createLocalVideoTrack(trackOptions);

      // 5. Publicar el nuevo track en LiveKit
      logCameraMsg('📡 Publicando nuevo track en LiveKit Room...');
      await room.localParticipant.publishTrack(newTrack, { source: Track.Source.Camera });

      // 6. Actualizar estado e interfaz
      isFrontCameraRef.current = targetFront;
      setIsFrontCamera(targetFront);
      setCameraEnabled(true);
      updateVideoTracks(room);
      logCameraMsg(`✅ GIRO DE CÁMARA EXITOSO: Ahora transmitiendo con cámara ${targetLabel}`);

    } catch (err: any) {
      const errStr = err?.message || String(err);
      logCameraMsg(`❌ ERROR al girar cámara a ${targetLabel}: ${errStr}`);
      setLastCameraError(`Fallo al girar cámara: ${errStr}`);

      // Recuperación de emergencia: intentar restaurar cámara por defecto
      try {
        logCameraMsg('🔄 Intentando recuperación: reactivando cámara...');
        await room.localParticipant.setCameraEnabled(true);
        setCameraEnabled(true);
        updateVideoTracks(room);
      } catch (recErr: any) {
        logCameraMsg('❌ Error en recuperación: ' + (recErr?.message || String(recErr)));
      }
    } finally {
      switchingRef.current = false;
      logCameraMsg('=== FIN GIRO CÁMARA ===');
    }
  }, [logCameraMsg, updateVideoTracks]);

  return {
    livekitRoom,
    connected,
    connecting,
    error,
    participants,
    videoTracks,
    isPublishing,
    localMuted,
    cameraEnabled,
    isFrontCamera,
    cameraLogs,
    showCameraLogs,
    lastCameraError,
    setShowCameraLogs,
    clearCameraLogs,
    toggleMute,
    toggleCamera,
    switchCamera,
  };
};

