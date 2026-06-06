import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { HostActivity } from '../../types';
import { HostActivityItem } from './HostActivityItem';

interface Props {
  activities: HostActivity[];
  maxItems?: number;
}

export const HostActivityList: React.FC<Props> = ({ activities, maxItems }) => {
  const items = maxItems ? activities.slice(0, maxItems) : activities;

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyText}>Sin actividad aún.</Text>
        <Text style={styles.emptySubtext}>Tu historial de lives, salas y regalos aparecerá aquí.</Text>
      </View>
    );
  }

  return (
    <View>
      {items.map(activity => (
        <HostActivityItem key={activity.id} activity={activity} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...textPresets.h3,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...textPresets.bodySmall,
    color: colors.textDark,
    textAlign: 'center',
  },
});
