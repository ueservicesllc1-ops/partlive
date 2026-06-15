import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { HostStats } from '../../types';

interface Props {
  stats: HostStats | null;
}

interface StatItem {
  label: string;
  value: string | number;
  emoji: string;
  color?: string;
}

export const HostStatsGrid: React.FC<Props> = ({ stats }) => {
  const items: StatItem[] = [
    { emoji: '📺', label: 'Lives', value: stats?.totalLives ?? 0, color: colors.secondary },
    { emoji: '🏠', label: 'Salas', value: stats?.totalRooms ?? 0, color: colors.primary },
    { emoji: '🫘', label: 'Beans', value: formatNum(stats?.totalBeansEarned), color: colors.accent },
    { emoji: '👥', label: 'Seguidores', value: formatNum(stats?.followersCount), color: colors.gold },
    { emoji: '👁️', label: 'Prom. Viewers', value: stats?.averageViewers ?? 0 },
    { emoji: '⏱️', label: 'Minutos en vivo', value: formatNum(stats?.totalLiveMinutes) },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Estadísticas</Text>
      <View style={styles.grid}>
        {items.map((item, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statEmoji}>{item.emoji}</Text>
            <Text style={[styles.statValue, item.color ? { color: item.color } : {}]}>
              {item.value}
            </Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const formatNum = (n?: number): string => {
  if (n === undefined || n === null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...textPresets.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    width: '30.5%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    ...textPresets.h2,
    color: colors.text,
    fontSize: 20,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
