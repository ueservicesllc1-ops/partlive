import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';

interface RoomsSectionProps {
  rooms: any[];
  onRoomPress: (roomId: string) => void;
}

export const PopularRoomsSection = ({ rooms, onRoomPress }: RoomsSectionProps) => {
  if (!rooms || rooms.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Salas Populares 🔥</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Ver más ❯</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {rooms.map((room) => (
          <TouchableOpacity 
            key={room.id} 
            style={styles.card}
            onPress={() => onRoomPress(room.id)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>{room.hostAvatar}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{room.category}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.roomTitle} numberOfLines={2}>{room.title}</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>👥 {room.onlineUsersCount} oyentes</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
  },
  seeAll: {
    ...textPresets.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#292440',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 24 },
  badge: {
    backgroundColor: 'rgba(138, 79, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    ...textPresets.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  roomTitle: {
    ...textPresets.bodyMedium,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    ...textPresets.caption,
    color: colors.textMuted,
  },
});
