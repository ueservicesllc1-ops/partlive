import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { useRoom } from '../../hooks/useRoom';
import { useRoomLiveKit } from '../../hooks/useRoomLiveKit';
import { useAuth } from '../../store/AuthContext';
import { RoomHeader } from '../../components/rooms/RoomHeader';
import { MicSeatsGrid } from '../../components/rooms/MicSeatsGrid';
import { RoomMembersList } from '../../components/rooms/RoomMembersList';
import { RoomChat } from '../../components/rooms/RoomChat';
import { RoomMessageInput } from '../../components/rooms/RoomMessageInput';
import { MicRequestsPanel } from '../../components/rooms/MicRequestsPanel';
import { RoomActionsBar } from '../../components/rooms/RoomActionsBar';
import { RoomChatPanel } from '../../components/chat/RoomChatPanel';
import { ScreenLoading } from '../../components/ScreenLoading';
import { ScreenError } from '../../components/ScreenError';
import { RoomMember } from '../../types';
import { RoomMemberActionsModal } from '../../components/rooms/RoomMemberActionsModal';
import { GiftCatalogModal } from '../../components/rooms/GiftCatalogModal';
import { ReportModal } from '../../components/moderation/ReportModal';

export const RoomDetailsScreen = ({ route, navigation }: any) => {
  const { roomId } = route.params || {};
  const { user, userWallet } = useAuth();
  
  const [roomMenuVisible, setRoomMenuVisible] = useState(false);
  const [roomReportVisible, setRoomReportVisible] = useState(false);
  
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
    endRoom,
    promoteToHost,
    removeHost,
    promoteToModerator,
    removeModerator,
    promoteToSpeaker,
    removeSpeaker,
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

  // Handle kicked user
  if (currentMember?.isKicked) {
    Alert.alert('Expulsado', 'Fuiste expulsado de la sala.', [
      { text: 'Aceptar', onPress: () => navigation.goBack() },
    ]);
    return null;
  }

  // Handle room ending
  if (room.status === 'ended') {
    Alert.alert('Sala finalizada', 'Esta sala de voz ha sido cerrada por el anfitrión.', [
      { text: 'Aceptar', onPress: () => navigation.goBack() },
    ]);
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
    if (occupant) {
      setSelectedMember(occupant);
      setMemberActionsVisible(true);
    } else {
      setSelectedSeatIndex(index);
      setSelectedOccupant(undefined);
      setSeatActionVisible(true);
    }
  };

  const handleMemberPress = (member: RoomMember) => {
    setSelectedMember(member);
    setMemberActionsVisible(true);
  };

  const handleSeatActionSubmit = async (action: 'mute' | 'unmute' | 'kick_mic' | 'kick_room' | 'claim_mic') => {
    setSeatActionVisible(false);

    try {
      if (action === 'claim_mic') {
        if (currentUserRole === 'listener') {
          // Listeners must request permission
          await requestMic();
          Alert.alert('Solicitud enviada', 'Tu solicitud para hablar fue enviada.');
        } else {
          // If already speaker/mod/host, assign directly
          if (currentMember) {
            await approveMic(currentMember.userId, selectedSeatIndex!);
          }
        }
      } else if (selectedOccupant) {
        const targetId = selectedOccupant.userId;
        switch (action) {
          case 'mute':
            await muteMember(targetId, true);
            break;
          case 'unmute':
            await muteMember(targetId, false);
            break;
          case 'kick_mic':
            await removeFromSeat(targetId);
            break;
          case 'kick_room':
            await kickMember(targetId);
            break;
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Ocurrió un error');
    }
  };

  const handleMicAction = async () => {
    if (!currentMember) return;

    const hasSeat = currentMember.seatIndex !== undefined;

    if (hasSeat) {
      // Toggle local mic mute
      await toggleMute();
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
        <Text style={styles.statusText}>
          {lkConnecting
            ? '🎧 Conectando audio...'
            : lkError
            ? `⚠️ Error de audio: ${lkError}`
            : lkConnected
            ? canPublish
              ? localMuted
                ? '🔇 Micrófono silenciado'
                : '🎤 Micrófono activo'
              : '🎧 Solo escuchando'
            : '🎧 Audio desconectado'}
        </Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        {/* Seats Grid & Listeners at the top */}
        <MicSeatsGrid members={enrichedMembers} onSeatPress={handleSeatPress} />
        <RoomMembersList members={enrichedMembers} onMemberPress={handleMemberPress} />

        {/* Real-time Moderable Chat Panel */}
        <RoomChatPanel
          roomId={roomId}
          currentUserId={user?.uid || ''}
          currentMember={currentMember}
          actorRole={currentUserRole}
          messages={messages}
          onSendMessage={sendMessage}
          onSendEmoji={sendEmoji}
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

      {/* Tool bar actions */}
      <RoomActionsBar
        hasSeat={hasSeat}
        hasPendingRequest={hasPendingRequest}
        isPrivileged={isPrivileged}
        onMicPress={handleMicAction}
        onGiftPress={() => setGiftModalVisible(true)}
        onSharePress={() => Alert.alert('Compartir', 'Enlace de sala copiado al portapapeles.')}
        onMorePress={hasSeat ? handleLowerMic : () => setAdminPanelVisible(true)}
        requestsCount={micRequests.length}
        localMuted={localMuted}
      />

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

            <TouchableOpacity style={styles.sheetBtn} onPress={() => handleSeatActionSubmit('claim_mic')}>
              <Text style={styles.sheetBtnText}>🎙️ Ocupar Asiento</Text>
            </TouchableOpacity>

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
          navigation.navigate('PublicProfile', { userId: targetId });
        }}
      />

      {/* Gift Catalog Modal */}
      <GiftCatalogModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        roomId={roomId}
        members={members}
        currentUserId={user?.uid || ''}
        currentMember={currentMember}
        wallet={userWallet}
      />

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

      {/* Report Room Modal */}
      <ReportModal
        visible={roomReportVisible}
        onClose={() => setRoomReportVisible(false)}
        targetType="room"
        targetId={roomId}
        targetOwnerId={room.ownerId}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusIndicator: {
    backgroundColor: '#1E1B30',
    paddingVertical: 6,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
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
    backgroundColor: '#1E1B30',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: '#292440',
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
    borderBottomColor: '#292440',
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
    color: '#FF1744',
    fontWeight: 'bold',
  },
  cancelSheetBtn: {
    marginTop: spacing.md,
    backgroundColor: '#151221',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelSheetText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
});
