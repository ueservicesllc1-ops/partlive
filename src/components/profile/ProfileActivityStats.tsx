import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserProfile } from '../../types/user';
import { colors, spacing } from '../../theme';

interface Props {
  profile: UserProfile;
}

interface StatItem {
  emoji: string;
  label: string;
  value: string | number;
}

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const ProfileActivityStats = ({ profile }: Props) => {
  const stats: StatItem[] = [
    {
      emoji: '🏠',
      label: 'Salas',
      value: formatNumber(profile.roomsJoinedCount || 0),
    },
    {
      emoji: '📺',
      label: 'Lives vistos',
      value: formatNumber(profile.livesWatchedCount || 0),
    },
    {
      emoji: '🎮',
      label: 'Partidas',
      value: formatNumber(profile.gamesPlayedCount || 0),
    },
    {
      emoji: '🎁',
      label: 'Regalos enviados',
      value: formatNumber(profile.totalGiftsSent || 0),
    },
    {
      emoji: '💎',
      label: 'Regalos recibidos',
      value: formatNumber(profile.totalGiftsReceived || 0),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Actividad</Text>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.emoji}>{stat.emoji}</Text>
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    minWidth: '28%',
    flex: 1,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
