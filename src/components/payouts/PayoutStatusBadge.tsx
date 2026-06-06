import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PayoutStatus } from '../../types/payout';
import { getPayoutStatusLabel, getPayoutStatusColor } from '../../utils/payoutStatus';

interface PayoutStatusBadgeProps {
  status: PayoutStatus;
}

export const PayoutStatusBadge: React.FC<PayoutStatusBadgeProps> = ({ status }) => {
  const color = getPayoutStatusColor(status);
  
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{getPayoutStatusLabel(status)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
