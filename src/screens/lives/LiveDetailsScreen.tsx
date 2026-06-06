import React, { useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Text, Alert } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { useLive } from '../../hooks/useLive';
import { useLiveKitLive } from '../../hooks/useLiveKitLive';
import { useWallet } from '../../hooks/useWallet';
import { colors, spacing } from '../../theme';
import {
  LiveHeaderOverlay,
  LiveVideoPlaceholder,
  LiveChatPanel,
  LiveActionsBar,
  LiveModerationMenu,
  LiveEndedState,
  GiftCatalogModal
} from '../../components/lives';

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

  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [modMenuVisible, setModMenuVisible] = useState(false);
  const [selectedViewer, setSelectedViewer] = useState<any | null>(null);

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

  const isHost = currentUserRole === 'host';

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
                  Alert.alert('Acceso restringido', 'Opciones solo disponibles para host/moderadores.');
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
    </SafeAreaView>
  );
};

// Route matching definition
const MAIN_ROUTES = {
  MAIN_TABS: 'MainTabs',
};

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
});
export default LiveDetailsScreen;
