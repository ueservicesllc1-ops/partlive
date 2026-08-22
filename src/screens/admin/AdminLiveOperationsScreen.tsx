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

export const AdminLiveOperationsScreen = ({ navigation }: any) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [creatorHealth, setCreatorHealth] = useState<any>(null);
  const [campaignResult, setCampaignResult] = useState<any>(null);
  const [emergencyResult, setEmergencyResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOperationsData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const metricsRes = await apiFetch<any>('/live-ops-2/executive-metrics?timeframe=30D');
      const alertsRes = await apiFetch<any>('/live-ops-2/alerts');
      const healthRes = await apiFetch<any>('/live-ops-2/creator-health');

      setMetrics(metricsRes.metrics);
      setAlerts(alertsRes.alerts || []);
      setCreatorHealth(healthRes.scorecard);
    } catch (err) {
      console.error('Error fetching live operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/live-ops-2/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Campaña Recarga Inicial LATAM Q3',
          campaignType: 'COIN_PROMOTION',
          budgetUsd: 5000,
          maxParticipants: 1000,
          couponCode: 'LATAM_BONUS_2026',
        }),
      });
      setCampaignResult(res.campaign);
      Alert.alert(
        'Campaña Operativa Creada',
        `Campaña: ${res.campaign.title}\nTipo: ${res.campaign.campaignType} | Cupón: ${res.campaign.couponCode}\nPresupuesto Máximo: $${res.campaign.budgetUsd} USD | Límite Participantes: ${res.campaign.maxParticipants}`
      );
    } catch (err: any) {
      Alert.alert('Error Campaña', err.message || 'Error al crear campaña');
    }
  };

  const handleToggleEmergencyGifts = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/live-ops-2/emergency-switch', {
        method: 'POST',
        body: JSON.stringify({
          switchType: 'giftsPaused',
          enabled: true,
        }),
      });
      setEmergencyResult(res.emergencySwitches);
      Alert.alert(
        'Control de Emergencia Operativa',
        `Interruptor 'Pausa de Regalos': ACTIVADO 🛑\nActualizado Por: ${res.emergencySwitches.updatedBy}`
      );
    } catch (err: any) {
      Alert.alert('Error Control Emergencia', err.message || 'Error al cambiar interruptor');
    }
  };

  const handleGenerateExecutiveReport = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/live-ops-2/executive-report');
      Alert.alert(
        'Informe Diario Ejecutivo Generado',
        `Resumen: ${res.report.summary}\nURL Descarga PDF: ${res.report.pdfExportUrl}`
      );
    } catch (err: any) {
      Alert.alert('Error Informe', err.message || 'Error al generar informe diario');
    }
  };

  useEffect(() => {
    fetchOperationsData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="📈 Centro de Operaciones Diarias & Ingresos 2.0"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando métricas de ingresos, alertas y tablero operativo...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Executive Revenue & Activity KPIs */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Tablero Ejecutivo de Ingresos &amp; Actividad (30 Días)</Text>
            
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>${metrics?.grossRevenueUsd?.toLocaleString()} USD</Text>
                <Text style={styles.kpiLabel}>Ingresos Brutos (Gross Revenue)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>${metrics?.platformShareUsd?.toLocaleString()} USD</Text>
                <Text style={styles.kpiLabel}>Ganancia Plataforma (Platform Share)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{metrics?.dauCount?.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Usuarios Activos Diarios (DAU)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{metrics?.activeCreatorsCount?.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Creadores Activos (Monthly)</Text>
              </View>
            </View>
          </View>

          {/* Campaign Engine & Coupon Promotion Manager */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎟️ Motor de Campañas &amp; Cupones de Recarga</Text>
            <Text style={styles.subText}>Crea campañas operativas con presupuesto protegido y cupones de descuento.</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={handleCreateCampaign}>
              <Text style={styles.actionBtnText}>Crear Nueva Campaña de Recarga (LATAM Q3)</Text>
            </TouchableOpacity>

            {campaignResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Campaña ID: {campaignResult.campaignId} (Estado: {campaignResult.status})</Text>
                <Text style={styles.resultSub}>Cupón: {campaignResult.couponCode} | Presupuesto: ${campaignResult.budgetUsd} USD</Text>
              </View>
            )}
          </View>

          {/* Real-time Operations Anomaly Alert Stream */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚠️ Ráfaga de Alertas de Operaciones en Tiempo Real</Text>
            <Text style={styles.subText}>Detección de anomalías financieras, picos de tráfico y ráfagas de regalos.</Text>

            {alerts.map((item) => (
              <View key={item.alertId} style={styles.rowAlert}>
                <Text style={[styles.alertSeverity, { color: item.severity === 'CRITICAL' ? '#FF5252' : '#00E5FF' }]}>
                  [{item.type}]
                </Text>
                <Text style={styles.alertMsg}>{item.message}</Text>
              </View>
            ))}
          </View>

          {/* Creator Health Scorecard & At-Risk Reactivation */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⭐ Salud de Creadores &amp; Scorecard de Retención</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Creador Auditado:</Text>
              <Text style={styles.val}>{creatorHealth?.creatorName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Puntaje de Salud (Health Score):</Text>
              <Text style={[styles.val, { color: '#00E5FF', fontWeight: 'bold' }]}>{creatorHealth?.healthScore}/100 ({creatorHealth?.broadcastingConsistency})</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ingresos Mensuales Estimados:</Text>
              <Text style={styles.val}>${creatorHealth?.monthlyRevenueUsd} USD</Text>
            </View>
            <Text style={styles.subText}>Recomendación: {creatorHealth?.recommendedAction}</Text>
          </View>

          {/* Emergency Controls & Daily Executive Exporter */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛑 Mandos de Emergencia &amp; Generación de Informes</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#FF5252' }]} onPress={handleToggleEmergencyGifts}>
                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Pausar Regalos (Emergency)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#00E5FF' }]} onPress={handleGenerateExecutiveReport}>
                <Text style={[styles.actionBtnText, { color: '#000' }]}>Generar Reporte Ejecutivo</Text>
              </TouchableOpacity>
            </View>

            {emergencyResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Regalos Pausados: {emergencyResult.giftsPaused ? 'SÍ 🛑' : 'NO'}</Text>
                <Text style={styles.resultSub}>Actualizado por: {emergencyResult.updatedBy} a las {new Date(emergencyResult.updatedAt).toLocaleTimeString()}</Text>
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
  rowAlert: {
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    gap: 2,
  },
  alertSeverity: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  alertMsg: {
    fontSize: 11,
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
