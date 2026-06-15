import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { HostActivity, HostActivityType } from '../../types';

interface Props {
  activity: HostActivity;
}

const ACTIVITY_ICONS: Record<HostActivityType, string> = {
  live_started: '📺',
  live_ended: '🔴',
  room_created: '🎙️',
  room_ended: '🔇',
  gift_received: '🎁',
  ranking_update: '🏆',
  payout_requested: '💸',
  payout_approved: '💸',
  payout_paid: '✅',
  payout_rejected: '❌',
  warning: '⚠️',
  system: '🔔',
};

const ACTIVITY_COLORS: Record<HostActivityType, string> = {
  live_started: colors.secondary,
  live_ended: colors.error,
  room_created: colors.primary,
  room_ended: colors.textMuted,
  gift_received: colors.gold,
  ranking_update: colors.accent,
  payout_requested: colors.warning,
  payout_approved: colors.success,
  payout_paid: colors.success,
  payout_rejected: colors.error,
  warning: colors.error,
  system: colors.primary,
};

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
};

export const HostActivityItem: React.FC<Props> = ({ activity }) => {
  const icon = ACTIVITY_ICONS[activity.type] || '📌';
  const color = ACTIVITY_COLORS[activity.type] || colors.textMuted;

  return (
    <View style={styles.item}>
      <View style={[styles.iconCircle, { backgroundColor: color + '22' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{activity.title}</Text>
        {activity.description ? (
          <Text style={styles.description} numberOfLines={2}>{activity.description}</Text>
        ) : null}
        <Text style={styles.date}>{formatDate(activity.createdAt)}</Text>
      </View>
      {activity.beansDelta !== undefined && (
        <View style={styles.deltaWrapper}>
          <Text style={[styles.delta, { color: activity.beansDelta >= 0 ? colors.success : colors.error }]}>
            {activity.beansDelta >= 0 ? '+' : ''}{activity.beansDelta} 🫘
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  icon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  date: {
    fontSize: 10,
    color: colors.textDark,
    marginTop: 2,
  },
  deltaWrapper: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  delta: {
    fontSize: 12,
    fontWeight: '700',
  },
});
