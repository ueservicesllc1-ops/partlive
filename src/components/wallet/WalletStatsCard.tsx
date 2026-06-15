import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { formatCoins } from '../../utils/formatNumbers';

interface WalletStatsCardProps {
  lifetimeDiamondsPurchased: number;
  lifetimeDiamondsSpent: number;
  lifetimeBeansEarned: number;
  lifetimeBeansWithdrawn: number;
}

export const WalletStatsCard: React.FC<WalletStatsCardProps> = ({
  lifetimeDiamondsPurchased,
  lifetimeDiamondsSpent,
  lifetimeBeansEarned,
  lifetimeBeansWithdrawn,
}) => {
  const stats = [
    { label: '💎 Total Diamantes Comprados', value: formatCoins(lifetimeDiamondsPurchased) },
    { label: '💸 Total Diamantes Gastados', value: formatCoins(lifetimeDiamondsSpent) },
    { label: '🫘 Total Beans Ganados', value: formatCoins(lifetimeBeansEarned) },
    { label: '🏧 Total Beans Retirados', value: formatCoins(lifetimeBeansWithdrawn) },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estadísticas Históricas</Text>
      <View style={styles.statsList}>
        {stats.map((item, index) => (
          <View key={index} style={[styles.statRow, index === stats.length - 1 && styles.lastRow]}>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={styles.statValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C192E',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#292440',
    marginBottom: spacing.lg,
  },
  title: {
    ...textPresets.bodyMedium,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  statsList: {
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(41, 36, 64, 0.5)',
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: 'bold',
  },
});
