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
      case 'diamond_purchase':
        return '💳';
      case 'gift_sent':
        return '🎁';
      case 'gift_received':
        return '💝';
      case 'beans_earned':
        return '🫘';
      case 'payout_requested':
        return '🏧';
      case 'payout_paid':
        return '✅';
      case 'payout_rejected':
        return '❌';
      case 'vip_purchase':
        return '👑';
      case 'reward':
        return '🌟';
      case 'admin_adjustment':
        return '🔧';
      default:
        return '🔧';
    }
  };

  const getCurrencySymbol = () => {
    return tx.currencyType === 'diamonds' ? '💎' : '🫘';
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
    case 'diamond_purchase':
      return 'Compra de diamantes';
    case 'gift_sent':
      return 'Regalo enviado';
    case 'gift_received':
      return 'Regalo recibido';
    case 'beans_earned':
      return 'Beans ganados por regalo';
    case 'payout_requested':
      return 'Retiro solicitado';
    case 'payout_paid':
      return 'Retiro pagado';
    case 'payout_rejected':
      return 'Retiro rechazado';
    case 'vip_purchase':
      return 'Suscripción VIP';
    case 'reward':
      return 'Recompensa';
    case 'admin_adjustment':
      return 'Ajuste administrativo';
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
