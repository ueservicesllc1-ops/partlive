import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { calculatePayoutPreview, formatPayoutAmountUsd } from '../../utils/payoutStatus';
import { PAYOUT_CONFIG } from '../../constants/payoutConfig';

interface PayoutConversionPreviewProps {
  diamonds: number;
}

export const PayoutConversionPreview: React.FC<PayoutConversionPreviewProps> = ({ diamonds }) => {
  const { amountUsd, feeUsd, netAmountUsd } = calculatePayoutPreview(diamonds);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumen de la Conversión</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Cantidad a convertir</Text>
        <Text style={styles.value}>💎 {diamonds.toLocaleString()}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Tasa de cambio</Text>
        <Text style={styles.value}>10,000 💎 = $50 USD</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Subtotal bruto</Text>
        <Text style={styles.value}>{formatPayoutAmountUsd(amountUsd)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Comisión de plataforma</Text>
        <Text style={[styles.value, feeUsd === 0 && styles.free]}>
          {feeUsd === 0 ? '¡Gratis!' : formatPayoutAmountUsd(feeUsd)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Monto Neto a Recibir</Text>
        <Text style={styles.totalValue}>{formatPayoutAmountUsd(netAmountUsd)}</Text>
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          ⚠️ Los retiros se procesan de forma manual y tardan de 1 a 3 días hábiles en reflejarse.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  free: {
    color: colors.success,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
  },
  tipBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  tipText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
