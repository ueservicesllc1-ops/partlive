import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { HostPayoutMethod } from '../../types/payout';
import { getPayoutMethodTypeLabel } from '../../utils/payoutStatus';

interface PayoutMethodCardProps {
  method: HostPayoutMethod;
  onPress?: () => void;
  onDelete?: () => void;
  selected?: boolean;
  selectable?: boolean;
}

export const PayoutMethodCard: React.FC<PayoutMethodCardProps> = ({
  method,
  onPress,
  onDelete,
  selected = false,
  selectable = false,
}) => {
  const getMethodIcon = () => {
    switch (method.type) {
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

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.card,
        selected && styles.selectedCard,
        selectable && !selected && styles.selectableCard,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.leftSection}>
        <Text style={styles.icon}>{getMethodIcon()}</Text>
        <View style={styles.info}>
          <View style={styles.headerRow}>
            <Text style={styles.label}>{method.label}</Text>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Principal</Text>
              </View>
            )}
          </View>
          <Text style={styles.type}>{getPayoutMethodTypeLabel(method.type)}</Text>
          <Text style={styles.details}>{method.maskedDetails}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {selected && <Text style={styles.checkIcon}>✓</Text>}
        {onDelete && !selected && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
  },
  selectableCard: {
    borderColor: colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: spacing.xs,
  },
  defaultBadge: {
    backgroundColor: colors.primary + '33',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
  },
  type: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  details: {
    fontSize: 14,
    color: colors.textDark,
    marginTop: 4,
  },
  rightSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  checkIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
});
