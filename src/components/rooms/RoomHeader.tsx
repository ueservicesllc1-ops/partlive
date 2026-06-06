import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Room } from '../../types';
import { colors, spacing, textPresets } from '../../theme';

interface RoomHeaderProps {
  room: Room;
  onLeavePress: () => void;
  onMenuPress?: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({ room, onLeavePress, onMenuPress }) => {
  return (
    <View style={styles.container}>
      {/* Back/Leave Button */}
      <TouchableOpacity style={styles.leaveButton} onPress={onLeavePress} activeOpacity={0.8}>
        <Text style={styles.leaveText}>🚪 Salir</Text>
      </TouchableOpacity>

      {/* Center Room Details */}
      <View style={styles.centerInfo}>
        <Text style={styles.title} numberOfLines={1}>
          {room.title}
        </Text>
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{room.category}</Text>
          </View>
          <Text style={styles.onlineCount}>👥 {room.listenersCount + room.speakersCount} en sala</Text>
        </View>
      </View>

      {/* Options Menu Button */}
      <TouchableOpacity style={styles.menuButton} onPress={onMenuPress} activeOpacity={0.8}>
        <Text style={styles.menuText}>⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
    backgroundColor: '#151221',
  },
  leaveButton: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff1744',
  },
  leaveText: {
    color: '#ff1744',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  title: {
    ...textPresets.bodyMedium,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.text,
  },
  onlineCount: {
    fontSize: 10,
    color: colors.textMuted,
  },
  menuButton: {
    padding: spacing.xs,
  },
  menuText: {
    fontSize: 22,
    color: colors.text,
  },
});
