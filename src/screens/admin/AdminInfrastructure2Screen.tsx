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

export const AdminInfrastructure2Screen = ({ navigation }: any) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [simResult, setSimResult] = useState<any>(null);
  const [drResult, setDrResult] = useState<any>(null);
  const [shardedResult, setShardedResult] = useState<any>(null);
  const [autoScalingEnabled, setAutoScalingEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchInfrastructureData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/scalability-2/metrics');
      setMetrics(res.metrics);
      setAutoScalingEnabled(res.metrics?.autoScalingStatus === 'ENABLED');
    } catch (err) {
      console.error('Error fetching observability metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunLoadTest = async (users: number) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/scalability-2/load-test', {
        method: 'POST',
        body: JSON.stringify({ concurrentUsers: users, concurrentLives: 1000 }),
      });
      setSimResult(res.simulation);
      Alert.alert(
        'Prueba de Carga Completada',
        `Simulación (${users.toLocaleString()} Usuarios Concurrentes): Estado ${res.simulation.status}\nLatencia Promedio: ${res.simulation.avgLatencyMs}ms | Tasa de Error: ${res.simulation.errorRatePercent}%`
      );
    } catch (err: any) {
      Alert.alert('Error Prueba Carga', err.message || 'Error en prueba de carga');
    }
  };

  const handleRunDRFailoverTest = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/scalability-2/dr-failover', {
        method: 'POST',
      });
      setDrResult(res.failover);
      Alert.alert(
        'Prueba de Failover Disaster Recovery',
        `Failover ${res.failover.simulatedOutageTarget}: ${res.failover.failoverStatus} ✅\nRPO: ${res.failover.rpoMinutes}m | RTO: ${res.failover.rtoMinutes}m | Integridad Datos: ${res.failover.dataIntegrityVerified ? 'VERIFICADA' : 'NO'}`
      );
    } catch (err: any) {
      Alert.alert('Error Failover DR', err.message || 'Error al ejecutar prueba DR');
    }
  };

  const handleTestShardedTaps = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/scalability-2/sharded-taps', {
        method: 'POST',
        body: JSON.stringify({ liveId: 'live_superstar_1', rawTapBatch: 500 }),
      });
      setShardedResult(res);
      Alert.alert(
        'Agregación de Contadores Sharded',
        `Lote Recibido: ${res.rawTapsReceived} Taps -> Escrituras Guardadas en Firestore: +${res.firestoreWritesSaved}`
      );
    } catch (err: any) {
      Alert.alert('Error Sharded Taps', err.message || 'Error en agregación');
    }
  };

  const handleToggleAutoScaling = async () => {
    const nextState = !autoScalingEnabled;
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/scalability-2/auto-scaling', {
        method: 'POST',
        body: JSON.stringify({ enabled: nextState }),
      });
      setAutoScalingEnabled(res.autoScaling.enabled);
      Alert.alert(
        'Auto-Scaling de Infraestructura',
        `Auto-Scaling: ${res.autoScaling.enabled ? 'ACTIVADO' : 'DESACTIVADO'}\nWorkers Activos: ${res.autoScaling.currentWorkers}`
      );
    } catch (err: any) {
      Alert.alert('Error Auto-Scaling', err.message || 'Error al cambiar auto-scaling');
    }
  };

  useEffect(() => {
    fetchInfrastructureData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="⚡ Centro de Escalabilidad & Rendimiento 2.0"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando telemetría de latencia SLO y pruebas de carga...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Observability Telemetry & Latency Board */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Telemetría de Observabilidad SLO & Latencia</Text>
            
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{metrics?.currentAvailabilityPercent}%</Text>
                <Text style={styles.kpiLabel}>Disponibilidad (SLO {metrics?.sloTargetPercent}%)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{metrics?.p50LatencyMs} ms</Text>
                <Text style={styles.kpiLabel}>Latencia p50 (API)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{metrics?.p95LatencyMs} ms</Text>
                <Text style={styles.kpiLabel}>Latencia p95 (DB)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{metrics?.p99LatencyMs} ms</Text>
                <Text style={styles.kpiLabel}>Latencia p99 (Streaming)</Text>
              </View>
            </View>
          </View>

          {/* Load Testing Simulator (10K / 100K Users) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚀 Simulador de Carga Masiva (High Concurrency)</Text>
            <Text style={styles.subText}>Simula hasta 100,000 usuarios concurrentes y 1,000 transmisiones simultáneas.</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => handleRunLoadTest(10000)}>
                <Text style={styles.actionBtnText}>Probar 10K Usuarios</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#00E5FF' }]} onPress={() => handleRunLoadTest(100000)}>
                <Text style={[styles.actionBtnText, { color: '#000' }]}>Probar 100K Usuarios</Text>
              </TouchableOpacity>
            </View>

            {simResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Simulación #{simResult.simulationId.slice(0, 8)}: {simResult.status}</Text>
                <Text style={styles.resultSub}>Latencia: {simResult.avgLatencyMs}ms | Mensajes Chat/seg: {simResult.chatMessagesPerSecond?.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {/* Sharded Counter & Write Reduction Simulator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🧩 Reducción de Escrituras (Sharded Counters)</Text>
            <Text style={styles.subText}>Demuestra el ahorro de escrituras en Firestore agrupando lotes de Taps.</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={handleTestShardedTaps}>
              <Text style={styles.actionBtnText}>Probar Lote 500 Taps Masivos</Text>
            </TouchableOpacity>

            {shardedResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Escrituras Ahorradas: +{shardedResult.firestoreWritesSaved}</Text>
                <Text style={styles.resultSub}>Taps Recibidos: {shardedResult.rawTapsReceived} | Shards Actualizados: {shardedResult.shardsUpdated}</Text>
              </View>
            )}
          </View>

          {/* Disaster Recovery Failover Controls */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛡️ Prueba de Failover Disaster Recovery (RPO / RTO)</Text>
            <Text style={styles.subText}>Prueba la resiliencia y el failover ante interrupción simulada de LiveKit.</Text>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF5252' }]} onPress={handleRunDRFailoverTest}>
              <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Ejecutar Simulación DR Failover</Text>
            </TouchableOpacity>

            {drResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Estado DR: {drResult.failoverStatus} ✅</Text>
                <Text style={styles.resultSub}>RPO: {drResult.rpoMinutes} min (Meta &lt;= 5m) | RTO: {drResult.rtoMinutes} min (Meta &lt;= 15m)</Text>
              </View>
            )}
          </View>

          {/* Auto-Scaling Controls */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ Control de Auto-Scaling de Infraestructura</Text>
            <Text style={styles.subText}>Habilita o inhabilita el escalado automático de workers en tiempo real.</Text>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: autoScalingEnabled ? '#FF5252' : '#00E5FF' }]}
              onPress={handleToggleAutoScaling}
            >
              <Text style={[styles.actionBtnText, { color: autoScalingEnabled ? '#FFF' : '#000' }]}>
                {autoScalingEnabled ? 'Desactivar Auto-Scaling' : 'Activar Auto-Scaling de Workers'}
              </Text>
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
  btnRow: {
    flexDirection: 'row',
    gap: 8,
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
  resultBox: {
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  resultSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
