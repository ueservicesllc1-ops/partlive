import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, textPresets, spacing } from '../../theme';
import { MAIN_ROUTES } from '../../app/routes';
import { useRoom } from '../../hooks/useRoom';
import { useRoomLiveKit } from '../../hooks/useRoomLiveKit';
import { useAuth } from '../../store/AuthContext';
import {
  checkDevicePermission,
  requestDevicePermission,
  showPermissionBlockedAlert,
} from '../../utils/permissions';
import { RoomHeader } from '../../components/rooms/RoomHeader';
import { MicSeatsGrid } from '../../components/rooms/MicSeatsGrid';
import { RoomMembersList } from '../../components/rooms/RoomMembersList';
import { RoomChat } from '../../components/rooms/RoomChat';
import { RoomMessageInput } from '../../components/rooms/RoomMessageInput';
import { MicRequestsPanel } from '../../components/rooms/MicRequestsPanel';
import { RoomActionsBar } from '../../components/rooms/RoomActionsBar';
import { KaraokePlayer } from '../../components/rooms/KaraokePlayer';
import { GiftSelectorModal } from '../../components/gifts/GiftSelectorModal';
import { RoomChatPanel } from '../../components/chat/RoomChatPanel';
import { ScreenLoading } from '../../components/ScreenLoading';
import { ScreenError } from '../../components/ScreenError';
import { RoomMember } from '../../types';
import { RoomMemberActionsModal } from '../../components/rooms/RoomMemberActionsModal';
import { GiftStoreModal } from '../../components/store/GiftStoreModal';
import { ReportModal } from '../../components/moderation/ReportModal';
import { useGiftEvents } from '../../hooks/useGiftEvents';
import { GiftAnimationLayer, GiftReceivedToast, GlobalGiftBanner, TopGiftersPanel } from '../../components/gifts';
import { RoomShareModal } from '../../components/rooms/RoomShareModal';

export const RoomDetailsScreen = ({ route, navigation }: any) => {
  const { roomId } = route.params || {};
  const { user, userWallet } = useAuth();
  
  const [roomMenuVisible, setRoomMenuVisible] = useState(false);
  const [roomReportVisible, setRoomReportVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track keyboard visibility and height for floating chat
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Check microphone permission upon entering the room
  useEffect(() => {
    const handleMicPermissionCheck = async () => {
      const status = await checkDevicePermission('microphone');
      if (status === 'granted') {
        setMicPermissionDenied(false);
      } else if (status === 'blocked') {
        setMicPermissionDenied(true);
        showPermissionBlockedAlert(
          'Para usar esta función necesitamos permiso de micrófono. Actívalo para poder hablar en la sala de voz.'
        );
      } else {
        // Status is 'denied' (promptable)
        const reqStatus = await requestDevicePermission('microphone');
        if (reqStatus === 'granted') {
          setMicPermissionDenied(false);
        } else {
          setMicPermissionDenied(true);
          if (reqStatus === 'blocked') {
            showPermissionBlockedAlert(
              'Para usar esta función necesitamos permiso de micrófono. Actívalo para poder hablar en la sala de voz.'
            );
          } else {
            Alert.alert(
              'Permiso de Micrófono',
              'No has aceptado el permiso de micrófono. No podrás hablar en la sala de voz hasta activarlo.'
            );
          }
        }
      }
    };
    
    handleMicPermissionCheck();
  }, []);

  const {
    lastEvent,
    activeToasts,
    activeBanners,
    dismissToast,
    dismissBanner,
  } = useGiftEvents('room', roomId);
  
  // 1. Social & Firestore State
  const {
    room,
    members,
    messages,
    micRequests,
    currentMember,
    currentUserRole,
    loading: socialLoading,
    error: socialError,
    leave,
    sendMessage,
    sendEmoji,
    sendSticker,
    hideMessage,
    deleteOwnMessage,
    reportMessage,
    blockUserFromRoom,
    loadOlderMessages,
    requestMic,
    cancelMic,
    approveMic,
    rejectMic,
    muteMember,
    removeFromSeat,
    kickMember,
    banMember,
    endRoom,
    promoteToHost,
    removeHost,
    promoteToModerator,
    removeModerator,
    promoteToSpeaker,
    removeSpeaker,
    lockSeat,
    unlockSeat,
  } = useRoom(roomId);

  // 2. Real-Time Audio (LiveKit) Integration
  const {
    connected: lkConnected,
    connecting: lkConnecting,
    error: lkError,
    localMuted,
    canPublish,
    activeSpeakers,
    toggleMute,
    disconnect: lkDisconnect,
  } = useRoomLiveKit(
    roomId,
    user,
    currentMember,
    currentUserRole,
    !!room && room.status === 'active'
  );

  const [adminPanelVisible, setAdminPanelVisible] = useState(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [selectedOccupant, setSelectedOccupant] = useState<RoomMember | undefined>(undefined);
  const [seatActionVisible, setSeatActionVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
  const [memberActionsVisible, setMemberActionsVisible] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);

  // Track previous count to detect newly arriving mic requests
  const prevMicRequestsCountRef = useRef<number>(0);
  // Banner toast for new mic request notification
  const [newRequestBanner, setNewRequestBanner] = useState<{ visible: boolean; requesterName: string }>({
    visible: false,
    requesterName: '',
  });
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle kicked user - must use useEffect to avoid calling Alert during render
  useEffect(() => {
    if (currentMember?.isKicked) {
      Alert.alert('Expulsado', 'Fuiste expulsado de la sala.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() },
      ]);
    }
  }, [currentMember?.isKicked, navigation]);

  // Handle room ending - must use useEffect
  useEffect(() => {
    if (room?.status === 'closed') {
      Alert.alert('Sala finalizada', 'Esta sala de voz ha sido cerrada por el anfitrión.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() },
      ]);
    }
  }, [room?.status, navigation]);

  // ─── Detect new mic requests → alert the host/moderator automatically ─────
  useEffect(() => {
    const prevCount = prevMicRequestsCountRef.current;
    const newCount = micRequests.length;

    if (newCount > prevCount) {
      const isPrivilegedNow =
        currentUserRole === 'owner' ||
        currentUserRole === 'host' ||
        currentUserRole === 'moderator';

      if (isPrivilegedNow) {
        const newest = micRequests[micRequests.length - 1];
        const requesterName = newest?.displayName || 'Alguien';
        const added = newCount - prevCount;
        const alertMsg =
          added > 1
            ? `${added} nuevas solicitudes de micrófono pendientes.`
            : `${requesterName} quiere subir al micrófono.`;

        Alert.alert(
          '🎤 Nueva Solicitud de Micrófono',
          alertMsg,
          [
            {
              text: 'Ver Solicitudes',
              onPress: () => setAdminPanelVisible(true),
            },
            { text: 'Ahora no', style: 'cancel' },
          ],
          { cancelable: true }
        );

        // Show floating banner toast
        if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
        setNewRequestBanner({ visible: true, requesterName });
        bannerTimerRef.current = setTimeout(() => {
          setNewRequestBanner(prev => ({ ...prev, visible: false }));
        }, 6000);
      }
    }

    prevMicRequestsCountRef.current = newCount;
  }, [micRequests.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup banner timer on unmount
  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  if (socialLoading) {
    return <ScreenLoading message="Entrando a la sala..." />;
  }

  if (socialError || !room) {
    return (
      <ScreenError
        message={socialError || 'No se pudo cargar la sala de voz.'}
        onRetry={() => navigation.goBack()}
      />
    );
  }

  // Inactive room guard (already handled by useEffect above, but also block render)
  if (currentMember?.isKicked || room.status === 'closed') {
    return null;
  }


  const handleLeave = async () => {
    if (currentUserRole === 'owner') {
      Alert.alert(
        'Terminar sala',
        'Eres el propietario. ¿Quieres finalizar la sala para todos o solo salir?',
        [
          {
            text: 'Finalizar Sala',
            onPress: async () => {
              await lkDisconnect();
              await endRoom();
              navigation.goBack();
            },
            style: 'destructive',
          },
          {
            text: 'Solo Salir',
            onPress: async () => {
              await lkDisconnect();
              await leave();
              navigation.goBack();
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert('Salir de la sala', '¿Estás seguro de que deseas salir de la sala de voz?', [
        {
          text: 'Salir',
          onPress: async () => {
            await lkDisconnect();
            await leave();
            navigation.goBack();
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  const handleSeatPress = (index: number, occupant?: RoomMember) => {
    setSelectedSeatIndex(index);
    setSelectedOccupant(occupant);

    const isLocked = room?.lockedSeats?.includes(index);

    if (occupant) {
      setSelectedMember(occupant);
      setMemberActionsVisible(true);
    } else {
      if (isLocked) {
        if (isPrivileged) {
          setSeatActionVisible(true);
        } else {
          Alert.alert('Bloqueado', 'Este asiento está bloqueado por los moderadores.');
        }
      } else {
        setSeatActionVisible(true);
      }
    }
  };

  const handleMemberPress = (member: RoomMember) => {
    setSelectedMember(member);
    setMemberActionsVisible(true);
  };

  const handleSeatActionSubmit = async (action: 'claim_mic' | 'lock_seat' | 'unlock_seat') => {
    setSeatActionVisible(false);

    try {
      if (action === 'claim_mic') {
        if (currentUserRole === 'listener') {
          // Listeners must request permission
          await requestMic();
          Alert.alert('Solicitud enviada', 'Tu solicitud de asiento fue enviada. Espera a que el anfitrión te apruebe.');
        } else {
          // If already speaker/mod/host, assign directly
          if (currentMember) {
            await approveMic(currentMember.userId, selectedSeatIndex!);
          }
        }
      } else if (action === 'lock_seat') {
        await lockSeat(selectedSeatIndex!);
        Alert.alert('Bloqueado', `El asiento ${selectedSeatIndex! + 1} ha sido bloqueado.`);
      } else if (action === 'unlock_seat') {
        await unlockSeat(selectedSeatIndex!);
        Alert.alert('Desbloqueado', `El asiento ${selectedSeatIndex! + 1} ha sido desbloqueado.`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Ocurrió un error');
    }
  };

  const handleMicAction = async () => {
    if (!currentMember) return;

    const hasSeat = currentMember.seatIndex !== undefined;

    if (hasSeat) {
      try {
        // 1. Toggle the LiveKit mic immediately (no delay)
        await toggleMute();
        // 2. Sync the new mute state to Firestore
        const newMuteState = !localMuted;
        await muteMember(currentMember.userId, newMuteState);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo silenciar el micrófono');
      }
    } else {
      // Manage request flows
      const hasPendingRequest = micRequests.some(r => r.userId === currentMember.userId);
      if (hasPendingRequest) {
        await cancelMic();
      } else {
        await requestMic();
        Alert.alert('Solicitado', 'Has solicitado subir al micrófono. Espera aprobación.');
      }
    }
  };

  const handleLowerMic = async () => {
    if (!currentMember || currentMember.seatIndex === undefined) return;
    Alert.alert('Bajar del micrófono', '¿Quieres bajarte del escenario de voz?', [
      { text: 'Bajar', onPress: () => removeFromSeat(currentMember.userId) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const isPrivileged = currentUserRole === 'owner' || currentUserRole === 'host' || currentUserRole === 'moderator';
  const hasSeat = currentMember?.seatIndex !== undefined;
  const hasPendingRequest = micRequests.some(r => r.userId === currentMember?.userId);

  // Map active speakers IDs to check speaking state
  const speakingUids = activeSpeakers.map(s => s.identity);
  const isLocalSpeaking = user ? speakingUids.includes(user.uid) : false;

  // Enrich members with speaking state from LiveKit
  const enrichedMembers = members.map(m => ({
    ...m,
    isSpeaking: speakingUids.includes(m.userId),
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#151221" />

      <RoomHeader room={room} onLeavePress={handleLeave} onMenuPress={() => setRoomMenuVisible(true)} />

      {/* Audio Connection Status indicator */}
      <View style={styles.statusIndicator}>
        <View style={styles.statusContent}>
          {lkConnected && canPublish && !localMuted && (
            <View style={[
              styles.statusPulseDot,
              isLocalSpeaking ? styles.statusPulseDotSpeaking : styles.statusPulseDotActive
            ]} />
          )}
          <Text style={[
            styles.statusText,
            isLocalSpeaking && { color: '#00E676' }
          ]}>
            {lkConnecting
              ? '🎧 Conectando audio...'
              : lkError
              ? `⚠️ Error de audio: ${lkError}`
              : lkConnected
              ? canPublish
                ? localMuted
                  ? '🔇 Micrófono silenciado'
                  : isLocalSpeaking
                    ? '🔊 Transmitiendo voz...'
                    : '🎤 Micrófono activo'
                : '🎧 Solo escuchando'
              : '🎧 Audio desconectado'}
          </Text>
        </View>
      </View>

      {micPermissionDenied && (
        <View style={styles.permissionWarningBanner}>
          <Text style={styles.permissionWarningText}>
            ⚠️ No podrás hablar hasta activar el permiso de micrófono.
          </Text>
          <TouchableOpacity
            style={styles.permissionWarningBtn}
            onPress={async () => {
              const status = await requestDevicePermission('microphone');
              if (status === 'granted') {
                setMicPermissionDenied(false);
              } else if (status === 'blocked') {
                showPermissionBlockedAlert(
                  'Para usar esta función necesitamos permiso de micrófono. Actívalo para poder hablar.'
                );
              }
            }}
          >
            <Text style={styles.permissionWarningBtnText}>Activar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating banner: new mic request alert for host/moderator */}
      {newRequestBanner.visible && isPrivileged && (
        <TouchableOpacity
          style={styles.micRequestBanner}
          onPress={() => {
            setNewRequestBanner(prev => ({ ...prev, visible: false }));
            setAdminPanelVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.micRequestBannerEmoji}>🎤</Text>
          <View style={styles.micRequestBannerTextCol}>
            <Text style={styles.micRequestBannerTitle}>Nueva solicitud de micrófono</Text>
            <Text style={styles.micRequestBannerSub}>
              {newRequestBanner.requesterName} quiere subir · Toca para ver
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setNewRequestBanner(prev => ({ ...prev, visible: false }))}
            style={styles.micRequestBannerClose}
          >
            <Text style={styles.micRequestBannerCloseText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}


      <View style={styles.mainContainer}>
        {/* Background Content: Seats Grid & Listeners */}
        <ScrollView 
          style={styles.backgroundContent}
          contentContainerStyle={styles.backgroundContentScroll}
          showsVerticalScrollIndicator={false}
        >
          <MicSeatsGrid
            members={enrichedMembers}
            lockedSeats={room.lockedSeats || []}
            onSeatPress={handleSeatPress}
            maxMics={room.maxMics || 8}
          />

          {/* Connected Room Members & Listeners List */}
          <RoomMembersList
            members={enrichedMembers}
            onMemberPress={handleMemberPress}
          />

          {/* Karaoke/Video Feature */}
          {room.roomType === 'karaoke' && (
            <KaraokePlayer room={room} isPrivileged={isPrivileged} />
          )}
        </ScrollView>

        {/* Real-time Moderable Chat Panel (Floating Layer on top) */}
        <View style={[
          styles.chatFloatingContainer,
          keyboardHeight > 0 && {
            top: Platform.OS === 'ios' ? 40 : 10,
            bottom: Platform.OS === 'ios' ? keyboardHeight : 0,
          },
        ]}>
          <RoomChatPanel
            roomId={roomId}
            currentUserId={user?.uid || ''}
            currentMember={currentMember}
            actorRole={currentUserRole}
            messages={messages}
            onSendMessage={sendMessage}
            onSendEmoji={sendEmoji}
            onSendSticker={sendSticker}
            onLoadOlder={loadOlderMessages}
            onHideMessage={hideMessage}
            onDeleteMessage={deleteOwnMessage}
            onReportMessage={async (msgId, reason) => {
              await reportMessage(msgId, reason);
            }}
            onBlockUser={blockUserFromRoom}
            onKickMember={kickMember}
            canModerate={isPrivileged}
          />
        </View>
      </View>

      {/* Tool bar actions */}
      {keyboardHeight === 0 && (
        <RoomActionsBar
          hasSeat={hasSeat}
          hasPendingRequest={hasPendingRequest}
          isPrivileged={isPrivileged}
          onMicPress={handleMicAction}
          onGiftPress={() => setGiftModalVisible(true)}
          onSharePress={() => setShareModalVisible(true)}
          onMorePress={isPrivileged ? () => setAdminPanelVisible(true) : (hasSeat ? handleLowerMic : () => setRoomMenuVisible(true))}
          requestsCount={micRequests.length}
          localMuted={localMuted}
        />
      )}

      {/* Modals */}
      {/* 1. Admin/Request list Panel */}
      <MicRequestsPanel
        isVisible={adminPanelVisible}
        requests={micRequests}
        occupiedSeats={members.filter(m => m.seatIndex !== undefined).map(m => m.seatIndex!)}
        onClose={() => setAdminPanelVisible(false)}
        onApprove={async (reqId, seatIndex) => {
          try {
            await approveMic(reqId, seatIndex);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo aprobar');
          }
        }}
        onReject={async reqId => {
          try {
            await rejectMic(reqId);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo rechazar');
          }
        }}
      />

      {/* 2. Seat Actions Sheet Modal (for Empty Seats) */}
      <Modal visible={seatActionVisible} transparent animationType="fade" onRequestClose={() => setSeatActionVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSeatActionVisible(false)}>
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>
              Asiento {selectedSeatIndex! + 1}
            </Text>

            {room?.lockedSeats?.includes(selectedSeatIndex!) ? (
              <TouchableOpacity style={styles.sheetBtn} onPress={() => handleSeatActionSubmit('unlock_seat')}>
                <Text style={styles.sheetBtnText}>🔓 Desbloquear Asiento</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.sheetBtn} onPress={() => handleSeatActionSubmit('claim_mic')}>
                  <Text style={styles.sheetBtnText}>🎙️ Ocupar Asiento</Text>
                </TouchableOpacity>

                {isPrivileged && (
                  <TouchableOpacity style={styles.sheetBtn} onPress={() => handleSeatActionSubmit('lock_seat')}>
                    <Text style={[styles.sheetBtnText, { color: '#FF1744' }]}>🔒 Bloquear Asiento</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <TouchableOpacity style={styles.cancelSheetBtn} onPress={() => setSeatActionVisible(false)}>
              <Text style={styles.cancelSheetText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 3. Room Member Actions Modal */}
      <RoomMemberActionsModal
        visible={memberActionsVisible}
        actorRole={currentUserRole}
        targetMember={selectedMember}
        currentUserId={user?.uid || ''}
        onClose={() => {
          setMemberActionsVisible(false);
          setSelectedMember(null);
        }}
        onMute={async (targetId, mute) => {
          try {
            await muteMember(targetId, mute);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo mutear al usuario');
          }
        }}
        onKick={async (targetId) => {
          try {
            await kickMember(targetId);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo expulsar al usuario');
          }
        }}
        onPromoteToHost={async (targetId) => {
          try {
            await promoteToHost(targetId);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo ascender a host');
          }
        }}
        onRemoveHost={async (targetId) => {
          try {
            await removeHost(targetId);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo remover el host');
          }
        }}
        onPromoteToModerator={async (targetId) => {
          try {
            await promoteToModerator(targetId);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo ascender a moderador');
          }
        }}
        onRemoveModerator={async (targetId) => {
          try {
            await removeModerator(targetId);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo remover el moderador');
          }
        }}
        onMoveToSpeaker={async (targetId) => {
          try {
            await promoteToSpeaker(targetId);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo invitar al escenario');
          }
        }}
        onRemoveFromSpeaker={async (targetId) => {
          try {
            await removeFromSeat(targetId);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo bajar del escenario');
          }
        }}
        onViewProfile={(targetId) => {
          navigation.navigate(MAIN_ROUTES.PUBLIC_PROFILE, { userId: targetId });
        }}
        onBan={async (targetId) => {
          try {
            await banMember(targetId);
            Alert.alert('Bloqueado', 'Usuario bloqueado de esta sala.');
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo bloquear al usuario');
          }
        }}
      />

      {/* Gift Store Modal */}
      <GiftStoreModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        targetType="room"
        targetId={roomId}
        receivers={members.filter(m => m.userId !== user?.uid && !m.isKicked)}
        onGoToPayout={() => {
          setGiftModalVisible(false);
          navigation.navigate('RequestPayout');
        }}
      />

      {/* Top Gifters Panel */}
      <TopGiftersPanel targetType="room" targetId={roomId} limit={5} />
      

      {/* Room Options Sheet */}
      <Modal visible={roomMenuVisible} transparent animationType="fade" onRequestClose={() => setRoomMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRoomMenuVisible(false)}>
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>Opciones de Sala</Text>

            {isPrivileged && (
              <TouchableOpacity
                style={styles.sheetBtn}
                onPress={() => {
                  setRoomMenuVisible(false);
                  setAdminPanelVisible(true);
                }}
              >
                <Text style={styles.sheetBtnText}>🎙️ Solicitudes de Micrófono ({micRequests.length})</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => {
                setRoomMenuVisible(false);
                navigation.navigate('KaraokeHome', { targetType: 'room', targetId: roomId });
              }}
            >
              <Text style={styles.sheetBtnText}>🎤 Entrar al Karaoke</Text>
            </TouchableOpacity>

            {hasSeat && (
              <TouchableOpacity
                style={styles.sheetBtn}
                onPress={() => {
                  setRoomMenuVisible(false);
                  handleLowerMic();
                }}
              >
                <Text style={[styles.sheetBtnText, { color: colors.secondary }]}>🎙️ Bajar del Escenario</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => {
                setRoomMenuVisible(false);
                setShareModalVisible(true);
              }}
            >
              <Text style={styles.sheetBtnText}>🔗 Compartir e Invitar (WhatsApp / Link)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={() => {
                setRoomMenuVisible(false);
                navigation.navigate(MAIN_ROUTES.PRIVATE_CONVERSATIONS);
              }}
            >
              <Text style={styles.sheetBtnText}>💬 Chat Privado</Text>
            </TouchableOpacity>

            {room.ownerId !== user?.uid && (
              <TouchableOpacity
                style={styles.sheetBtn}
                onPress={() => {
                  setRoomMenuVisible(false);
                  setRoomReportVisible(true);
                }}
              >
                <Text style={[styles.sheetBtnText, { color: colors.secondary }]}>⚠️ Reportar Sala</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelSheetBtn} onPress={() => setRoomMenuVisible(false)}>
              <Text style={styles.cancelSheetText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Share / Invite Room Modal */}
      <RoomShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        room={room}
        roomId={roomId}
      />

      {/* Report Room Modal */}
      <ReportModal
        visible={roomReportVisible}
        onClose={() => setRoomReportVisible(false)}
        targetType="room"
        targetId={roomId}
        targetOwnerId={room.ownerId}
      />

      {/* Gift Animations Overlay */}
      <GiftAnimationLayer lastGiftEvent={lastEvent} />

      {/* Global Gift Banner */}
      {activeBanners.map((banner) => (
        <GlobalGiftBanner
          key={banner.id}
          banner={banner}
          onDismiss={dismissBanner}
        />
      ))}

      {/* Gift Received Toasts List */}
      <View style={styles.toastContainer} pointerEvents="none">
        {activeToasts.map((toast) => (
          <GiftReceivedToast
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusIndicator: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusPulseDotActive: {
    backgroundColor: '#00E676',
    opacity: 0.6,
  },
  statusPulseDotSpeaking: {
    backgroundColor: '#00E676',
    opacity: 1,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  actionSheetTitle: {
    ...textPresets.bodyMedium,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sheetBtn: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  sheetBtnText: {
    fontSize: 14,
    color: colors.text,
  },
  sheetInfo: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  dangerBtn: {
    borderBottomWidth: 0,
  },
  dangerBtnText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: 'bold',
  },
  cancelSheetBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelSheetText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  toastContainer: {
    position: 'absolute',
    left: spacing.md,
    bottom: 220, // Sit above the chat input
    zIndex: 9999,
    gap: spacing.sm,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  backgroundContentScroll: {
    paddingBottom: 400,
  },
  chatFloatingContainer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    top: 210,
    zIndex: 100,
    elevation: 10,
  },
  permissionWarningBanner: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 99,
  },
  permissionWarningText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  permissionWarningBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: spacing.sm,
  },
  permissionWarningBtnText: {
    color: '#FF1744',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // ─── Floating mic-request banner ─────────────────────────────────────────────
  micRequestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2E1A',
    borderLeftWidth: 4,
    borderLeftColor: '#00E676',
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginTop: 4,
    marginBottom: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 200,
    elevation: 8,
    shadowColor: '#00E676',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    gap: spacing.sm,
  },
  micRequestBannerEmoji: {
    fontSize: 24,
  },
  micRequestBannerTextCol: {
    flex: 1,
  },
  micRequestBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00E676',
  },
  micRequestBannerSub: {
    fontSize: 11,
    color: '#A5D6A7',
    marginTop: 2,
  },
  micRequestBannerClose: {
    padding: 4,
  },
  micRequestBannerCloseText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
