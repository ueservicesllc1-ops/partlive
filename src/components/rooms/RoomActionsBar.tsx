import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
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
  // Animated pulse for the Admin button when there are pending requests
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isPrivileged && requestsCount > 0) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPrivileged, requestsCount, pulseAnim]);

  const hasRequestsAndPrivileged = isPrivileged && requestsCount > 0;

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
        <Animated.View style={[
          styles.adminIconContainer,
          hasRequestsAndPrivileged && styles.adminIconContainerActive,
          hasRequestsAndPrivileged && { transform: [{ scale: pulseAnim }] }
        ]}>
          <Text style={styles.actionIcon}>{isPrivileged ? '⚙️' : '💬'}</Text>
          {hasRequestsAndPrivileged && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requestsCount}</Text>
            </View>
          )}
        </Animated.View>
        <Text style={[styles.actionLabel, hasRequestsAndPrivileged && { color: '#FF1744' }]}>
          {isPrivileged ? 'Admin' : 'Más'}
        </Text>
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
  adminIconContainer: {
    position: 'relative',
    padding: 4,
    borderRadius: 12,
  },
  adminIconContainerActive: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 23, 68, 0.3)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#FF1744',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
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
