import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { formatCompactNumber } from '../../utils/formatNumbers';

interface ProfileStatsProps {
  followers: number;
  following: number;
  gifts: number;
  rooms: number;
}

export const ProfileStats = ({ followers, following, gifts, rooms }: ProfileStatsProps) => {
  const StatItem = ({ label, value }: { label: string; value: number }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{formatCompactNumber(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatItem label="Seguidores" value={followers} />
      <View style={styles.divider} />
      <StatItem label="Siguiendo" value={following} />
      <View style={styles.divider} />
      <StatItem label="Regalos" value={gifts} />
      <View style={styles.divider} />
      <StatItem label="Salas" value={rooms} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-evenly',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...textPresets.h3,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    ...textPresets.caption,
    color: colors.textMuted,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    height: '60%',
    alignSelf: 'center',
  },
});
