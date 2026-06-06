import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WalletTransaction } from '../../types';
import { colors, spacing, textPresets } from '../../theme';
import { toDateSafe } from '../../utils/firestoreDates';
import { formatCoins } from '../../utils/formatNumbers';

interface WalletTransactionItemProps {
  tx: WalletTransaction;
}

export const WalletTransactionItem: React.FC<WalletTransactionItemProps> = ({ tx }) => {
  const getIcon = () => {
    switch (tx.type) {
      case 'purchase':
        return '💳';
      case 'gift_sent':
        return '🎁';
      case 'gift_received':
        return '💝';
      case 'daily_bonus':
        return '📅';
      case 'mission_reward':
        return '🏆';
      case 'reward':
        return '🌟';
      case 'withdrawal':
        return '🏧';
      case 'refund':
        return '↩️';
      default:
        return '🔧';
    }
  };

  const getCurrencySymbol = () => {
    return tx.currencyType === 'coins' ? '🪙' : '💎';
  };

  const dateObj = toDateSafe(tx.createdAt);
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Hace momentos';

  const isCredit = tx.direction === 'credit';
  const amountSign = isCredit ? '+' : '-';
  const amountColor = isCredit ? '#4CAF50' : '#FF5252';

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{getIcon()}</Text>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={2}>
          {tx.description || getFallbackDescription(tx)}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      {/* Amount & Currency */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountSign}
          {formatCoins(tx.amount)}
        </Text>
        <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
      </View>
    </View>
  );
};

const getFallbackDescription = (tx: WalletTransaction): string => {
  switch (tx.type) {
    case 'purchase':
      return 'Compra de monedas';
    case 'gift_sent':
      return 'Regalo enviado';
    case 'gift_received':
      return 'Regalo recibido';
    case 'daily_bonus':
      return 'Bono de ingreso diario';
    case 'mission_reward':
      return 'Recompensa de misión';
    case 'withdrawal':
      return 'Retiro de diamantes';
    case 'refund':
      return 'Reembolso';
    default:
      return 'Ajuste de saldo';
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B30',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#292440',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#151221',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 18,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    ...textPresets.bodyMedium,
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 13,
  },
  date: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  currencySymbol: {
    fontSize: 10,
    marginTop: 2,
  },
});
