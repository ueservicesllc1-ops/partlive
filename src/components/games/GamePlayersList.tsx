import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { GamePlayer } from '../../types/game';

interface GamePlayersListProps {
  players: GamePlayer[];
  myUserId: string;
  highlightWinnerId?: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export const GamePlayersList: React.FC<GamePlayersListProps> = ({
  players,
  myUserId,
  highlightWinnerId,
}) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      {sorted.map((player, index) => {
        const isMe = player.userId === myUserId;
        const isWinner = player.userId === highlightWinnerId;

        return (
          <View
            key={player.userId}
            style={[
              styles.row,
              isMe && styles.rowMe,
              isWinner && styles.rowWinner,
            ]}
          >
            <Text style={styles.rank}>
              {index < 3 ? MEDALS[index] : `${index + 1}.`}
            </Text>
            <Text style={styles.avatar}>{player.avatarEmoji ?? '🎮'}</Text>
            <View style={styles.info}>
              <Text style={styles.name}>
                {player.username}
                {isMe ? ' (Tú)' : ''}
              </Text>
              <Text style={styles.rounds}>{player.roundsWon} rondas ganadas</Text>
            </View>
            <Text style={styles.score}>{player.score} pts</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  rowMe: { borderColor: colors.primary + '99' },
  rowWinner: { borderColor: colors.gold, backgroundColor: colors.gold + '11' },
  rank: { fontSize: 18, width: 28, textAlign: 'center' },
  avatar: { fontSize: 24 },
  info: { flex: 1 },
  name: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '600' },
  rounds: { fontSize: 10, color: colors.textMuted },
  score: { ...textPresets.bodyLarge, color: colors.accent, fontWeight: '700' },
});
