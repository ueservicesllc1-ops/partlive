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

export const AdminGrowthAcquisitionScreen = ({ navigation }: any) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [campaignState, setCampaignState] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchGrowthData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/growth-acq/metrics');
      setMetrics(res.metrics);
    } catch (err) {
      console.error('Error fetching growth acquisition metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestQualifiedReferral = async (isFraud: boolean) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/growth-acq/referral/qualify', {
        method: 'POST',
        body: JSON.stringify({
          referrerId: 'user_referrer_777',
          qualificationEvent: 'FIRST_PURCHASE',
          deviceId: isFraud ? 'same_device_flag' : 'unique_device_999',
        }),
      });
      setTestResult(res.referral);
      Alert.alert(
        'Prueba de Calificación de Referido',
        res.referral.status === 'QUALIFIED'
          ? `Referido CALIFICADO ✅ (+${res.referral.rewardCoins} Coins)`
          : `Referido RETENIDO POR FRAUDE ⚠️ (${res.referral.reason})`
      );
    } catch (err: any) {
      Alert.alert('Error Calificación', err.message || 'Error en prueba de referido');
    }
  };

  const handleToggleCampaignKillSwitch = async () => {
    const nextState = !campaignState;
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/growth-acq/kill-switch', {
        method: 'POST',
        body: JSON.stringify({ campaignId: 'camp_summer_viral', enabled: nextState }),
      });
      setCampaignState(res.campaign.status === 'ACTIVE');
      Alert.alert(
        'Kill Switch de Campaña',
        `Estado de Campaña camp_summer_viral: ${res.campaign.status}`
      );
    } catch (err: any) {
      Alert.alert('Error Kill Switch', err.message || 'Error al cambiar interruptor');
    }
  };

  useEffect(() => {
    fetchGrowthData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🚀 Centro de Crecimiento & Adquisición"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando K-Factor, atribución multi-touch y presupuesto...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Executive Growth KPIs */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Métricas de Crecimiento Viral & Ratio LTV/CAC</Text>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{metrics?.kFactor}x</Text>
                <Text style={styles.kpiLabel}>Factor K (Viralidad)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{metrics?.overallLtvToCacRatio}x</Text>
                <Text style={styles.kpiLabel}>Ratio LTV / CAC</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>${metrics?.cacReferralUsd?.toFixed(2)} USD</Text>
                <Text style={styles.kpiLabel}>CAC Referidos</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>${metrics?.cacCampaignUsd?.toFixed(2)} USD</Text>
                <Text style={styles.kpiLabel}>CAC Campañas</Text>
              </View>
            </View>
          </View>

          {/* Multi-Touch Attribution Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌐 Atribución Multi-Canal (First & Last Touch)</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Orgánico (Directo / Búsqueda):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>42.5%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Referidos de Usuarios (Deep Links):</Text>
              <Text style={styles.val}>34.8%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Creadores & Reclutamiento Agencia:</Text>
              <Text style={styles.val}>15.2%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Campañas de Marketing Pagadas:</Text>
              <Text style={styles.val}>7.5%</Text>
            </View>
          </View>

          {/* Anti-Fraud & Referral Qualification Simulator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛡️ Validador de Referidos & Control Anti-Fraude</Text>
            <Text style={styles.subText}>Prueba la calificación de eventos reales (ej. primera compra) vs bloqueos por mismo dispositivo.</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => handleTestQualifiedReferral(false)}>
                <Text style={styles.actionBtnText}>Probar Referido Válido</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#FF5252' }]} onPress={() => handleTestQualifiedReferral(true)}>
                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Probar Mismo Dispositivo</Text>
              </TouchableOpacity>
            </View>

            {testResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Estado: {testResult.status}</Text>
                <Text style={styles.resultSub}>{testResult.reason || `Recompensa: +${testResult.rewardCoins} Coins`}</Text>
              </View>
            )}
          </View>

          {/* Active Campaigns & Budget Cap Kill Switch */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚠️ Campaña Activa & Interruptor de Presupuesto</Text>
            <Text style={styles.subText}>
              Campaña: camp_summer_viral | Presupuesto: $5,000 USD (Gastado: $1,250 USD)
            </Text>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: campaignState ? '#FF5252' : '#00E5FF' }]}
              onPress={handleToggleCampaignKillSwitch}
            >
              <Text style={[styles.actionBtnText, { color: campaignState ? '#FFF' : '#000' }]}>
                {campaignState ? 'Pausar Campaña (Kill Switch)' : 'Reactivar Campaña'}
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
