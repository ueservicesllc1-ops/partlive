import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { HostStats } from '../../types';

interface Props {
  stats: HostStats | null;
  onRequestPayout?: () => void;
}

export const HostEarningsCard: React.FC<Props> = ({ stats, onRequestPayout }) => {
  const available = stats?.availableDiamonds ?? 0;
  const pending = stats?.pendingDiamonds ?? 0;
  const locked = stats?.lockedDiamonds ?? 0;
  const total = stats?.totalDiamondsEarned ?? 0;

  return (
    <View style={styles.card}>
      {/* Total headline */}
      <View style={styles.headline}>
        <Text style={styles.diamondEmoji}>💎</Text>
        <View>
          <Text style={styles.totalValue}>{total.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Diamonds ganados</Text>
        </View>
      </View>

      {/* Breakdown row */}
      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={styles.breakdownValue}>{available.toLocaleString()}</Text>
          <Text style={styles.breakdownLabel}>Disponibles</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownItem}>
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
          <Text style={styles.breakdownValue}>{pending.toLocaleString()}</Text>
          <Text style={styles.breakdownLabel}>Pendientes</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownItem}>
          <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
          <Text style={styles.breakdownValue}>{locked.toLocaleString()}</Text>
          <Text style={styles.breakdownLabel}>Bloqueados</Text>
        </View>
      </View>

      {/* Payout notice */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          💡 Los retiros estarán disponibles próximamente. Los diamonds no son dinero hasta que el sistema de payouts esté activo.
        </Text>
      </View>

      {/* Disabled payout button */}
      <TouchableOpacity
        style={styles.payoutButton}
        onPress={onRequestPayout}
        disabled={true}
        accessibilityLabel="Solicitar retiro — próximamente"
      >
        <Text style={styles.payoutButtonText}>Solicitar Retiro (Próximamente)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold + '33',
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  diamondEmoji: {
    fontSize: 44,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.gold,
    letterSpacing: -1,
  },
  totalLabel: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
  },
  breakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  breakdownDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  breakdownLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  noticeBox: {
    backgroundColor: colors.primary + '15',
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  noticeText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  payoutButton: {
    backgroundColor: colors.border,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    opacity: 0.5,
  },
  payoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
