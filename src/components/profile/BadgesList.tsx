import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';

interface BadgesListProps {
  badges: string[];
}

export const BadgesList = ({ badges }: BadgesListProps) => {
  if (!badges || badges.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insignias</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {badges.map((badge, index) => (
          <View key={index} style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    paddingLeft: spacing.lg,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: '#292440',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...textPresets.caption,
    color: '#fff',
    fontWeight: 'bold',
  },
});
