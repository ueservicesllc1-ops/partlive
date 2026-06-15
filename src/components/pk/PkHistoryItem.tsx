import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { PkBattle } from '../../types/pk';

interface PkHistoryItemProps {
  battle: PkBattle;
  currentHostId: string;
}

export const PkHistoryItem: React.FC<PkHistoryItemProps> = ({ battle, currentHostId }) => {
  const isHostA = battle.hostAId === currentHostId;
  const myScore = isHostA ? battle.hostAScore : battle.hostBScore;
  const oppScore = isHostA ? battle.hostBScore : battle.hostAScore;
  const oppName = isHostA ? battle.hostBName : battle.hostAName;

  const isWin = battle.winnerId === currentHostId;
  const isDraw = battle.result === 'draw';

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.oppName}>vs {oppName}</Text>
        <Text style={styles.date}>
          {battle.finishedAt
            ? new Date(battle.finishedAt.toMillis ? battle.finishedAt.toMillis() : battle.finishedAt).toLocaleDateString()
            : ''}
        </Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.scores}>
          {myScore} - {oppScore}
        </Text>
      </View>

      <View style={styles.right}>
        {isWin ? (
          <View style={[styles.badge, styles.winBadge]}>
            <Text style={styles.winText}>Victoria</Text>
          </View>
        ) : isDraw ? (
          <View style={[styles.badge, styles.drawBadge]}>
            <Text style={styles.drawText}>Empate</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.lossBadge]}>
            <Text style={styles.lossText}>Derrota</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  left: {
    flex: 2,
  },
  oppName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  date: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  center: {
    flex: 1.5,
    alignItems: 'center',
  },
  scores: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  right: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  winBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
  },
  drawBadge: {
    backgroundColor: 'rgba(255, 196, 0, 0.15)',
  },
  lossBadge: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
  },
  winText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: 'bold',
  },
  drawText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: 'bold',
  },
  lossText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: 'bold',
  },
});
