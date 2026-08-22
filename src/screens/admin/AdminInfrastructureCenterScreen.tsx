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

export const AdminInfrastructureCenterScreen = ({ navigation }: any) => {
  const [baseline, setBaseline] = useState<any>(null);
  const [costModel, setCostModel] = useState<any>(null);
  const [breakers, setBreakers] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInfraData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const baseRes = await apiFetch<any>('/infra/baseline');
      const costRes = await apiFetch<any>('/infra/cost-model');
      const cbRes = await apiFetch<any>('/infra/circuit-breakers');

      setBaseline(baseRes.baseline);
      setCostModel(costRes.costModel);
      setBreakers(cbRes.circuitBreakers);
    } catch (err) {
      console.error('Error fetching infra data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDLQTest = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/infra/jobs', {
        method: 'POST',
        body: JSON.stringify({ jobType: 'ANALYTICS_AGGREGATION', simulateFailure: true }),
      });
      Alert.alert(
        'Prueba de Trabajo Asíncrono',
        `Trabajo ID: ${res.job.jobId} | Estado: ${res.job.status} | Reintentos Excedidos -> Enviado a la Cola DLQ.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error en prueba de trabajo DLQ');
    }
  };

  const handleRunDRTest = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/infra/disaster-recovery', { method: 'POST' });
      Alert.alert(
        'Prueba de Recuperación ante Desastres (DR)',
        `Snapshot ID: ${res.drTest.backupId} | RPO: ${res.drTest.rpoMinutes}m | RTO: ${res.drTest.rtoMinutes}m | Estado: ${res.drTest.restoreSimulationStatus}`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error en prueba de recuperación DR');
    }
  };

  useEffect(() => {
    fetchInfraData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="⚡ Infraestructura, Rendimiento & DR"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando latencias p50/p95/p99 y economía de infraestructura...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Performance & SLO Error Budget */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⏱️ Benchmarks de Latencia & Presupuesto de Error SLO</Text>
            
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{baseline?.p50Ms} ms</Text>
                <Text style={styles.kpiLabel}>Latencia p50 (Mediana)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{baseline?.p95Ms} ms</Text>
                <Text style={styles.kpiLabel}>Latencia p95 (95%)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{baseline?.p99Ms} ms</Text>
                <Text style={styles.kpiLabel}>Latencia p99 (Pico)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{baseline?.errorBudgetRemainingPercent}%</Text>
                <Text style={styles.kpiLabel}>Error Budget Restante</Text>
              </View>
            </View>
          </View>

          {/* Infrastructure Cost Economics */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💵 Economía de Infraestructura por Usuario y Live</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Costo por Usuario Activo:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>${costModel?.costPerUserUsd} USD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Costo por Hora de Live:</Text>
              <Text style={styles.val}>${costModel?.costPerLiveHourUsd} USD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Lecturas / Escrituras Firestore Día:</Text>
              <Text style={styles.val}>
                {costModel?.firestoreReadsPerDay?.toLocaleString()} / {costModel?.firestoreWritesPerDay?.toLocaleString()}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Proyección Mensual Infraestructura:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>${costModel?.monthlyForecastUsd} USD</Text>
            </View>
          </View>

          {/* Circuit Breakers */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔌 Interruptores de Circuito (Circuit Breakers)</Text>
            <Text style={styles.subText}>Aísla caídas de proveedores externos manteniendo el streaming activo.</Text>

            {breakers &&
              Object.values(breakers).map((cb: any) => (
                <View key={cb.serviceName} style={styles.cbRow}>
                  <Text style={styles.cbName}>{cb.serviceName}</Text>
                  <Text style={[styles.cbState, { color: cb.state === 'CLOSED' ? '#00E5FF' : '#FF5252' }]}>
                    {cb.state}
                  </Text>
                </View>
              ))}
          </View>

          {/* DR & Job Workers Tools */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛠️ Simulación de Desastres y Trabajos en Segundo Plano</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleRunDLQTest}>
              <Text style={styles.actionBtnText}>Simular Trabajo Asíncrono en Cola DLQ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#26203D', marginTop: 8 }]} onPress={handleRunDRTest}>
              <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Ejecutar Prueba de Recuperación ante Desastres (DR)</Text>
            </TouchableOpacity>
          </View>

          {/* Performance Notice */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>⚡ OPTIMIZACIÓN CONTINUA SIN RECONSTRUCCIÓN</Text>
            <Text style={styles.noticeText}>
              LiveKit WebRTC, Juegos, Karaoke y Wallet operan sobre cachés CDN optimizados. Ningún Tap escribe individualmente en Firestore para proteger la escala horizontal hasta 100K+ usuarios.
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  kpiBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  kpiLabel: {
    fontSize: 10,
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
  cbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#26203D',
  },
  cbName: {
    fontSize: 12,
    color: '#FFF',
  },
  cbState: {
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00E5FF',
    gap: 4,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  noticeText: {
    fontSize: 11,
    color: '#FFF',
  },
});
