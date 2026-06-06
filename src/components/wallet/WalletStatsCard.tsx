import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { formatCoins } from '../../utils/formatNumbers';

interface WalletStatsCardProps {
  lifetimeCoinsPurchased: number;
  lifetimeCoinsSpent: number;
  lifetimeDiamondsEarned: number;
  lifetimeDiamondsWithdrawn: number;
}

export const WalletStatsCard: React.FC<WalletStatsCardProps> = ({
  lifetimeCoinsPurchased,
  lifetimeCoinsSpent,
  lifetimeDiamondsEarned,
  lifetimeDiamondsWithdrawn,
}) => {
  const stats = [
    { label: '🪙 Total Monedas Compradas', value: formatCoins(lifetimeCoinsPurchased) },
    { label: '💸 Total Monedas Gastadas', value: formatCoins(lifetimeCoinsSpent) },
    { label: '💎 Total Diamantes Ganados', value: formatCoins(lifetimeDiamondsEarned) },
    { label: '🏧 Total Diamantes Retirados', value: formatCoins(lifetimeDiamondsWithdrawn) },
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
