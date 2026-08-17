import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { formatCoins } from '../../utils/formatNumbers';

interface HostEarningsCardProps {
  availableDiamonds: number;
  pendingDiamonds?: number;
  lifetimeDiamonds: number;
  withdrawnDiamonds?: number;
  isKycVerified?: boolean;
  minPayoutDiamonds?: number;
  diamondUsdRate?: number;
  onRequestPayout?: () => void;
}

export const HostEarningsCard: React.FC<HostEarningsCardProps> = ({
  availableDiamonds = 0,
  pendingDiamonds = 0,
  lifetimeDiamonds = 0,
  withdrawnDiamonds = 0,
  isKycVerified = false,
  minPayoutDiamonds = 5000,
  diamondUsdRate = 0.01,
  onRequestPayout,
}) => {
  const estimatedUsd = (availableDiamonds * diamondUsdRate).toFixed(2);
  const canRequestPayout = availableDiamonds >= minPayoutDiamonds && isKycVerified;

  const handlePayoutPress = () => {
    if (!isKycVerified) {
      Alert.alert(
        'Verificación Requerida',
        'Para solicitar retiros de ganancias, debes completar primero la verificación de identidad (KYC).',
        [{ text: 'Entendido' }]
      );
      return;
    }
    if (availableDiamonds < minPayoutDiamonds) {
      Alert.alert(
        'Mínimo no alcanzado',
        `El mínimo para solicitar retiros es de ${formatCoins(minPayoutDiamonds)} Diamantes (≈ $${(minPayoutDiamonds * diamondUsdRate).toFixed(2)} USD).`,
        [{ text: 'Entendido' }]
      );
      return;
    }
    if (onRequestPayout) {
      onRequestPayout();
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>💎 Panel de Ganancias Creador</Text>
        <View style={[styles.kycBadge, isKycVerified ? styles.kycPass : styles.kycPending]}>
          <Text style={styles.kycText}>
            {isKycVerified ? '✓ KYC Verificado' : '⚠️ KYC Pendiente'}
          </Text>
        </View>
      </View>

      {/* Main USD Equivalent */}
      <View style={styles.usdContainer}>
        <Text style={styles.usdLabel}>Ganancias Disponibles</Text>
        <Text style={styles.usdValue}>${estimatedUsd} <Text style={styles.usdCurrency}>USD</Text></Text>
        <Text style={styles.usdSubtext}>{formatCoins(availableDiamonds)} Diamantes disponibles</Text>
      </View>

      {/* Grid of stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Pendientes</Text>
          <Text style={styles.statValue}>{formatCoins(pendingDiamonds)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Histórico Ganado</Text>
          <Text style={styles.statValue}>{formatCoins(lifetimeDiamonds)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Retirado</Text>
          <Text style={styles.statValue}>{formatCoins(withdrawnDiamonds)}</Text>
        </View>
      </View>

      {/* Request Payout Button */}
      <TouchableOpacity
        style={[
          styles.payoutButton,
          !canRequestPayout && styles.payoutButtonDisabled,
        ]}
        onPress={handlePayoutPress}
        activeOpacity={0.8}
      >
        <Text style={styles.payoutButtonText}>
          💳 Solicitar Retiro de Ganancias
        </Text>
      </TouchableOpacity>
      {!canRequestPayout && (
        <Text style={styles.helperText}>
          {!isKycVerified
            ? 'Requiere verificación KYC aprobada para retiros'
            : `Mínimo de retiro: ${formatCoins(minPayoutDiamonds)} Diamantes`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1B30',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#342D54',
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...textPresets.body,
    fontWeight: 'bold',
    color: colors.text,
    fontSize: 15,
  },
  kycBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kycPass: {
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
  },
  kycPending: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
  },
  kycText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
  },
  usdContainer: {
    alignItems: 'center',
    backgroundColor: '#141124',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#292440',
  },
  usdLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  usdValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CD964',
  },
  usdCurrency: {
    fontSize: 16,
    color: colors.textMuted,
  },
  usdSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#18142B',
    padding: spacing.sm,
    borderRadius: 12,
    marginHorizontal: 3,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  payoutButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutButtonDisabled: {
    backgroundColor: '#2A2542',
    opacity: 0.8,
  },
  payoutButtonText: {
    ...textPresets.body,
    fontWeight: 'bold',
    color: '#FFF',
    fontSize: 14,
  },
  helperText: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});
