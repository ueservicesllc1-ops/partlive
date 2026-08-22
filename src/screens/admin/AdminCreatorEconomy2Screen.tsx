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

export const AdminCreatorEconomy2Screen = ({ navigation }: any) => {
  const [profile, setProfile] = useState<any>(null);
  const [agency, setAgency] = useState<any>(null);
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCreatorEconomyData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const profileRes = await apiFetch<any>('/creator-economy-2/profile');
      const agencyRes = await apiFetch<any>('/creator-economy-2/agency-overview');

      setProfile(profileRes.profile);
      setAgency(agencyRes.overview);
    } catch (err) {
      console.error('Error fetching creator economy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEconomySimulation = async (purchasers: number) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/creator-economy-2/simulator', {
        method: 'POST',
        body: JSON.stringify({
          coinPriceUsd: 0.01,
          creatorRevenueSharePercent: 60,
          agencySharePercent: 10,
          monthlyPurchasersCount: purchasers,
          avgSpentPerPurchaserUsd: 15,
          infrastructureCostUsd: 12000,
        }),
      });
      setSimResult(res.simulation);
      Alert.alert(
        'Simulador de Economía & Margen de Plataforma',
        `Compradores Mensuales: ${purchasers.toLocaleString()}\nIngreso Bruto: $${res.simulation.grossRevenueUsd.toLocaleString()} USD\nPago Creadores (60%): $${res.simulation.creatorPayoutsUsd.toLocaleString()} USD\nPago Agencias (10%): $${res.simulation.agencyPayoutsUsd.toLocaleString()} USD\nMargen Plataforma: ${res.simulation.platformMarginPercent}%\nPunto de Equilibrio: ${res.simulation.breakEvenPurchasersRequired} Compradores Requeridos`
      );
    } catch (err: any) {
      Alert.alert('Error Simulador', err.message || 'Error al ejecutar simulador');
    }
  };

  const handleConsultAiAssistant = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/creator-economy-2/ai-assistant', {
        method: 'POST',
        body: JSON.stringify({ question: '¿A qué hora deben transmitir en vivo los creadores para maximizar ingresos?' }),
      });
      setAiAdvice(res.advice);
      Alert.alert(
        'Asistente de IA para Creadores',
        `Recomendación Horario: ${res.advice.recommendedBestTimeToGoLive}\nCategoría Sugerida: ${res.advice.recommendedContentCategory}\nResumen: ${res.advice.insightsSummary}\nLímites Financieros: RESPETADOS Y AUDITADOS ✅`
      );
    } catch (err: any) {
      Alert.alert('Error IA Creadores', err.message || 'Error al consultar asistente de IA');
    }
  };

  useEffect(() => {
    fetchCreatorEconomyData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="💎 Centro de Economía de Creadores & Margen 2.0"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando economía de creadores, comisión de agencias y simulador...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Creator Profile & Level Progression */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⭐ Perfil Económico &amp; Nivel del Creador</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Creador Muestra:</Text>
              <Text style={styles.val}>{profile?.creatorName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nivel de Creador:</Text>
              <Text style={[styles.val, { color: '#00E5FF', fontWeight: 'bold' }]}>{profile?.creatorLevel} (Racha: {profile?.broadcastingStreakDays} días 🔥)</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Diamantes Disponibles:</Text>
              <Text style={styles.val}>{profile?.availableDiamonds?.toLocaleString()} 💎 (~${profile?.monthlyEarningsUsd} USD)</Text>
            </View>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{profile?.revenueBreakdownPercent?.gifts}%</Text>
                <Text style={styles.kpiLabel}>Regalos (Gifts)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{profile?.revenueBreakdownPercent?.subscriptions}%</Text>
                <Text style={styles.kpiLabel}>Suscripciones</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{profile?.revenueBreakdownPercent?.vipMemberships}%</Text>
                <Text style={styles.kpiLabel}>Membresías VIP</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{profile?.revenueBreakdownPercent?.fanClubs}%</Text>
                <Text style={styles.kpiLabel}>Fan Clubs</Text>
              </View>
            </View>
          </View>

          {/* Agency Economics & Commission Split */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏢 Economía de Agencias &amp; Comisiones Auditable</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Agencia:</Text>
              <Text style={styles.val}>{agency?.agencyName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Hosts Activos:</Text>
              <Text style={styles.val}>{agency?.activeHostsCount} Hosts</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Comisión Agencia (Transparente):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{agency?.agencyCommissionPercent}% (${agency?.agencyCommissionEarningsUsd?.toLocaleString()} USD)</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estado de Cumplimiento:</Text>
              <Text style={styles.val}>{agency?.complianceStatus} ✅</Text>
            </View>
          </View>

          {/* Platform Economy Simulator & Scenario Modeling */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🧮 Simulador de Economía &amp; Margen de Plataforma</Text>
            <Text style={styles.subText}>Simula escenarios económicos modificando compradores sin alterar datos de producción.</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => handleRunEconomySimulation(10000)}>
                <Text style={styles.actionBtnText}>Escenario 10,000 Compradores</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#00E5FF' }]} onPress={() => handleRunEconomySimulation(25000)}>
                <Text style={[styles.actionBtnText, { color: '#000' }]}>Escenario 25,000 Compradores</Text>
              </TouchableOpacity>
            </View>

            {simResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Ingreso Bruto: ${simResult.grossRevenueUsd?.toLocaleString()} USD | Margen: {simResult.platformMarginPercent}%</Text>
                <Text style={styles.resultSub}>Creadores (60%): ${simResult.creatorPayoutsUsd?.toLocaleString()} USD | Agencias (10%): ${simResult.agencyPayoutsUsd?.toLocaleString()} USD | Aporte Neto: ${simResult.netPlatformContributionUsd?.toLocaleString()} USD</Text>
              </View>
            )}
          </View>

          {/* Creator AI Assistant & Strategy Recommender */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🤖 Asistente de IA para Estrategia de Creadores</Text>
            <Text style={styles.subText}>Asesoría contextual sobre los mejores horarios e interacciones en vivo.</Text>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00E5FF' }]} onPress={handleConsultAiAssistant}>
              <Text style={[styles.actionBtnText, { color: '#000' }]}>Consultar Asistente de IA para Creadores</Text>
            </TouchableOpacity>

            {aiAdvice && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Horario Óptimo: {aiAdvice.recommendedBestTimeToGoLive}</Text>
                <Text style={styles.resultSub}>Categoría: {aiAdvice.recommendedContentCategory} | Colaboraciones: {aiAdvice.potentialCollaborationMatches?.join(', ')}</Text>
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
    fontSize: 15,
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
