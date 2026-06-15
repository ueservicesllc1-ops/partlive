import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { formatCoins } from '../../utils/formatNumbers';

interface WalletBalanceCardProps {
  diamonds: number;
  beans: number;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({ diamonds, beans }) => {
  return (
    <View style={styles.container}>
      {/* Diamonds Box */}
      <View style={styles.box}>
        <View style={styles.header}>
          <Text style={styles.emoji}>💎</Text>
          <Text style={styles.label}>Diamantes</Text>
        </View>
        <Text style={styles.amount}>{formatCoins(diamonds)}</Text>
        <Text style={styles.subtext}>Usados para enviar regalos</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Beans Box */}
      <View style={styles.box}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🫘</Text>
          <Text style={styles.label}>Beans</Text>
        </View>
        <Text style={styles.amount}>{formatCoins(beans)}</Text>
        <Text style={styles.subtext}>Recibidos de regalos</Text>
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
