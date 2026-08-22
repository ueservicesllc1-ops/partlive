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

export const AdminSubscriptionCenterScreen = ({ navigation }: any) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [accessResult, setAccessResult] = useState<any>(null);
  const [killSwitchEnabled, setKillSwitchEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/subscriptions/analytics');
      setAnalytics(res.analytics);
    } catch (err) {
      console.error('Error fetching subscription analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestContentGate = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/subscriptions/access-check', {
        method: 'POST',
        body: JSON.stringify({ creatorId: 'host_superstar', contentId: 'exclusive_live_stream_99' }),
      });
      setAccessResult(res);
      Alert.alert(
        'Acceso al Contenido Exclusivo',
        res.hasAccess
          ? `Acceso PERMITIDO (Estado Entitlement: ${res.entitlementStatus})`
          : `Acceso DENEGADO (${res.reason})`
      );
    } catch (err: any) {
      Alert.alert('Error Content Gate', err.message || 'Error en prueba de acceso');
    }
  };

  const handleToggleKillSwitch = async () => {
    const nextState = !killSwitchEnabled;
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/subscriptions/kill-switch', {
        method: 'POST',
        body: JSON.stringify({ enabled: nextState, reason: 'Prueba de control de emergencia' }),
      });
      setKillSwitchEnabled(res.killSwitch.enabled);
      Alert.alert(
        'Kill Switch de Suscripciones',
        `Compras de Suscripciones: ${res.killSwitch.enabled ? 'ACTIVADAS' : 'PAUSADAS DE EMERGENCIA'}`
      );
    } catch (err: any) {
      Alert.alert('Error Kill Switch', err.message || 'Error al cambiar interruptor');
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="💳 Centro de Suscripciones & MRR"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando MRR, ARR y estado de entitlements...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Executive MRR & ARR Metrics */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Ingresos Recurrentes Mensuales (MRR / ARR)</Text>
            
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>${analytics?.mrrUsd?.toLocaleString()} USD</Text>
                <Text style={styles.kpiLabel}>MRR (Mensual Recurrente)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>${analytics?.arrUsd?.toLocaleString()} USD</Text>
                <Text style={styles.kpiLabel}>ARR (Anualizado)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>${analytics?.arpsUsd?.toFixed(2)} USD</Text>
                <Text style={styles.kpiLabel}>ARPS (Por Suscriptor)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#FF5252' }]}>{analytics?.subscriberChurnRatePercent}%</Text>
                <Text style={styles.kpiLabel}>Tasa de Churn (Cancelación)</Text>
              </View>
            </View>
          </View>

          {/* Active Memberships Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👥 Desglose de Membresías Activas</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Suscriptores de Creadores (Tiers 1-3):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{analytics?.activeSubscribersCount?.toLocaleString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Miembros Fan Clubs Creador:</Text>
              <Text style={styles.val}>{analytics?.activeFanClubMembersCount?.toLocaleString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Miembros Platform VIP Global:</Text>
              <Text style={styles.val}>{analytics?.activeVipMembersCount?.toLocaleString()}</Text>
            </View>
          </View>

          {/* Content Access Gate Simulator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔒 Simulador de Control de Acceso a Contenido Exclusivo</Text>
            <Text style={styles.subText}>Verifica server-side los permisos para acceder a Lives y Contenidos Exclusivos.</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={handleTestContentGate}>
              <Text style={styles.actionBtnText}>Probar Permiso de Acceso para Suscriptor</Text>
            </TouchableOpacity>

            {accessResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>
                  Resultado: {accessResult.hasAccess ? 'PERMITIDO ✅' : 'DENEGADO ❌'}
                </Text>
                <Text style={styles.resultSub}>{accessResult.reason || `Entitlement Status: ${accessResult.entitlementStatus}`}</Text>
              </View>
            )}
          </View>

          {/* Emergency Subscription Kill Switch */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚠️ Interruptor de Emergencia para Suscripciones</Text>
            <Text style={styles.subText}>
              Pausa compras de nuevas suscripciones manteniendo intactos los permisos existentes.
            </Text>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: killSwitchEnabled ? '#FF5252' : '#00E5FF' }]}
              onPress={handleToggleKillSwitch}
            >
              <Text style={[styles.actionBtnText, { color: killSwitchEnabled ? '#FFF' : '#000' }]}>
                {killSwitchEnabled ? 'Pausar Compras de Suscripciones (Kill Switch)' : 'Reactivar Compras de Suscripciones'}
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
