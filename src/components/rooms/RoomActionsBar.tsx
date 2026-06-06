import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors, spacing } from '../../theme';

interface RoomActionsBarProps {
  hasSeat: boolean;
  hasPendingRequest: boolean;
  isPrivileged: boolean;
  onMicPress: () => void;
  onGiftPress: () => void;
  onSharePress: () => void;
  onMorePress: () => void;
  requestsCount?: number;
  localMuted?: boolean;
}

export const RoomActionsBar: React.FC<RoomActionsBarProps> = ({
  hasSeat,
  hasPendingRequest,
  isPrivileged,
  onMicPress,
  onGiftPress,
  onSharePress,
  onMorePress,
  requestsCount = 0,
  localMuted = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Mic Request / Mute toggle Action */}
      <TouchableOpacity style={[styles.actionButton, styles.micButton]} onPress={onMicPress} activeOpacity={0.8}>
        <Text style={styles.actionIcon}>
          {hasSeat ? (localMuted ? '🔇' : '🎙️') : hasPendingRequest ? '⏳' : '🎙️'}
        </Text>
        <Text style={styles.actionLabel}>
          {hasSeat ? (localMuted ? 'Hablar' : 'Silenciar') : hasPendingRequest ? 'Esperando...' : 'Pedir Micro'}
        </Text>
      </TouchableOpacity>

      {/* Gift Action */}
      <TouchableOpacity style={styles.actionButton} onPress={onGiftPress} activeOpacity={0.8}>
        <Text style={styles.actionIcon}>🎁</Text>
        <Text style={styles.actionLabel}>Regalo</Text>
      </TouchableOpacity>

      {/* Share Action */}
      <TouchableOpacity style={styles.actionButton} onPress={onSharePress} activeOpacity={0.8}>
        <Text style={styles.actionIcon}>🔗</Text>
        <Text style={styles.actionLabel}>Compartir</Text>
      </TouchableOpacity>

      {/* Admin Panel button or generic options */}
      <TouchableOpacity style={styles.actionButton} onPress={onMorePress} activeOpacity={0.8}>
        <View style={styles.moreIconContainer}>
          <Text style={styles.actionIcon}>{isPrivileged ? '⚙️' : '💬'}</Text>
          {isPrivileged && requestsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requestsCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.actionLabel}>{isPrivileged ? 'Admin' : 'Más'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: '#151221',
    borderTopWidth: 1,
    borderTopColor: '#292440',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  micButton: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  actionLabel: {
    fontSize: 10,
    color: colors.text,
    fontWeight: 'bold',
  },
  moreIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#FF1744',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#151221',
  },
  badgeText: {
    fontSize: 8,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
