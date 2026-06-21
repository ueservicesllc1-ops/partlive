import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Room } from '../../types';
import { colors, spacing, textPresets } from '../../theme';
import { Card } from '../Card';
import { Avatar } from '../Avatar';

interface RoomCardProps {
  room: Room;
  onPress: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        {/* Left: Cover Image/Avatar & Live Badge */}
        <View style={styles.imageContainer}>
          <Avatar
            source={room.coverImageUrl}
            emoji={room.category === 'Juegos' ? '🎮' : room.category === 'Música' ? '🎵' : '🎙️'}
            size={56}
            isLive={room.isLive}
          />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{room.category}</Text>
          </View>
        </View>

        {/* Center: Details */}
        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {room.title}
            </Text>
            {room.isPrivate && <Text style={styles.lockIcon}>🔒</Text>}
          </View>
          <Text style={styles.hostName} numberOfLines={1}>
            Anfitrión: {room.ownerName || 'Usuario'}
          </Text>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {room.tags?.slice(0, 3).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            )) || (
              <View style={styles.tag}>
                <Text style={styles.tagText}>#social</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Info count and Join Button */}
        <View style={styles.actionColumn}>
          <View style={styles.stats}>
            <Text style={styles.statsText}>🎙️ {room.speakersCount || 0}</Text>
            <Text style={styles.statsText}>👥 {room.listenersCount || 0}</Text>
          </View>
          <View style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Entrar</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.primary + '33', // Subtle violet tint
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text,
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    ...textPresets.bodyMedium,
    color: colors.text,
    fontWeight: 'bold',
    marginRight: 4,
    flexShrink: 1,
  },
  lockIcon: {
    fontSize: 12,
  },
  hostName: {
    ...textPresets.caption,
    color: colors.textMuted,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing.xs,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 9,
    color: colors.accent,
    fontWeight: 'bold',
  },
  actionColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    marginLeft: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  statsText: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
  },
  joinButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
