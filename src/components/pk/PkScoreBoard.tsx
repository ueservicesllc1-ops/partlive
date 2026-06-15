import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { PkBattle } from '../../types/pk';

interface PkScoreBoardProps {
  battle: PkBattle;
}

export const PkScoreBoard: React.FC<PkScoreBoardProps> = ({ battle }) => {
  const scoreA = battle.hostAScore || 0;
  const scoreB = battle.hostBScore || 0;
  const total = scoreA + scoreB;

  // Calculate percentage width (min 10%, max 90% if not zero)
  let percentageA = 50;
  if (total > 0) {
    percentageA = Math.max(10, Math.min(90, Math.round((scoreA / total) * 100)));
  }

  return (
    <View style={styles.container}>
      <View style={styles.scoreTextRow}>
        <View style={[styles.badge, styles.badgeA]}>
          <Text style={styles.nameText} numberOfLines={1}>{battle.hostAName}</Text>
          <Text style={styles.scoreText}>{scoreA} Pts</Text>
        </View>
        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>PK</Text>
        </View>
        <View style={[styles.badge, styles.badgeB]}>
          <Text style={styles.scoreText}>{scoreB} Pts</Text>
          <Text style={styles.nameText} numberOfLines={1}>{battle.hostBName}</Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        <View style={[styles.barA, { flex: percentageA }]} />
        <View style={[styles.barB, { flex: 100 - percentageA }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    width: '100%',
  },
  scoreTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    maxWidth: '42%',
  },
  badgeA: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  badgeB: {
    backgroundColor: 'rgba(255, 51, 102, 0.2)',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  nameText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  scoreText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  vsBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vsText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  barContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
  },
  barA: {
    backgroundColor: colors.accent,
    height: '100%',
  },
  barB: {
    backgroundColor: colors.secondary,
    height: '100%',
  },
});
