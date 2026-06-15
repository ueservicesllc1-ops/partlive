import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Text, Alert, Modal, TouchableOpacity } from 'react-native';
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
  GiftCatalogModal
} from '../../components/lives';
import { ReportModal } from '../../components/moderation/ReportModal';

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
  } = useLiveKitLive(liveId, userProfile, currentViewer, currentUserRole, joined && live?.status === 'live');

  // Wallet support for gifts
  const { wallet } = useWallet();

  const isHost = currentUserRole === 'host';
  const {
    activeBattle,
    contributions,
    pendingInvite,
    timeLeft,
  } = usePkBattle(liveId, isHost ? userProfile?.uid : undefined);

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
    try {
      if (isHost) {
        await endLive();
      } else {
        await leave();
      }
    } catch (e) {
      console.error(e);
    }
    navigation.goBack();
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

  // If live ended, show summaries
  if (live?.status === 'ended') {
    return (
      <LiveEndedState 
        live={live} 
        onClose={() => navigation.navigate(MAIN_ROUTES.MAIN_TABS)} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Main video area */}
        <View style={styles.videoArea}>
          <LiveVideoPlaceholder title={live?.title} category={live?.category} />
          
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
            />
          )}

          {/* Lower Overlays (Chat and actions) */}
          <View style={styles.overlayBottom}>
            <View style={styles.chatWrapper}>
              <LiveChatPanel messages={messages} />
            </View>

            <LiveActionsBar
              onSendMessage={sendMessage}
              onGiftPress={() => setGiftModalVisible(true)}
              onLikePress={liked ? unlike : like}
              onMorePress={() => {
                if (isHost) {
                  setModMenuVisible(true);
                  setSelectedViewer(null);
                } else {
                  setLiveMenuVisible(true);
                }
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
        <GiftCatalogModal
          visible={giftModalVisible}
          onClose={() => setGiftModalVisible(false)}
          roomId={liveId}
          members={mappedMembers}
          currentUserId={userProfile.uid}
          currentMember={currentViewer as any}
          wallet={wallet}
          isLive={true}
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
        isTargetMuted={selectedViewer?.isMuted}
      />

      {/* Live Options Sheet */}
      <Modal visible={liveMenuVisible} transparent animationType="fade" onRequestClose={() => setLiveMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLiveMenuVisible(false)}>
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>Opciones del Live</Text>

            {isHost ? (
              <>
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
                    setModMenuVisible(true);
                    setSelectedViewer(null);
                  }}
                >
                  <Text style={styles.sheetBtnText}>🚫 Moderar Espectadores</Text>
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
});
export default LiveDetailsScreen;
