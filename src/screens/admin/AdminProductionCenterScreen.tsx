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

export const AdminProductionCenterScreen = ({ navigation }: any) => {
  const [health, setHealth] = useState<any>(null);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProductionStatus = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const healthRes = await apiFetch<any>('/production/health');
      setHealth(healthRes.health);
    } catch (err) {
      console.error('Error fetching production health:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunReconciliation = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/production/reconciliation', { method: 'POST' });
      setReconciliation(res.report);
      Alert.alert('Conciliación Financiera Completa', res.report.notes);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al ejecutar conciliación');
    }
  };

  useEffect(() => {
    fetchProductionStatus();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🛰️ Centro de Producción y DevOps"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando estado de observabilidad y salud...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Overall Health Card */}
          <View style={styles.healthCard}>
            <Text style={styles.cardTitle}>🌐 Estado General de Infraestructura</Text>
            <Text style={styles.healthStatusVal}>
              ESTADO: {health?.overallStatus} 🟢
            </Text>
            <Text style={styles.cardSub}>Última verificación: {health?.timestamp}</Text>
          </View>

          {/* Infrastructure Matrix */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📡 Latencia y Salud por Componente</Text>
            <View style={styles.row}>
              <Text style={styles.compLabel}>API Backend:</Text>
              <Text style={styles.compVal}>{health?.api?.status} ({health?.api?.latencyMs} ms)</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.compLabel}>Firestore Database:</Text>
              <Text style={styles.compVal}>{health?.firestore?.status} ({health?.firestore?.latencyMs} ms)</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.compLabel}>LiveKit Audio/Video:</Text>
              <Text style={styles.compVal}>{health?.liveKit?.status} ({health?.liveKit?.latencyMs} ms)</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.compLabel}>B2 / S3 Storage:</Text>
              <Text style={styles.compVal}>{health?.storage?.status} ({health?.storage?.latencyMs} ms)</Text>
            </View>
          </View>

          {/* Financial Reconciliation Trigger */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Conciliación Contable Financiera</Text>
            <Text style={styles.cardSub}>
              Compara Coins comprados vs Regalos enviados vs Diamantes acreditados. Auditoría 100% de solo lectura.
            </Text>
            {reconciliation && (
              <Text style={styles.reconVal}>
                Coins Comprados: {reconciliation.coinsPurchasedTotal} | Regalos: {reconciliation.coinsSpentGiftsTotal}
              </Text>
            )}
            <TouchableOpacity style={styles.actionBtn} onPress={handleRunReconciliation}>
              <Text style={styles.actionBtnText}>Ejecutar Conciliación Financiera</Text>
            </TouchableOpacity>
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
  healthCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00E5FF',
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  healthStatusVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginTop: 4,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  compVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  reconVal: {
    fontSize: 11,
    color: '#00E5FF',
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: colors.accent,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
