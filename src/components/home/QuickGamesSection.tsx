import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { formatCompactNumber } from '../../utils/formatNumbers';

interface QuickGamesProps {
  games: any[];
  onGamePress: (gameId: string) => void;
}

export const QuickGamesSection = ({ games, onGamePress }: QuickGamesProps) => {
  if (!games || games.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Juegos Rápidos 🎮</Text>
      </View>
      
      <View style={styles.grid}>
        {games.slice(0, 4).map((game) => (
          <TouchableOpacity 
            key={game.id} 
            style={[styles.card, { borderTopColor: game.color }]}
            onPress={() => onGamePress(game.id)}
          >
            <View style={styles.iconWrapper}>
              <Text style={styles.icon}>{game.icon}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>{game.name}</Text>
            <Text style={styles.players}>{formatCompactNumber(game.playersOnline)} jugando</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  icon: { fontSize: 24 },
  name: {
    ...textPresets.bodySmall,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  players: {
    ...textPresets.caption,
    color: colors.success,
  },
});
