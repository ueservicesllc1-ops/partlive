import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { formatCoins } from '../../utils/formatNumbers';

interface WalletBalanceCardProps {
  coins: number;
  diamonds: number;
  availableDiamonds?: number;
  diamondUsdRate?: number;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  coins,
  diamonds,
  availableDiamonds,
  diamondUsdRate = 0.01,
}) => {
  const currentDiamonds = availableDiamonds ?? diamonds;
  const estimatedUsd = (currentDiamonds * diamondUsdRate).toFixed(2);

  return (
    <View style={styles.container}>
      {/* Coins Box */}
      <View style={styles.box}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🪙</Text>
          <Text style={styles.label}>Coins</Text>
        </View>
        <Text style={styles.amount}>{formatCoins(coins)}</Text>
        <Text style={styles.subtext}>Moneda para regalar</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Diamonds Box */}
      <View style={styles.box}>
        <View style={styles.header}>
          <Text style={styles.emoji}>💎</Text>
          <Text style={styles.label}>Diamonds</Text>
        </View>
        <Text style={styles.amount}>{formatCoins(currentDiamonds)}</Text>
        <Text style={styles.subtext}>≈ ${estimatedUsd} USD</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1E1B30',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#292440',
    marginBottom: spacing.lg,
  },
  box: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 20,
    marginRight: 6,
  },
  label: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  amount: {
    ...textPresets.h2,
    color: colors.text,
    marginVertical: 4,
  },
  subtext: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  divider: {
    width: 1.5,
    backgroundColor: '#292440',
    marginHorizontal: spacing.md,
  },
});
