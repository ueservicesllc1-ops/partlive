import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { GameCardData } from '../../types/game';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.xl * 2 - spacing.sm) / 2;

interface GameCardProps {
  game: GameCardData;
  onPress: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress }) => {
  const isComingSoon = game.status === 'coming_soon';

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: game.color + '55' }]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={isComingSoon}
    >
      {/* Color accent bar */}
      <View style={[styles.accentBar, { backgroundColor: game.color }]} />

      {/* Glow overlay */}
      <View style={[styles.glow, { backgroundColor: game.color + '18' }]} />

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: game.color + '22' }]}>
        <Text style={styles.icon}>{game.icon}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>{game.title}</Text>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>{game.description}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        {isComingSoon ? (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Próximamente</Text>
          </View>
        ) : (
          <>
            <View style={styles.onlineRow}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={styles.onlineText}>
                {game.playersOnline > 999
                  ? `${(game.playersOnline / 1000).toFixed(1)}k`
                  : game.playersOnline}{' '}
                jugando
              </Text>
            </View>
            <View style={[styles.playBtn, { backgroundColor: game.color }]}>
              <Text style={styles.playBtnText}>Jugar</Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  icon: { fontSize: 28 },
  title: {
    ...textPresets.bodyLarge,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  description: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
    minHeight: 28,
    marginBottom: spacing.sm,
  },
  footer: { gap: spacing.xs },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 9, color: colors.textMuted, fontWeight: '600' },
  playBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  playBtnText: { fontSize: 11, fontWeight: '700', color: '#0B0813' },
  comingSoonBadge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});
