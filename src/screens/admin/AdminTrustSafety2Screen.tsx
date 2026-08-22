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

export const AdminTrustSafety2Screen = ({ navigation }: any) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [botTestResult, setBotTestResult] = useState<any>(null);
  const [riskEvalResult, setRiskEvalResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSafetyData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const metricsRes = await apiFetch<any>('/trust-safety-2/metrics');
      const queueRes = await apiFetch<any>('/trust-safety-2/queue');

      setMetrics(metricsRes.metrics);
      setQueue(queueRes.queue || []);
    } catch (err) {
      console.error('Error fetching trust safety metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestBotFilter = async (taps: number) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/trust-safety-2/bot-filter', {
        method: 'POST',
        body: JSON.stringify({ liveId: 'live_stream_superstar', rawTaps: taps }),
      });
      setBotTestResult(res);
      Alert.alert(
        'Filtro de Interacción Automatizada (Bots)',
        `Taps Totales: ${res.rawTaps} -> Taps Válidos: ${res.validTaps} (Filtrados por Bot: ${res.botTapsFiltered})`
      );
    } catch (err: any) {
      Alert.alert('Error Filtro Bot', err.message || 'Error en prueba de bot filter');
    }
  };

  const handleTestRiskEvaluation = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/trust-safety-2/risk-evaluate', {
        method: 'POST',
        body: JSON.stringify({
          hasSpamFlag: true,
          isNewDevice: true,
          reportCount: 3,
          highVelocityGifts: false,
        }),
      });
      setRiskEvalResult(res.evaluation);
      Alert.alert(
        'Evaluación de Riesgo Multi-Señal 2.0',
        `Nivel de Riesgo: ${res.evaluation.riskLevel} (${res.evaluation.riskScore}/100)\nRevisión Humana Obligatoria: ${res.evaluation.requiresHumanReview ? 'SÍ' : 'NO'}`
      );
    } catch (err: any) {
      Alert.alert('Error Evaluación Riesgo', err.message || 'Error al evaluar riesgo');
    }
  };

  useEffect(() => {
    fetchSafetyData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🛡️ Centro de Moderación & Seguridad 2.0"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando cola de moderación, apelaciones y filtros de bots...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Safety Intelligence Telemetry KPIs */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Telemetría de Incidentes & Seguridad en Tiempo Real</Text>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{metrics?.openReportsCount}</Text>
                <Text style={styles.kpiLabel}>Reportes Abiertos</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#FF5252' }]}>{metrics?.urgentCasesCount}</Text>
                <Text style={styles.kpiLabel}>Casos Urgentes</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{metrics?.activeEnforcementsCount}</Text>
                <Text style={styles.kpiLabel}>Sanciones Activas</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{metrics?.botTapsFilteredCount?.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Taps de Bots Filtrados</Text>
              </View>
            </View>
          </View>

          {/* Moderation Queue */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📥 Cola Activa de Casos de Moderación Humana</Text>

            {queue.map((item) => (
              <View key={item.caseId} style={styles.queueItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueTitle}>
                    Caso #{item.caseId} (Riesgo: <Text style={{ color: item.riskScore > 80 ? '#FF5252' : '#00E5FF' }}>{item.riskScore}/100</Text>)
                  </Text>
                  <Text style={styles.queueSub}>
                    Objetivo: {item.targetType} ({item.targetId}) | Asignado: {item.assignedModeratorId || 'Sin asignar'}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: item.status === 'UNASSIGNED' ? '#FF5252' : '#00E5FF' }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Bot & Fake Engagement Filter Simulator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🤖 Simulador de Filtro de Taps Automatizados (Bots)</Text>
            <Text style={styles.subText}>Excluye interacciones masivas de bots de los ránkings de Lives sin alterar contabilidad.</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => handleTestBotFilter(100)}>
                <Text style={styles.actionBtnText}>Taps Normales (100)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#FF5252' }]} onPress={() => handleTestBotFilter(2500)}>
                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Bot Masivo (2,500)</Text>
              </TouchableOpacity>
            </View>

            {botTestResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Validez Ránking: {botTestResult.isRankingEligible ? 'APROBADO ✅' : 'DENEGADO ❌'}</Text>
                <Text style={styles.resultSub}>Taps Orgánicos: {botTestResult.validTaps} | Descartados por Bot: {botTestResult.botTapsFiltered}</Text>
              </View>
            )}
          </View>

          {/* Multi-Signal Risk Score Evaluator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🧠 Evaluador de Riesgo Multi-Señal 2.0</Text>
            <Text style={styles.subText}>Demuestra la política de prohibición de auto-baneos por señal individual.</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={handleTestRiskEvaluation}>
              <Text style={styles.actionBtnText}>Evaluar Riesgo de Usuario Multi-Señal</Text>
            </TouchableOpacity>

            {riskEvalResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Nivel de Riesgo: {riskEvalResult.riskLevel} ({riskEvalResult.riskScore}/100)</Text>
                <Text style={styles.resultSub}>Señales: {riskEvalResult.signals.join(', ')}</Text>
              </View>
            )}
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
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 4,
  },
  queueTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  queueSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
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
