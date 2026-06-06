import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LiveStream, LiveViewer } from '../../types/live';
import { Avatar } from '../Avatar';
import { LiveViewerList } from './LiveViewerList';
import { colors, spacing, textPresets } from '../../theme';

interface LiveHeaderOverlayProps {
  live: LiveStream;
  viewers: LiveViewer[];
  onClosePress: () => void;
  onFollowPress?: () => void;
  onViewerPress?: (viewer: LiveViewer) => void;
  isFollowing?: boolean;
}

export const LiveHeaderOverlay: React.FC<LiveHeaderOverlayProps> = ({
  live,
  viewers,
  onClosePress,
  onFollowPress,
  onViewerPress,
  isFollowing = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Host Info Box */}
        <View style={styles.hostBox}>
          <Avatar source={live.hostPhotoURL} emoji="👤" size={32} />
          <View style={styles.hostMeta}>
            <Text style={styles.hostName} numberOfLines={1}>
              {live.hostName}
            </Text>
            <Text style={styles.likesCount}>
              ❤️ {live.likesCount || 0}
            </Text>
          </View>
          {onFollowPress && (
            <TouchableOpacity 
              style={[styles.followBtn, isFollowing && styles.followBtnActive]} 
              onPress={onFollowPress}
              activeOpacity={0.8}
            >
              <Text style={styles.followBtnText}>
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Viewers list & Close button */}
        <View style={styles.rightBox}>
          <LiveViewerList viewers={viewers} onViewerPress={onViewerPress} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClosePress} activeOpacity={0.8}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stream Info Overlay */}
      <View style={styles.streamInfoRow}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.streamTitle} numberOfLines={1}>
          {live.title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hostBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 4,
    borderRadius: 24,
    maxWidth: '55%',
  },
  hostMeta: {
    marginLeft: 6,
    marginRight: 8,
    flexShrink: 1,
  },
  hostName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
  likesCount: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
  },
  followBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  followBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  followBtnText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  rightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  streamInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '85%',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
    marginRight: 3,
  },
  liveText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#FFF',
  },
  streamTitle: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
