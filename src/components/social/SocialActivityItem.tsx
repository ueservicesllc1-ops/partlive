import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { SocialActivity } from '../../types/social';

interface SocialActivityItemProps {
  activity: SocialActivity;
  onPressActivity: (activity: SocialActivity) => void;
  onPressUser: (userId: string) => void;
}

export const SocialActivityItem: React.FC<SocialActivityItemProps> = ({
  activity,
  onPressActivity,
  onPressUser,
}) => {
  const getActivityEmoji = () => {
    switch (activity.type) {
      case 'follow':
        return '👤';
      case 'start_live':
        return '🔴';
      case 'create_room':
        return '🏠';
      case 'send_gift':
      case 'receive_gift':
        return '🎁';
      case 'win_game':
        return '🏆';
      case 'rank_up':
      case 'host_level_up':
        return '👑';
      case 'vip_activated':
        return '💎';
      default:
        return '✨';
    }
  };

  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `hace ${interval} a`;
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `hace ${interval} m`;
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `hace ${interval} d`;
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `hace ${interval} hr`;
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `hace ${interval} min`;
      return 'ahora mismo';
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onPressUser(activity.userId)}>
        {activity.userPhotoURL ? (
          <Image source={{ uri: activity.userPhotoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.username} onPress={() => onPressUser(activity.userId)}>
            {activity.username || 'Usuario'}
          </Text>
          <Text style={styles.time}>{getRelativeTime(activity.createdAt)}</Text>
        </View>

        <Text style={styles.title}>
          {getActivityEmoji()} {activity.title}
        </Text>

        {activity.description && (
          <Text style={styles.description}>{activity.description}</Text>
        )}

        {activity.actionType && activity.actionType !== 'none' && (
          <TouchableOpacity
            onPress={() => onPressActivity(activity)}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>Ver interacción ›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  username: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  time: {
    color: colors.textDark,
    fontSize: 11,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  actionButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  actionText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
export default SocialActivityItem;
