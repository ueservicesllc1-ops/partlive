import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';

export const AdminCFOCenterScreen = ({ navigation }: any) => {
  const [overview, setOverview] = useState<any>(null);
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCFOData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/cfo/overview');
      setOverview(res.overview);
    } catch (err) {
      console.error('Error fetching CFO financial overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate100K = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/cfo/simulate', {
        method: 'POST',
        body: JSON.stringify({ dauCount: 100000, payingPercent: 3.5, arppuUsd: 25.0, creatorSharePercent: 50.0 }),
      });
      setSimulation(res.simulation);
      Alert.alert(
        'Simulación 100K DAU Completa',
        `Ingresos Proyectados: $${res.simulation.projectedMonthlyRevenueUsd} | Pasivo Creadores: $${res.simulation.projectedCreatorLiabilityUsd} | Margen Proyectado: $${res.simulation.projectedContributionMarginUsd}`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al ejecutar simulación');
    }
  };

  useEffect(() => {
    fetchCFOData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="💼 Centro Gerencial Financiero (CFO)"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando estado financiero y pasivos contables...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Line Financial Overview */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💰 Resumen Ejecutivo Gerencial (CFO)</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Ventas Brutas (Gross Bookings):</Text>
              <Text style={styles.val}>${((overview?.grossBookingsCents || 0) / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ingresos Netos (Net Revenue):</Text>
              <Text style={styles.val}>${((overview?.netRevenueCents || 0) / 100).toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Pasivo Pendiente Creadores (Creator Liability):</Text>
              <Text style={[styles.val, { color: '#FF9100' }]}>
                ${((overview?.creatorLiabilityCents || 0) / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ingreso Plataforma (Platform Revenue):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>
                ${((overview?.platformRevenueCents || 0) / 100).toFixed(2)}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Tasa de Retención (Platform Take Rate):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{overview?.platformTakeRatePercent}%</Text>
            </View>
          </View>

          {/* Costs & Margins */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📉 Deducciones, Costos y Margen de Contribución</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Comisiones de Pago (Payment Fees):</Text>
              <Text style={styles.val}>${((overview?.paymentFeesCents || 0) / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Costos de Infraestructura (Firebase/LiveKit):</Text>
              <Text style={styles.val}>${((overview?.infrastructureCostCents || 0) / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Reembolsos y Contracargos (Refunds/Chargebacks):</Text>
              <Text style={styles.val}>
                ${(((overview?.refundsCents || 0) + (overview?.chargebacksCents || 0)) / 100).toFixed(2)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Margen de Contribución:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>
                ${((overview?.contributionMarginCents || 0) / 100).toFixed(2)} ({overview?.contributionMarginPercent}%)
              </Text>
            </View>
          </View>

          {/* Scenario Simulator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔮 Simulador de Escenarios Financieros (WHAT-IF)</Text>
            <Text style={styles.subText}>
              Simula ingresos proyectados y márgenes para 100,000 usuarios activos diarios (DAU).
            </Text>
            {simulation && (
              <View style={{ gap: 4, marginTop: 4 }}>
                <Text style={styles.simVal}>Ingreso Mensual Proyectado: ${simulation.projectedMonthlyRevenueUsd}</Text>
                <Text style={styles.simVal}>Pasivo Creadores Proyectado: ${simulation.projectedCreatorLiabilityUsd}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.actionBtn} onPress={handleSimulate100K}>
              <Text style={styles.actionBtnText}>Simular Escenario 100K DAU</Text>
            </TouchableOpacity>
          </View>

          {/* Audit & Legal Guardrail */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>⚖️ AVISO GERENCIAL CONTABLE (MANAGEMENT REPORT)</Text>
            <Text style={styles.noticeText}>
              Este panel opera bajo contabilidad de partida doble con libros contables inmutables. Los balances de los usuarios NO pueden editarse manualmente desde esta interfaz.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 12,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
  },
  val: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  simVal: {
    fontSize: 11,
    color: '#00E5FF',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#26203D',
    marginVertical: 4,
  },
  actionBtn: {
    backgroundColor: colors.accent,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noticeCard: {
    backgroundColor: 'rgba(255, 145, 0, 0.12)',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF9100',
    gap: 4,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9100',
  },
  noticeText: {
    fontSize: 11,
    color: '#FFF',
  },
});
