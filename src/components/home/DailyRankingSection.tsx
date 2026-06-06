import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';

interface RankingProps {
  rankings: any[];
  onViewAll: () => void;
}

export const DailyRankingSection = ({ rankings, onViewAll }: RankingProps) => {
  if (!rankings || rankings.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Top Diario 🏆</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.seeAll}>Ver todos ❯</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.list}>
        {rankings.slice(0, 3).map((item, index) => (
          <View key={item.rank} style={styles.rankItem}>
            <Text style={[styles.rankNumber, index === 0 && styles.firstPlace]}>#{item.rank}</Text>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{item.avatar}</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.score}>{item.score}</Text>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
  },
  seeAll: {
    ...textPresets.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankNumber: {
    ...textPresets.h3,
    color: colors.textMuted,
    width: 30,
  },
  firstPlace: {
    color: '#FFD700',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: { fontSize: 18 },
  name: {
    ...textPresets.bodyMedium,
    color: colors.text,
    flex: 1,
    fontWeight: 'bold',
  },
  score: {
    ...textPresets.caption,
    color: colors.secondary,
    fontWeight: 'bold',
  },
});
