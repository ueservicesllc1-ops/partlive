import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { formatCoins } from '../../utils/formatNumbers';

interface WalletSummaryProps {
  coins: number;
  diamonds: number;
}

export const WalletSummary = ({ coins, diamonds }: WalletSummaryProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Billetera</Text>
        <TouchableOpacity disabled>
          <Text style={styles.historyText}>Historial ❯</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balances}>
        <View style={styles.balanceItem}>
          <Text style={styles.icon}>🪙</Text>
          <View>
            <Text style={styles.balanceValue}>{formatCoins(coins)}</Text>
            <Text style={styles.balanceLabel}>Monedas</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.balanceItem}>
          <Text style={styles.icon}>💎</Text>
          <View>
            <Text style={styles.balanceValue}>{formatCoins(diamonds)}</Text>
            <Text style={styles.balanceLabel}>Diamantes</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.buyButton} disabled>
        <Text style={styles.buyButtonText}>Comprar Monedas</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
  },
  historyText: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
  },
  balances: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 32,
  },
  balanceValue: {
    ...textPresets.h3,
    color: colors.text,
    fontSize: 20,
  },
  balanceLabel: {
    ...textPresets.caption,
    color: colors.textMuted,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  buyButton: {
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.5)',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    opacity: 0.7,
  },
  buyButtonText: {
    ...textPresets.bodyMedium,
    color: '#FFB800',
    fontWeight: 'bold',
  },
});
