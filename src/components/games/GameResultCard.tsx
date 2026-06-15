import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { GamePlayer } from '../../types/game';

interface GameResultCardProps {
  isWinner: boolean;
  myPlayer: GamePlayer | null;
  players: GamePlayer[];
  coinsEarned: number;
  xpEarned: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const GameResultCard: React.FC<GameResultCardProps> = ({
  isWinner,
  myPlayer,
  players,
  coinsEarned,
  xpEarned,
  onPlayAgain,
  onExit,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const winner = players.reduce(
    (best, p) => (p.score > (best?.score ?? -1) ? p : best),
    null as GamePlayer | null,
  );

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
      >
        {/* Trophy / emoji result */}
        <Text style={styles.emoji}>{isWinner ? '🏆' : '😅'}</Text>
        <Text style={styles.resultTitle}>{isWinner ? '¡Ganaste!' : '¡Buena Partida!'}</Text>

        {!isWinner && winner && (
          <Text style={styles.winnerText}>
            Ganó: {winner.avatarEmoji ?? '🎮'} {winner.username} ({winner.score} pts)
          </Text>
        )}

        {/* Rewards */}
        <View style={styles.rewardRow}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>🪙</Text>
            <Text style={styles.rewardValue}>+{coinsEarned}</Text>
            <Text style={styles.rewardLabel}>Monedas</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>⭐</Text>
            <Text style={styles.rewardValue}>+{xpEarned}</Text>
            <Text style={styles.rewardLabel}>XP</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>🎯</Text>
            <Text style={styles.rewardValue}>{myPlayer?.score ?? 0}</Text>
            <Text style={styles.rewardLabel}>Puntos</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
            <Text style={styles.exitBtnText}>Salir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.playAgainBtn} onPress={onPlayAgain}>
            <Text style={styles.playAgainText}>Jugar de nuevo</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  resultTitle: { ...textPresets.h1, color: colors.text, marginBottom: 4 },
  winnerText: { ...textPresets.caption, color: colors.textMuted, marginBottom: spacing.xl },
  rewardRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginVertical: spacing.xl,
  },
  rewardItem: { alignItems: 'center', gap: 4 },
  rewardIcon: { fontSize: 24 },
  rewardValue: { ...textPresets.h3, color: colors.accent, fontWeight: '700' },
  rewardLabel: { fontSize: 10, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  exitBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exitBtnText: { ...textPresets.bodyMedium, color: colors.textMuted, fontWeight: '700' },
  playAgainBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  playAgainText: { ...textPresets.bodyMedium, color: '#fff', fontWeight: '700' },
});
