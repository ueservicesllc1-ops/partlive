import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';

export const AdminDataIntelligenceScreen = ({ navigation }: any) => {
  const [cohorts, setCohorts] = useState<any>(null);
  const [economics, setEconomics] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [nlQuery, setNlQuery] = useState('');
  const [nlAnswer, setNlAnswer] = useState<any>(null);
  const [selectedScenario, setSelectedScenario] = useState<'CONSERVATIVE' | 'BASE' | 'AGGRESSIVE'>('BASE');
  const [loading, setLoading] = useState(true);

  const fetchBIData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const cohortRes = await apiFetch<any>('/bi/cohorts');
      const econRes = await apiFetch<any>('/bi/unit-economics');
      const forecastRes = await apiFetch<any>('/bi/forecast', {
        method: 'POST',
        body: JSON.stringify({ scenario: selectedScenario, forecastPeriodDays: 30 }),
      });
      const recsRes = await apiFetch<any>('/bi/recommendations');

      setCohorts(cohortRes.cohorts);
      setEconomics(econRes.economics);
      setForecast(forecastRes.forecast);
      setRecs(recsRes.recommendations || []);
    } catch (err) {
      console.error('Error fetching BI data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = async (scenario: 'CONSERVATIVE' | 'BASE' | 'AGGRESSIVE') => {
    setSelectedScenario(scenario);
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/bi/forecast', {
        method: 'POST',
        body: JSON.stringify({ scenario, forecastPeriodDays: 30 }),
      });
      setForecast(res.forecast);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al simular escenario');
    }
  };

  const handleRunNLQuery = async () => {
    if (!nlQuery.trim()) return;
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/bi/query', {
        method: 'POST',
        body: JSON.stringify({ queryPrompt: nlQuery }),
      });
      setNlAnswer(res);
    } catch (err: any) {
      Alert.alert('Error BI NL Query', err.message || 'Error procesando consulta');
    }
  };

  useEffect(() => {
    fetchBIData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🧠 Data & Business Intelligence Engine"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando analítica de cohortes, LTV, ARPU y simulaciones...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Unit Economics */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Economía Unitarias (Unit Economics & LTV)</Text>
            
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>${economics?.arpuUsd?.toFixed(2)} USD</Text>
                <Text style={styles.kpiLabel}>ARPU (Por Usuario)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>${economics?.arppuUsd?.toFixed(2)} USD</Text>
                <Text style={styles.kpiLabel}>ARPPU (Pagadores)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>${economics?.userLtvUsd?.toFixed(2)} USD</Text>
                <Text style={styles.kpiLabel}>LTV Usuario Promedio</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>${economics?.creatorLtvUsd?.toFixed(2)} USD</Text>
                <Text style={styles.kpiLabel}>LTV Creador Promedio</Text>
              </View>
            </View>
          </View>

          {/* Retention Cohorts */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Curva de Retención de Cohortes (D1 - D90)</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Día 1 (D1):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{cohorts?.d1Percent}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Día 7 (D7):</Text>
              <Text style={styles.val}>{cohorts?.d7Percent}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Día 30 (D30):</Text>
              <Text style={styles.val}>{cohorts?.d30Percent}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Día 90 (D90):</Text>
              <Text style={styles.val}>{cohorts?.d90Percent}%</Text>
            </View>
          </View>

          {/* Revenue Forecasting & Scenario Modeling */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔮 Simulador de Pronóstico de Ingresos (30 Días)</Text>
            <View style={styles.scenarioRow}>
              {(['CONSERVATIVE', 'BASE', 'AGGRESSIVE'] as const).map((sc) => (
                <TouchableOpacity
                  key={sc}
                  style={[styles.scBtn, selectedScenario === sc && styles.scBtnActive]}
                  onPress={() => handleScenarioChange(sc)}
                >
                  <Text style={[styles.scBtnText, selectedScenario === sc && styles.scBtnTextActive]}>
                    {sc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Ingresos Brutos Proyectados:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>${forecast?.projectedGrossRevenueUsd?.toLocaleString()} USD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ingresos Netos Plataforma:</Text>
              <Text style={styles.val}>${forecast?.projectedNetRevenueUsd?.toLocaleString()} USD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Obligación de Payouts Creadores:</Text>
              <Text style={[styles.val, { color: '#FF5252' }]}>${forecast?.projectedPayoutsUsd?.toLocaleString()} USD</Text>
            </View>
          </View>

          {/* Natural Language BI Query Bar */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💬 Consulta BI en Lenguaje Natural</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: ¿Cuál es el LTV de los usuarios o proyección de ingresos?"
              placeholderTextColor={colors.textMuted}
              value={nlQuery}
              onChangeText={setNlQuery}
            />
            <TouchableOpacity style={styles.actionBtn} onPress={handleRunNLQuery}>
              <Text style={styles.actionBtnText}>Consultar Motor BI</Text>
            </TouchableOpacity>

            {nlAnswer && (
              <View style={styles.answerBox}>
                <Text style={styles.answerText}>{nlAnswer.answer}</Text>
                <Text style={styles.sourceText}>Confianza: {nlAnswer.confidence} | Datos: {JSON.stringify(nlAnswer.sourceMetrics)}</Text>
              </View>
            )}
          </View>

          {/* AI Recommendations */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💡 Recomendaciones Ejecutivas Respaldadas por Datos</Text>
            {recs.map((r) => (
              <View key={r.id} style={styles.recItem}>
                <Text style={styles.recTitle}>{r.title}</Text>
                <Text style={styles.recText}>{r.recommendation}</Text>
                <Text style={styles.recImpact}>Impacto Estimado: {r.expectedImpact}</Text>
              </View>
            ))}
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
  scenarioRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  scBtn: {
    flex: 1,
    backgroundColor: '#26203D',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  scBtnActive: {
    backgroundColor: colors.accent,
  },
  scBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scBtnTextActive: {
    color: '#000',
  },
  input: {
    backgroundColor: '#1C1830',
    color: '#FFF',
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#26203D',
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
  answerBox: {
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  answerText: {
    fontSize: 12,
    color: '#00E5FF',
    fontWeight: 'bold',
  },
  sourceText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  recItem: {
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    gap: 2,
    marginTop: 4,
  },
  recTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  recText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  recImpact: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginTop: 2,
  },
});
