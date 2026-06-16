import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Wallet } from '../../types';
import { colors, spacing, textPresets } from '../../theme';

interface WalletBalanceTabProps {
  wallet: Wallet | null;
  onRefresh: () => void;
  onGoToPayout?: () => void;
}

export const WalletBalanceTab: React.FC<WalletBalanceTabProps> = ({
  wallet,
  onRefresh,
  onGoToPayout,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Saldos Disponibles</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshText}>🔄 Actualizar</Text>
        </TouchableOpacity>
      </View>

      {/* Balances Card */}
      <View style={styles.balancesGrid}>
        {/* Diamonds (Bought) */}
        <View style={styles.balanceCard}>
          <Text style={styles.icon}>💎</Text>
          <Text style={styles.balanceLabel}>Diamantes</Text>
          <Text style={styles.balanceValue}>{wallet?.diamonds ?? 0}</Text>
          <Text style={styles.balanceSubtext}>Moneda de compra</Text>
        </View>

        {/* Beans (Earned) */}
        <View style={styles.balanceCard}>
          <Text style={styles.icon}>🌰</Text>
          <Text style={styles.balanceLabel}>Beans</Text>
          <Text style={[styles.balanceValue, { color: colors.gold }]}>
            {wallet?.beans ?? 0}
          </Text>
          <Text style={styles.balanceSubtext}>Moneda de creador</Text>
        </View>
      </View>

      {/* Info Stats Section */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Detalles de Cuenta</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Beans en Tránsito / Pendientes:</Text>
          <Text style={styles.detailVal}>{wallet?.pendingBeans ?? 0} 🌰</Text>
        </View>
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Beans Bloqueados (Seguridad):</Text>
          <Text style={[styles.detailVal, { color: colors.warning }]}>
            {wallet?.lockedBeans ?? 0} 🌰
          </Text>
        </View>
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Historial de Compra Total:</Text>
          <Text style={styles.detailVal}>💎 {wallet?.lifetimeDiamondsPurchased ?? 0}</Text>
        </View>
      </View>

      {/* Guidelines Section */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Reglas de Conversión</Text>
        <Text style={styles.infoParagraph}>
          • <Text style={styles.boldText}>¿Cómo gano Beans?</Text> Al recibir regalos de otros usuarios en salas de voz, directos o juegos, recibes el 40% del valor en Beans.
        </Text>
        <Text style={styles.infoParagraph}>
          • <Text style={styles.boldText}>Retiros (Payouts):</Text> Los Beans acumulados se pueden retirar a tu cuenta bancaria. 1 Bean equivale aproximadamente a <Text style={styles.boldText}>$0.003 USD</Text>.
        </Text>
        <Text style={styles.infoParagraph}>
          • <Text style={styles.boldText}>Auditoría:</Text> Antes de cada pago, el equipo de administración audita el origen de los Beans para prevenir fraudes.
        </Text>
      </View>

      {onGoToPayout && (
        <TouchableOpacity style={styles.actionBtn} onPress={onGoToPayout}>
          <Text style={styles.actionBtnText}>Solicitar Retiro / Payout</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  refreshBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  refreshText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  balancesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  balanceCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  balanceLabel: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: '700',
  },
  balanceValue: {
    ...textPresets.h2,
    fontWeight: '900',
    color: colors.accent,
    marginVertical: 4,
  },
  balanceSubtext: {
    fontSize: 8,
    color: colors.textDark,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailsTitle: {
    ...textPresets.body,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  detailVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  infoCard: {
    backgroundColor: 'rgba(138, 79, 255, 0.04)',
    borderColor: 'rgba(138, 79, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    ...textPresets.bodySmall,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  infoParagraph: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
    marginBottom: 6,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text,
  },
  actionBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnText: {
    color: '#0B0813',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
