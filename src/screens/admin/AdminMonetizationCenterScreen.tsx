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

export const AdminMonetizationCenterScreen = ({ navigation }: any) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonetizationData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/monetization/profitability');
      setReport(res.report);
    } catch (err) {
      console.error('Error fetching monetization report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoost = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/monetization/boosts', {
        method: 'POST',
        body: JSON.stringify({ targetType: 'LIVE', targetId: 'demo_live_123', budgetUsd: 15.0, durationHours: 4 }),
      });
      Alert.alert('Impulso (Boost) Creado', `Impulso ID: ${res.boost.id} | Presupuesto: $${res.boost.budgetUsd} USD`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al crear impulso');
    }
  };

  const handleTestPriceProtection = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/monetization/vip/purchase', {
        method: 'POST',
        body: JSON.stringify({ vipLevel: 1, productId: 'VIP_LEVEL_1', clientPriceCents: 100 }), // Correct price is 499
      });
      Alert.alert('Resultado de Prueba', JSON.stringify(res));
    } catch (err: any) {
      Alert.alert('Seguridad Financiera Verificada', `Manipulación de precio bloqueada: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchMonetizationData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="💎 Centro de Monetización Avanzada"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando flujo de ingresos y catálogo de 10 productos...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Revenue Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💰 Ingresos Totales por Fuentes de Monetización</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Ventas Brutas Totales (GMV):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>${report?.grossRevenueUsd?.toFixed(2)} USD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Pago a Creadores (Diamonds):</Text>
              <Text style={styles.val}>${report?.creatorShareUsd?.toFixed(2)} USD</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Coins Virtuales:</Text>
              <Text style={styles.val}>${report?.revenueByProductType?.COINS?.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Membresías VIP (1-5):</Text>
              <Text style={styles.val}>${report?.revenueByProductType?.VIP?.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Suscripciones de Creador:</Text>
              <Text style={styles.val}>${report?.revenueByProductType?.SUBSCRIPTION?.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Entradas de Eventos en Vivo:</Text>
              <Text style={styles.val}>${report?.revenueByProductType?.EVENT_TICKET?.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Impulsos (Boosts) & Sponsorships:</Text>
              <Text style={styles.val}>
                ${((report?.revenueByProductType?.BOOST || 0) + (report?.revenueByProductType?.SPONSORSHIP || 0)).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Product Actions & Protection */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚀 Acciones Comerciales y Seguridad de Precios</Text>
            <Text style={styles.subText}>
              Protege el catálogo impidiendo manipulaciones de precios desde el cliente e incrementa el alcance con Boosts.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCreateBoost}>
              <Text style={styles.actionBtnText}>Crear Impulso (Boost) de Transmisión</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#26203D', marginTop: 8 }]} onPress={handleTestPriceProtection}>
              <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Probar Intento de Manipulación de Precio</Text>
            </TouchableOpacity>
          </View>

          {/* Compliance Notice */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>⚖️ CUMPLIMIENTO COMERCIAL Y LEGAL (LEGAL_REVIEW_REQUIRED)</Text>
            <Text style={styles.noticeText}>
              Todas las ventas de VIP, entradas de eventos y patrocinios requieren validación server-side y registro en el Financial Ledger sin patrones oscuros.
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
