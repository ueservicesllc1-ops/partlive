import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { usePayouts } from '../../hooks/usePayouts';
import { useAuth } from '../../store/AuthContext';
import { PayoutTimeline } from '../../components/payouts';
import { getPayoutMethodTypeLabel, formatPayoutAmountUsd } from '../../utils/payoutStatus';
import firebaseFirestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../constants/firestoreCollections';
import { HostPayout } from '../../types/payout';

export const PayoutDetailsScreen = ({ route, navigation }: any) => {
  const { payoutId, initialPayout } = route.params;
  const { userProfile } = useAuth();
  const {
    cancelWithdrawal,
    adminApprove,
    adminReject,
    adminMarkPaid,
    loading: actionsLoading,
  } = usePayouts();

  const [payout, setPayout] = useState<HostPayout | null>(initialPayout || null);
  const [loading, setLoading] = useState(!initialPayout);
  const [adminNotes, setAdminNotes] = useState('');

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'moderator';

  // Listen to this specific payout document for changes
  useEffect(() => {
    const unsubscribe = firebaseFirestore()
      .collection(FirestoreCollections.HOST_PAYOUTS)
      .doc(payoutId)
      .onSnapshot(
        (doc) => {
          if (doc.exists()) {
            setPayout({ id: doc.id, ...doc.data() } as HostPayout);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error listening to payout details:', err);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [payoutId]);

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Retiro',
      '¿Estás seguro de que deseas cancelar esta solicitud? Los diamantes serán reembolsados a tu balance.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelWithdrawal(payoutId);
              Alert.alert('Éxito', 'Solicitud cancelada correctamente.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'No se pudo cancelar el retiro.');
            }
          },
        },
      ]
    );
  };

  // Admin Actions
  const handleAdminApprove = async () => {
    try {
      await adminApprove(payoutId, adminNotes);
      Alert.alert('Éxito', 'Solicitud aprobada.');
      setAdminNotes('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Error al aprobar.');
    }
  };

  const handleAdminReject = async () => {
    try {
      await adminReject(payoutId, adminNotes);
      Alert.alert('Éxito', 'Solicitud rechazada. Diamantes devueltos.');
      setAdminNotes('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Error al rechazar.');
    }
  };

  const handleAdminMarkPaid = async () => {
    try {
      await adminMarkPaid(payoutId, adminNotes);
      Alert.alert('Éxito', 'Solicitud marcada como pagada.');
      setAdminNotes('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Error al marcar como pagada.');
    }
  };

  if (loading || !payout) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalles</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isPending = payout.status === 'pending';
  const isApproved = payout.status === 'approved';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del Retiro</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.amountText}>{formatPayoutAmountUsd(payout.amount)}</Text>
          <Text style={styles.diamondsSubText}>💎 {payout.diamondsConverted.toLocaleString()} diamantes</Text>

          <View style={styles.infoGrid}>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Método:</Text>
              <Text style={styles.gridValue}>{getPayoutMethodTypeLabel(payout.payoutMethodType)}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Cuenta:</Text>
              <Text style={styles.gridValue}>{payout.payoutDetailsMasked}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Monto Neto:</Text>
              <Text style={styles.gridValue}>{formatPayoutAmountUsd(payout.netAmount)}</Text>
            </View>
            {payout.adminNotes ? (
              <View style={[styles.gridRow, styles.notesRow]}>
                <Text style={styles.gridLabel}>Notas:</Text>
                <Text style={styles.notesValue}>{payout.adminNotes}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Timeline */}
        <PayoutTimeline payout={payout} />

        {/* Cancel Button for Hosts */}
        {isPending && !isAdmin && (
          <TouchableOpacity
            style={[styles.cancelBtn, actionsLoading && styles.disabledBtn]}
            onPress={handleCancel}
            disabled={actionsLoading}
          >
            <Text style={styles.cancelBtnText}>
              {actionsLoading ? 'Cancelando...' : 'Cancelar Solicitud'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Admin Dashboard Controls */}
        {isAdmin && (
          <View style={styles.adminSection}>
            <Text style={styles.adminTitle}>Panel de Administración</Text>
            
            <TextInput
              style={styles.adminInput}
              placeholder="Notas internas/motivo (ej. ID de transacción PayPal)"
              placeholderTextColor={colors.textDark}
              value={adminNotes}
              onChangeText={setAdminNotes}
            />

            <View style={styles.adminButtonsRow}>
              {isPending && (
                <>
                  <TouchableOpacity
                    style={[styles.adminBtn, styles.rejectBtn, actionsLoading && styles.disabledBtn]}
                    onPress={handleAdminReject}
                    disabled={actionsLoading}
                  >
                    <Text style={styles.adminBtnText}>Rechazar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.adminBtn, styles.approveBtn, actionsLoading && styles.disabledBtn]}
                    onPress={handleAdminApprove}
                    disabled={actionsLoading}
                  >
                    <Text style={styles.adminBtnText}>Aprobar</Text>
                  </TouchableOpacity>
                </>
              )}

              {(isApproved || isPending) && (
                <TouchableOpacity
                  style={[styles.adminBtn, styles.payBtn, actionsLoading && styles.disabledBtn]}
                  onPress={handleAdminMarkPaid}
                  disabled={actionsLoading}
                >
                  <Text style={styles.adminBtnText}>Marcar Pagado</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  backArrow: { fontSize: 24, color: colors.text },
  headerTitle: { ...textPresets.h2, color: colors.text, flex: 1, textAlign: 'center' },
  headerRight: { width: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  detailsCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  diamondsSubText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  infoGrid: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  notesRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  gridLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  notesValue: {
    fontSize: 13,
    color: colors.warning,
    marginTop: 2,
    lineHeight: 18,
  },
  cancelBtn: {
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cancelBtnText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  adminSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderColor: colors.primary + '33',
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.md,
  },
  adminTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  adminInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  adminButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adminBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveBtn: {
    backgroundColor: colors.success,
  },
  rejectBtn: {
    backgroundColor: colors.error,
  },
  payBtn: {
    backgroundColor: colors.primary,
  },
  adminBtnText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
