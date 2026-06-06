import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { HostStats } from '../../types/host';
import { calculatePayoutPreview, formatPayoutAmountUsd } from '../../utils/payoutStatus';

interface PayoutSummaryCardProps {
  stats: HostStats | null;
}

export const PayoutSummaryCard: React.FC<PayoutSummaryCardProps> = ({ stats }) => {
  const available = stats?.availableDiamonds ?? 0;
  const locked = stats?.lockedDiamonds ?? 0;
  const total = stats?.totalDiamondsEarned ?? 0;

  const { amountUsd: availableUsd } = calculatePayoutPreview(available);
  const { amountUsd: lockedUsd } = calculatePayoutPreview(locked);

  return (
    <View style={styles.container}>
      <View style={styles.mainSection}>
        <Text style={styles.title}>Diamantes Disponibles</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.diamondEmoji}>💎</Text>
          <Text style={styles.diamonds}>{available.toLocaleString()}</Text>
        </View>
        <Text style={styles.usdValue}>≈ {formatPayoutAmountUsd(availableUsd)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>En Proceso</Text>
          <Text style={styles.statVal}>💎 {locked.toLocaleString()}</Text>
          <Text style={styles.statSubVal}>~ {formatPayoutAmountUsd(lockedUsd)}</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Total Acumulado</Text>
          <Text style={styles.statVal}>💎 {total.toLocaleString()}</Text>
          <Text style={styles.statSubVal}>Acumulado total</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 24,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '33', // Subtle violet tint
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  mainSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  diamonds: {
    ...textPresets.h1,
    color: colors.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  usdValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  statVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statSubVal: {
    fontSize: 10,
    color: colors.textDark,
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 35,
    backgroundColor: colors.border,
  },
});
