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
    const t = String(tx.type).toUpperCase();
    if (t.includes('COIN_PURCHASE') || t.includes('PURCHASE')) return '💳';
    if (t.includes('GIFT_SENT') || t.includes('SEND')) return '🎁';
    if (t.includes('GIFT_RECEIVED') || t.includes('DIAMOND_EARNED') || t.includes('RECEIVED')) return '💝';
    if (t.includes('PAYOUT_REQUEST')) return '🏧';
    if (t.includes('PAYOUT_COMPLETED') || t.includes('PAID')) return '✅';
    if (t.includes('PAYOUT_REJECTED')) return '❌';
    if (t.includes('VIP')) return '👑';
    if (t.includes('REWARD')) return '🌟';
    return '🪙';
  };

  const getCurrencySymbol = () => {
    if (tx.currencyType === 'coins') return '🪙';
    if (tx.currencyType === 'diamonds') return '💎';
    return '🪙';
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
  const t = String(tx.type).toUpperCase();
  if (t.includes('COIN_PURCHASE')) return 'Compra de Coins';
  if (t.includes('GIFT_SENT')) return 'Regalo enviado';
  if (t.includes('GIFT_RECEIVED') || t.includes('DIAMOND_EARNED')) return 'Diamantes ganados por regalo';
  if (t.includes('PAYOUT_REQUEST')) return 'Retiro solicitado';
  if (t.includes('PAYOUT_COMPLETED')) return 'Retiro pagado';
  if (t.includes('PAYOUT_REJECTED')) return 'Retiro rechazado';
  if (t.includes('VIP')) return 'Suscripción VIP';
  if (t.includes('REWARD')) return 'Recompensa';
  return 'Transacción de billetera';
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
