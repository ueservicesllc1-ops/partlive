import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Text, Alert, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView } from '@livekit/react-native';
import { useAuth } from '../../store/AuthContext';
import { useLive } from '../../hooks/useLive';
import { useLiveKitLive } from '../../hooks/useLiveKitLive';
import { useWallet } from '../../hooks/useWallet';
import { usePkBattle } from '../../hooks/usePkBattle';
import { PkScoreBoard, PkTimer, PkHostPanel, PkInviteModal, PkInviteToast } from '../../components/pk';
import { colors, spacing } from '../../theme';
import { MAIN_ROUTES } from '../../app/routes';
import {
  LiveHeaderOverlay,
  LiveVideoPlaceholder,
  LiveChatPanel,
  LiveActionsBar,
  LiveModerationMenu,
  LiveEndedState,
  CameraLogModal,
} from '../../components/lives';
import { GiftStoreModal } from '../../components/store/GiftStoreModal';
import { ScreenError } from '../../components/ScreenError';
import { ReportModal } from '../../components/moderation/ReportModal';
import { useGiftEvents } from '../../hooks/useGiftEvents';
import { GiftAnimationLayer, GiftReceivedToast, GlobalGiftBanner, TopGiftersPanel } from '../../components/gifts';
import { inviteCoHost, listenToCoHostInvites, respondToCoHostInvite, updateLive } from '../../services/firebase/firestore';

export const LiveDetailsScreen = ({ route, navigation }: any) => {
  const { liveId } = route.params || {};
  const { userProfile } = useAuth();
  
  const {
    live,
    viewers,
    messages,
    currentViewer,
    currentUserRole,
    loading,
    error,
    joined,
    liked,
    leave,
    sendMessage,
    like,
    unlike,
    muteMember,
    kickViewer,
    addModerator,
    removeModerator,
    endLive,
  } = useLive(liveId);

  // LiveKit WebRTC Video integration
  const {
    livekitRoom,
    connected: livekitConnected,
    isPublishing,
    participants: livekitParticipants,
    videoTracks,
    switchCamera,
    cameraEnabled,
    toggleCamera,
    cameraLogs,
    showCameraLogs,
    lastCameraError,
    setShowCameraLogs,
    clearCameraLogs,
  } = useLiveKitLive(liveId, userProfile, currentViewer, currentUserRole, joined && live?.status === 'live');

  // Wallet support for gifts
  const { wallet } = useWallet();

  const isHost = currentUserRole === 'host';

  // Listen to incoming co-host invites (for viewers)
  useEffect(() => {
    if (!userProfile?.uid || isHost || !liveId || !joined) return;

    const unsubscribe = listenToCoHostInvites(userProfile.uid, (invites) => {
      const matchingInvite = invites.find(
        (inv) => inv.liveId === liveId && inv.status === 'pending'
      );
      if (matchingInvite) {
        Alert.alert(
          'Invitación a Transmitir',
          'El anfitrión te ha invitado a co-transmitir en vivo. ¿Aceptas la invitación?',
          [
            {
              text: 'Rechazar',
              style: 'cancel',
              onPress: () => respondToCoHostInvite(matchingInvite.id, false),
            },
            {
              text: 'Aceptar',
              onPress: () => respondToCoHostInvite(matchingInvite.id, true),
            },
          ],
          { cancelable: false }
        );
      }
    });

    return () => unsubscribe();
  }, [userProfile?.uid, isHost, liveId, joined]);

  // Prevent accidental close/back navigation for Host (Android back button only)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Only block Android hardware back button (POP action), not programmatic navigation
      if (!isHost || live?.status === 'ended') {
        return;
      }
      const actionType = e.data?.action?.type;
      if (actionType === 'NAVIGATE' || actionType === 'RESET' || actionType === 'REPLACE') {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Finalizar Transmisión',
        '¿Estás seguro de que deseas finalizar esta transmisión en vivo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Finalizar',
            style: 'destructive',
            onPress: async () => {
              try {
                await endLive();
              } catch (err) {
                console.error(err);
              }
              navigation.dispatch(e.data.action);
            },
          },
        ],
        { cancelable: true }
      );
    });

    return () => unsubscribe();
  }, [navigation, isHost, live?.status, endLive]);

  // Extract active video tracks for local and remote participants directly from our hook
  const activeTracks = videoTracks;

  const renderVideoGrid = () => {
    if (!livekitConnected || activeTracks.length === 0) {
      return <LiveVideoPlaceholder title={live?.title} category={live?.category} />;
    }

    const count = activeTracks.length;

    // Responsive split screen styles based on participant count
    let itemStyle: any = { width: '100%', height: '100%' };
    if (count === 2) {
      itemStyle = { width: '50%', height: '100%' };
    } else if (count >= 3 && count <= 4) {
      itemStyle = { width: '50%', height: '50%' };
    } else if (count >= 5 && count <= 6) {
      itemStyle = { width: '50%', height: '33.33%' };
    } else if (count > 6) {
      itemStyle = { width: '33.33%', height: '33.33%' };
    }

    return (
      <View style={styles.gridContainer}>
        {activeTracks.map(({ participantSid, track, identity }) => {
          const participantUser = viewers.find(v => v.userId === identity);
          const displayName = identity === userProfile?.uid ? 'Tú' : (participantUser?.displayName || 'Co-Host');

          // Power and Dice checks
          const isParticipantHostA = activeBattle && identity === activeBattle.hostAId;
          const isParticipantHostB = activeBattle && identity === activeBattle.hostBId;

          const diceAvailable = isParticipantHostA ? activeBattle.hostADiceAvailable : (isParticipantHostB ? activeBattle.hostBDiceAvailable : false);
          const isMe = identity === userProfile?.uid;

          // Check if participant is frozen (opponent block_gifts is active)
          let isFrozen = false;
          if (activeBattle) {
            if (isParticipantHostA) {
              const oppPower = activeBattle.hostBActivePower;
              const oppExpiry = activeBattle.hostBPowerExpiry;
              if (oppPower === 'block_gifts' && oppExpiry) {
                const expiryMs = oppExpiry.toMillis ? oppExpiry.toMillis() : new Date(oppExpiry).getTime();
                isFrozen = Date.now() < expiryMs;
              }
            } else if (isParticipantHostB) {
              const oppPower = activeBattle.hostAActivePower;
              const oppExpiry = activeBattle.hostAPowerExpiry;
              if (oppPower === 'block_gifts' && oppExpiry) {
                const expiryMs = oppExpiry.toMillis ? oppExpiry.toMillis() : new Date(oppExpiry).getTime();
                isFrozen = Date.now() < expiryMs;
              }
            }
          }

          // Check if participant has shield active
          let hasShield = false;
          if (activeBattle) {
            const power = isParticipantHostA ? activeBattle.hostAActivePower : (isParticipantHostB ? activeBattle.hostBActivePower : null);
            const expiry = isParticipantHostA ? activeBattle.hostAPowerExpiry : (isParticipantHostB ? activeBattle.hostBPowerExpiry : null);
            if (power === 'shield' && expiry) {
              const expiryMs = expiry.toMillis ? expiry.toMillis() : new Date(expiry).getTime();
              hasShield = Date.now() < expiryMs;
            }
          }

          // Check if participant has double points active
          let hasDouble = false;
          if (activeBattle) {
            const power = isParticipantHostA ? activeBattle.hostAActivePower : (isParticipantHostB ? activeBattle.hostBActivePower : null);
            const expiry = isParticipantHostA ? activeBattle.hostAPowerExpiry : (isParticipantHostB ? activeBattle.hostBPowerExpiry : null);
            if (power === 'double_points' && expiry) {
              const expiryMs = expiry.toMillis ? expiry.toMillis() : new Date(expiry).getTime();
              hasDouble = Date.now() < expiryMs;
            }
          }

          const isParticipantHost = identity === live?.hostId;
          const frame = isParticipantHost ? live?.selectedFrame : 'none';
          const filter = isParticipantHost ? live?.selectedFilter : 'none';

          // Frame Border Styles
          let frameStyle: any = {};
          if (frame === 'simple') {
            frameStyle = { borderWidth: 3, borderColor: '#FFFFFF' };
          } else if (frame === 'neon') {
            frameStyle = { borderWidth: 3, borderColor: colors.primary };
          } else if (frame === 'gold_vip') {
            frameStyle = { borderWidth: 3.5, borderColor: '#FFD700' };
          } else if (frame === 'fire') {
            frameStyle = { borderWidth: 3.5, borderColor: '#FF4500' };
          }

          return (
            <View key={participantSid} style={[styles.gridItem, itemStyle, frameStyle]}>
              <VideoView
                videoTrack={track}
                style={styles.videoView}
                mirror={identity === userProfile?.uid}
              />

              {/* Filter Overlays */}
              {filter === 'retro' && (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(120, 60, 0, 0.28)', zIndex: 1 }]} />
              )}
              {filter === 'beauty' && (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 180, 200, 0.18)', zIndex: 1 }]} />
              )}
              {filter === 'neon' && (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(100, 0, 200, 0.22)', zIndex: 1 }]} />
              )}
              {filter === 'neon_pro' && (
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 200, 255, 0.20)', zIndex: 1 }]} />
              )}

              {/* Active filter/frame badge (only visible to the streaming host) */}
              {identity === userProfile?.uid && filter && filter !== 'none' && (
                <View style={styles.filterActiveBadge} pointerEvents="none">
                  <Text style={styles.filterActiveBadgeText}>
                    {filter === 'retro' ? '📼 Retro' : filter === 'beauty' ? '✨ Belleza' : filter === 'neon' ? '⚡ Neon' : '🔮 Neon Pro'}
                  </Text>
                </View>
              )}

              {/* Frame Crown/Fire Badges */}
              {frame === 'gold_vip' && (
                <View style={styles.crownFrameIconContainer}>
                  <Text style={{ fontSize: 14 }}>👑</Text>
                </View>
              )}
              {frame === 'fire' && (
                <View style={styles.crownFrameIconContainer}>
                  <Text style={{ fontSize: 14 }}>🔥</Text>
                </View>
              )}
              
              {/* Frost Overlay */}
              {isFrozen && (
                <View style={styles.frostOverlay}>
                  <Text style={styles.frostEmoji}>❄️</Text>
                  <Text style={styles.frostText}>BLOQUEADO</Text>
                </View>
              )}

              {/* Shield Glow aura */}
              {hasShield && (
                <View style={styles.shieldOverlay}>
                  <Text style={styles.shieldEmoji}>🛡️</Text>
                </View>
              )}

              {/* Double Points badge */}
              {hasDouble && (
                <View style={styles.doublePointsOverlay}>
                  <Text style={styles.doublePointsText}>🔥 2x</Text>
                </View>
              )}

              {/* Dice Overlay */}
              {diceAvailable && (
                <TouchableOpacity
                  style={styles.floatingDice}
                  onPress={isMe ? rollDice : undefined}
                  disabled={!isMe}
                  activeOpacity={0.85}
                >
                  <Text style={styles.diceText}>❓</Text>
                </TouchableOpacity>
              )}

              <View style={styles.participantNameTag}>
                <Text style={styles.participantNameText} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };
  const {
    activeBattle,
    contributions,
    pendingInvite,
    timeLeft,
    rollDice,
  } = usePkBattle(liveId, isHost ? userProfile?.uid : undefined);

  const {
    lastEvent,
    activeToasts,
    activeBanners,
    dismissToast,
    dismissBanner,
  } = useGiftEvents('live', liveId);

  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [modMenuVisible, setModMenuVisible] = useState(false);
  const [selectedViewer, setSelectedViewer] = useState<any | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [liveMenuVisible, setLiveMenuVisible] = useState(false);
  const [pkInviteModalVisible, setPkInviteModalVisible] = useState(false);

  // Mapped members representation for GiftCatalogModal
  const mappedMembers = useMemo(() => {
    return viewers.map(v => ({
      userId: v.userId,
      displayName: v.displayName,
      photoURL: v.photoURL,
      role: v.role,
      isMuted: v.isMuted,
      isKicked: v.isBannedFromLive,
    } as any));
  }, [viewers]);

  const handleClose = async () => {
    if (isHost && live?.status === 'live') {
      Alert.alert(
        'Finalizar Transmisión',
        '¿Estás seguro de que deseas finalizar esta transmisión en vivo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Finalizar',
            style: 'destructive',
            onPress: async () => {
              try {
                await endLive();
              } catch (e) {
                console.error(e);
              }
              navigation.navigate(MAIN_ROUTES.MAIN_TABS as any);
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      try {
        await leave();
      } catch (e) {
        console.error(e);
      }
      navigation.goBack();
    }
  };

  const handleViewerPress = (viewer: any) => {
    if (viewer.userId === userProfile?.uid) return;
    setSelectedViewer(viewer);
    setModMenuVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Conectando a la transmisión...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ScreenError
        message={error}
        onRetry={() => navigation.goBack()}
      />
    );
  }

  // If live ended, show summaries
  if (live?.status === 'ended') {
    return (
      <LiveEndedState 
        live={live} 
        onClose={() => navigation.navigate(MAIN_ROUTES.MAIN_TABS)} 
      />
    );
  }

  const handleSendMessage = async (text: string) => {
    try {
      await sendMessage(text);
    } catch (e: any) {
      Alert.alert('Error al enviar', e.message || 'No se pudo enviar el mensaje.');
    }
  };

  const handleModeChange = async (newMode: 'solo' | 'battle' | 'group') => {
    if (!live) return;
    try {
      const maxGuests = newMode === 'group' ? 4 : newMode === 'battle' ? 4 : 0;
      await updateLive(live.id, {
        streamMode: newMode,
        maxGuests,
      });
      Alert.alert('Modo Cambiado', `La transmisión ahora está en Modo ${newMode === 'solo' ? 'Solo' : newMode === 'battle' ? 'Batalla' : 'Grupal'}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo cambiar el modo de transmisión.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Main video area (placed behind everything, constant full screen dimensions) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0F0C1B' }]}>
        {renderVideoGrid()}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <View style={{ flex: 1 }} pointerEvents="box-none">
          {/* PK Battle Overlay */}
          {activeBattle && activeBattle.status === 'active' && (
            <View style={styles.pkOverlayContainer}>
              <PkScoreBoard battle={activeBattle} />
              <PkTimer timeLeft={timeLeft} />
              <PkHostPanel battle={activeBattle} />
            </View>
          )}

          {/* Incoming PK Invite Toast for Host */}
          {isHost && pendingInvite && (
            <PkInviteToast
              invite={pendingInvite}
              toLiveId={liveId}
              onClose={() => {}}
            />
          )}
          
          {/* Top Overlays */}
          {live && (
            <LiveHeaderOverlay
              live={live}
              viewers={viewers}
              onClosePress={handleClose}
              onViewerPress={handleViewerPress}
              showSwitchCamera={isPublishing}
              onSwitchCameraPress={switchCamera}
            />
          )}

          {/* Lower Overlays (Chat and actions) */}
          <View style={styles.overlayBottom}>
            <View style={styles.chatWrapper}>
              <LiveChatPanel messages={messages} />
            </View>

            <LiveActionsBar
              onSendMessage={handleSendMessage}
              onGiftPress={() => setGiftModalVisible(true)}
              onLikePress={liked ? unlike : like}
              onMorePress={() => {
                setLiveMenuVisible(true);
              }}
              liked={liked}
              likesCount={live?.likesCount || 0}
              allowChat={live?.allowChat}
              allowGifts={live?.allowGifts}
              isHost={isHost}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Gifting Modal overlay */}
      {live && userProfile && (
        <GiftStoreModal
          visible={giftModalVisible}
          onClose={() => setGiftModalVisible(false)}
          targetType="live"
          targetId={liveId}
          receivers={mappedMembers.filter(v => v.userId !== userProfile.uid && !v.isKicked)}
          onGoToPayout={() => {
            setGiftModalVisible(false);
            navigation.navigate(MAIN_ROUTES.REQUEST_PAYOUT);
          }}
        />
      )}

      {/* Moderation menu overlay */}
      <LiveModerationMenu
        visible={modMenuVisible}
        onClose={() => setModMenuVisible(false)}
        targetUser={selectedViewer}
        actorRole={currentUserRole || 'viewer'}
        onMuteToggle={muteMember}
        onKick={kickViewer}
        onAddModerator={addModerator}
        onRemoveModerator={removeModerator}
        onInviteCoHost={(targetUserId) => {
          if (userProfile?.uid) {
            inviteCoHost(liveId, targetUserId, userProfile.uid)
              .then(() => {
                Alert.alert('Invitación Enviada', 'Se ha enviado la invitación a transmitir.');
              })
              .catch((err) => {
                Alert.alert('Error', err.message || 'No se pudo enviar la invitación.');
              });
          }
        }}
        isTargetMuted={selectedViewer?.isMuted}
      />

      {/* Live Options Sheet */}
      <Modal visible={liveMenuVisible} transparent animationType="fade" onRequestClose={() => setLiveMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLiveMenuVisible(false)}>
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>Opciones del Live</Text>

            {isHost ? (
              <>
                {/* Indicador de Estado de Modo */}
                <View style={styles.modeStatusContainer}>
                  <Text style={styles.modeStatusLabel}>
                    Modo actual: <Text style={styles.modeStatusValue}>
                      {live?.streamMode === 'solo' ? 'Solo' : live?.streamMode === 'battle' ? 'Batalla PK' : 'Grupal'}
                    </Text>
                  </Text>
                </View>

                {/* Selector de Cambiar Modo */}
                <Text style={styles.sectionTitle}>Cambiar Modo de Transmisión</Text>
                <View style={styles.modeSelectorRow}>
                  <TouchableOpacity
                    style={[styles.modeSelectBtn, live?.streamMode === 'solo' && styles.modeSelectBtnActive]}
                    onPress={() => handleModeChange('solo')}
                  >
                    <Text style={[styles.modeSelectBtnText, live?.streamMode === 'solo' && styles.modeSelectBtnTextActive]}>👤 Solo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeSelectBtn, live?.streamMode === 'battle' && styles.modeSelectBtnActive]}
                    onPress={() => handleModeChange('battle')}
                  >
                    <Text style={[styles.modeSelectBtnText, live?.streamMode === 'battle' && styles.modeSelectBtnTextActive]}>⚔️ Batalla</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeSelectBtn, live?.streamMode === 'group' && styles.modeSelectBtnActive]}
                    onPress={() => handleModeChange('group')}
                  >
                    <Text style={[styles.modeSelectBtnText, live?.streamMode === 'group' && styles.modeSelectBtnTextActive]}>👥 Grupal</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => {
                    setLiveMenuVisible(false);
                    setPkInviteModalVisible(true);
                  }}
                >
                  <Text style={styles.sheetBtnText}>🏆 Iniciar Batalla PK 1vs1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => {
                    setLiveMenuVisible(false);
                    navigation.navigate(MAIN_ROUTES.PK_HISTORY, { hostId: userProfile?.uid });
                  }}
                >
                  <Text style={styles.sheetBtnText}>📊 Historial PK</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => {
                    setLiveMenuVisible(false);
                    Alert.alert('Moderar Espectadores', 'Toca el avatar de cualquier espectador en la barra superior para silenciarlo o expulsarlo.');
                  }}
                >
                  <Text style={styles.sheetBtnText}>🚫 Moderar Espectadores</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={async () => {
                    setLiveMenuVisible(false);
                    await toggleCamera();
                  }}
                >
                  <Text style={styles.sheetBtnText}>
                    {cameraEnabled ? '📷 Pausar Cámara' : '🎥 Activar Cámara'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => {
                    setLiveMenuVisible(false);
                    setShowCameraLogs(true);
                  }}
                >
                  <Text style={styles.sheetBtnText}>📋 Ver Logs de Cámara</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sheetBtn, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    setLiveMenuVisible(false);
                    handleClose();
                  }}
                >
                  <Text style={[styles.sheetBtnText, { color: colors.secondary }]}>🛑 Detener Live</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => {
                    setLiveMenuVisible(false);
                    navigation.navigate('KaraokeHome', { targetType: 'live', targetId: liveId });
                  }}
                >
                  <Text style={styles.sheetBtnText}>🎤 Entrar al Karaoke</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => {
                    setLiveMenuVisible(false);
                    setReportModalVisible(true);
                  }}
                >
                  <Text style={[styles.sheetBtnText, { color: colors.secondary }]}>⚠️ Reportar Transmisión</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.cancelSheetBtn} onPress={() => setLiveMenuVisible(false)}>
              <Text style={styles.cancelSheetText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PK Invite Modal */}
      {live && userProfile && (
        <PkInviteModal
          visible={pkInviteModalVisible}
          onClose={() => setPkInviteModalVisible(false)}
          fromLiveId={liveId}
          currentHostId={userProfile.uid}
        />
      )}

      {/* Report Live Modal */}
      {live && (
        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          targetType="live"
          targetId={liveId}
          targetOwnerId={live.hostId}
        />
      )}

      {/* Camera Debug Logs Modal */}
      <CameraLogModal
        visible={showCameraLogs}
        logs={cameraLogs}
        lastError={lastCameraError}
        onClose={() => setShowCameraLogs(false)}
        onClear={clearCameraLogs}
        onRetrySwitch={switchCamera}
      />
    </SafeAreaView>
  );
};

// Stylesheet definition
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  videoArea: {
    flex: 1,
    position: 'relative',
  },
  pkOverlayContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.sm,
  },
  chatWrapper: {
    height: 180,
    paddingHorizontal: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0C1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.md,
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
    fontSize: 14,
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
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0F0C1B',
  },
  gridItem: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#1E1B30',
  },
  videoView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  participantNameTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  participantNameText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  frostOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 229, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  frostEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  frostText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  shieldOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00AAFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  shieldEmoji: {
    fontSize: 14,
    color: '#FFF',
  },
  doublePointsOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF8800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  doublePointsText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  floatingDice: {
    position: 'absolute',
    top: '35%',
    left: '35%',
    width: 56,
    height: 56,
    backgroundColor: '#FFCC00',
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
    elevation: 8,
    shadowColor: '#FFCC00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  diceText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modeStatusContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  modeStatusLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  modeStatusValue: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: spacing.lg,
  },
  modeSelectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#151221',
    borderWidth: 1,
    borderColor: '#292440',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSelectBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeSelectBtnText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modeSelectBtnTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  crownFrameIconContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 3,
    borderRadius: 8,
    zIndex: 9,
  },
  filterActiveBadge: {
    position: 'absolute',
    bottom: 30,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterActiveBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
export default LiveDetailsScreen;
