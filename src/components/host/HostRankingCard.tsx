import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { HostStats } from '../../types';

interface Props {
  dailyRank?: number;
  weeklyRank?: number;
  bestRank?: number;
}

export const HostRankingCard: React.FC<Props> = ({ dailyRank, weeklyRank, bestRank }) => {
  const hasRanking = dailyRank || weeklyRank;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🏆 Ranking</Text>
      {hasRanking ? (
        <View style={styles.row}>
          {dailyRank && (
            <View style={styles.rankItem}>
              <Text style={styles.rankValue}>#{dailyRank}</Text>
              <Text style={styles.rankLabel}>Hoy</Text>
            </View>
          )}
          {weeklyRank && (
            <View style={styles.rankItem}>
              <Text style={[styles.rankValue, { color: colors.gold }]}>#{weeklyRank}</Text>
              <Text style={styles.rankLabel}>Esta semana</Text>
            </View>
          )}
          {bestRank && (
            <View style={styles.rankItem}>
              <Text style={[styles.rankValue, { color: colors.accent }]}>#{bestRank}</Text>
              <Text style={styles.rankLabel}>Mejor posición</Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.noRank}>
          Aún no tienes posición en el ranking. ¡Haz lives y recibe regalos para aparecer!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold + '33',
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rankItem: {
    alignItems: 'center',
    gap: 4,
  },
  rankValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
  },
  rankLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  noRank: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
