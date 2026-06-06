import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { usePayouts } from '../../hooks/usePayouts';
import { useHostDashboard } from '../../hooks/useHostDashboard';
import { PAYOUT_CONFIG } from '../../constants/payoutConfig';
import { PayoutMethodCard, PayoutConversionPreview } from '../../components/payouts';
import { HostPayoutMethod } from '../../types/payout';

export const RequestPayoutScreen = ({ navigation }: any) => {
  const { stats } = useHostDashboard();
  const { payoutMethods, requestWithdrawal, loading } = usePayouts();
  
  const [diamondsStr, setDiamondsStr] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<HostPayoutMethod | null>(
    payoutMethods.find(m => m.isDefault) || payoutMethods[0] || null
  );
  
  const [showMethodSelector, setShowMethodSelector] = useState(false);

  const availableDiamonds = stats?.availableDiamonds ?? 0;
  const diamonds = parseInt(diamondsStr) || 0;

  const handleSetMax = () => {
    setDiamondsStr(availableDiamonds.toString());
  };

  const handleRequest = async () => {
    if (!selectedMethod) {
      Alert.alert('Falta Método de Pago', 'Debes configurar y seleccionar un método de pago antes de continuar.');
      return;
    }

    if (diamonds < PAYOUT_CONFIG.MIN_PAYOUT_DIAMONDS) {
      Alert.alert('Monto insuficiente', `El monto mínimo a retirar es de ${PAYOUT_CONFIG.MIN_PAYOUT_DIAMONDS.toLocaleString()} diamantes.`);
      return;
    }

    if (diamonds > availableDiamonds) {
      Alert.alert('Saldo insuficiente', 'No tienes suficientes diamantes en tu balance disponible.');
      return;
    }

    Alert.alert(
      'Confirmar Retiro',
      `¿Deseas enviar una solicitud para retirar ${diamonds.toLocaleString()} diamantes? Se bloquearán en tu balance hasta ser procesados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await requestWithdrawal(diamonds, selectedMethod.id);
              Alert.alert('Solicitud Creada', 'Tu solicitud de retiro fue enviada correctamente.', [
                { text: 'OK', onPress: () => navigation.navigate('HostPayouts') }
              ]);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Hubo un error al procesar el retiro.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar Retiro</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Available Balance Box */}
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Tu Balance Disponible</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.diamondEmoji}>💎</Text>
            <Text style={styles.balanceVal}>{availableDiamonds.toLocaleString()}</Text>
          </View>
          <Text style={styles.minLabel}>Mínimo requerido: {PAYOUT_CONFIG.MIN_PAYOUT_DIAMONDS.toLocaleString()} 💎</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.inputCard}>
          <Text style={styles.sectionTitle}>Cantidad de Diamantes a Retirar</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ej. 10000"
              placeholderTextColor={colors.textDark}
              keyboardType="number-pad"
              value={diamondsStr}
              onChangeText={setDiamondsStr}
            />
            <TouchableOpacity onPress={handleSetMax} style={styles.maxBtn}>
              <Text style={styles.maxText}>MÁX</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payout Method Picker */}
        <View style={styles.methodCard}>
          <Text style={styles.sectionTitle}>Enviar fondos a:</Text>
          {payoutMethods.length === 0 ? (
            <TouchableOpacity
              style={styles.noMethodBox}
              onPress={() => navigation.navigate('PayoutMethods')}
            >
              <Text style={styles.noMethodEmoji}>⚠️</Text>
              <Text style={styles.noMethodTitle}>No tienes métodos configurados</Text>
              <Text style={styles.noMethodBtnText}>Configurar ahora →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.methodSelectorBtn}
              onPress={() => setShowMethodSelector(true)}
            >
              {selectedMethod && (
                <View style={styles.selectedMethodRow}>
                  <Text style={styles.selectedMethodIcon}>
                    {selectedMethod.type === 'paypal' ? '🅿️' : selectedMethod.type === 'bank_transfer' ? '🏦' : '💸'}
                  </Text>
                  <View style={styles.selectedMethodInfo}>
                    <Text style={styles.selectedMethodLabel}>{selectedMethod.label}</Text>
                    <Text style={styles.selectedMethodMasked}>{selectedMethod.maskedDetails}</Text>
                  </View>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Live Conversion Summary */}
        {diamonds >= 1000 && <PayoutConversionPreview diamonds={diamonds} />}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (loading || diamonds < PAYOUT_CONFIG.MIN_PAYOUT_DIAMONDS || diamonds > availableDiamonds || !selectedMethod) && styles.disabledBtn
          ]}
          onPress={handleRequest}
          disabled={loading || diamonds < PAYOUT_CONFIG.MIN_PAYOUT_DIAMONDS || diamonds > availableDiamonds || !selectedMethod}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Procesando...' : 'Enviar Solicitud'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Method Selector Modal */}
      <Modal visible={showMethodSelector} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elige una Cuenta</Text>
              <TouchableOpacity onPress={() => setShowMethodSelector(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {payoutMethods.map((m) => (
                <PayoutMethodCard
                  key={m.id}
                  method={m}
                  selected={selectedMethod?.id === m.id}
                  onPress={() => {
                    setSelectedMethod(m);
                    setShowMethodSelector(false);
                  }}
                  selectable
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  balanceBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  diamondEmoji: { fontSize: 22, marginRight: spacing.xs },
  balanceVal: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  minLabel: { fontSize: 11, color: colors.textDark, marginTop: spacing.xs },
  inputCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: spacing.md,
  },
  maxBtn: {
    backgroundColor: colors.primary + '22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  maxText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  methodCard: {
    marginBottom: spacing.lg,
  },
  noMethodBox: {
    backgroundColor: colors.surface,
    borderColor: colors.error + '44',
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.lg,
    alignItems: 'center',
  },
  noMethodEmoji: { fontSize: 28, marginBottom: 4 },
  noMethodTitle: { fontSize: 14, color: colors.text, fontWeight: 'bold', marginBottom: spacing.xs },
  noMethodBtnText: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
  methodSelectorBtn: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
  },
  selectedMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedMethodIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  selectedMethodInfo: {
    flex: 1,
  },
  selectedMethodLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedMethodMasked: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.textDark,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    marginTop: spacing.md,
  },
  disabledBtn: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  modalScroll: {
    paddingBottom: spacing.xxl,
  },
});
