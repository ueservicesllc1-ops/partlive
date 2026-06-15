import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { GamePlayer } from '../../types/game';

interface GameScoreBoardProps {
  players: GamePlayer[];
  currentRound: number;
  totalRounds: number;
  myUserId: string;
}

export const GameScoreBoard: React.FC<GameScoreBoardProps> = ({
  players,
  currentRound,
  totalRounds,
  myUserId,
}) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      {/* Round progress */}
      <View style={styles.roundRow}>
        {Array.from({ length: totalRounds }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.roundDot,
              i < currentRound && styles.roundDotDone,
              i === currentRound - 1 && styles.roundDotCurrent,
            ]}
          />
        ))}
        <Text style={styles.roundText}>
          Ronda {currentRound}/{totalRounds}
        </Text>
      </View>

      {/* Score entries */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.scoreRow}>
          {sorted.map((player, i) => (
            <View
              key={player.userId}
              style={[styles.scoreItem, player.userId === myUserId && styles.scoreItemMe]}
            >
              <Text style={styles.scoreRank}>{i === 0 ? '👑' : `${i + 1}`}</Text>
              <Text style={styles.scoreAvatar}>{player.avatarEmoji ?? '🎮'}</Text>
              <Text style={styles.scoreName} numberOfLines={1}>
                {player.username}
              </Text>
              <Text style={styles.scoreValue}>{player.score}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  roundDotDone: { backgroundColor: colors.primary },
  roundDotCurrent: { backgroundColor: colors.accent, width: 12, height: 12, borderRadius: 6 },
  roundText: { ...textPresets.caption, color: colors.textMuted, marginLeft: 'auto' },
  scoreRow: { flexDirection: 'row', gap: spacing.md },
  scoreItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 64,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreItemMe: { borderColor: colors.primary + '88' },
  scoreRank: { fontSize: 14 },
  scoreAvatar: { fontSize: 22 },
  scoreName: { fontSize: 9, color: colors.textMuted, marginTop: 2, maxWidth: 60 },
  scoreValue: { ...textPresets.bodyLarge, color: colors.accent, fontWeight: '700', marginTop: 2 },
});
