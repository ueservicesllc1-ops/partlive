import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { HostPayout } from '../../types/payout';
import { PayoutStatusBadge } from './PayoutStatusBadge';
import { getPayoutMethodTypeLabel, formatPayoutAmountUsd } from '../../utils/payoutStatus';

interface PayoutListItemProps {
  payout: HostPayout;
  onPress: () => void;
}

export const PayoutListItem: React.FC<PayoutListItemProps> = ({ payout, onPress }) => {
  const getMethodIcon = () => {
    switch (payout.payoutMethodType) {
      case 'paypal':
        return '🅿️';
      case 'bank_transfer':
        return '🏦';
      case 'payoneer':
        return '💸';
      default:
        return '💳';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.8}>
      <View style={styles.leftCol}>
        <Text style={styles.icon}>{getMethodIcon()}</Text>
        <View style={styles.info}>
          <Text style={styles.amount}>{formatPayoutAmountUsd(payout.amount)}</Text>
          <Text style={styles.subtext}>
            💎 {payout.diamondsConverted.toLocaleString()} → {payout.payoutMethodLabel}
          </Text>
        </View>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.date}>{formatDate(payout.createdAt)}</Text>
        <PayoutStatusBadge status={payout.status} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 12,
    color: colors.textDark,
    marginBottom: 6,
  },
});
