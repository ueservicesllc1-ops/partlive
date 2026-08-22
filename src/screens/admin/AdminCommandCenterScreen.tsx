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
import { MAIN_ROUTES } from '../../app/routes';

export const AdminCommandCenterScreen = ({ navigation }: any) => {
  const [overview, setOverview] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<string>('SUPER_ADMIN');
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/admin-center/overview');
      setOverview(res.overview);
    } catch (err) {
      console.error('Error fetching admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    const nextState = !overview?.maintenance?.enabled;
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/admin-center/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          enabled: nextState,
          title: 'Mantenimiento Programado',
          message: 'La plataforma PartyLive está recibiendo actualizaciones de mantenimiento.',
          estimatedDurationMinutes: 45,
        }),
      });
      Alert.alert('Modo Mantenimiento', `Estado de Mantenimiento: ${res.maintenance.enabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
      fetchOverviewData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al cambiar mantenimiento');
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="👑 PartyLive Command Center Global"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando centro de mando y salud del sistema...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Executive Global KPIs */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Indicadores Ejecutivos Globales (Global KPIs)</Text>
            
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{overview?.kpis?.dau?.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>DAU (Usuarios Día)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{overview?.kpis?.activeLives}</Text>
                <Text style={styles.kpiLabel}>Lives Activos</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>${overview?.kpis?.revenueTodayUsd?.toFixed(2)}</Text>
                <Text style={styles.kpiLabel}>Ingresos Hoy (USD)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#FF5252' }]}>{overview?.kpis?.safetyCasesOpen}</Text>
                <Text style={styles.kpiLabel}>Casos de Seguridad</Text>
              </View>
            </View>
          </View>

          {/* System Services Health */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🟢 Salud de Servicios de Plataforma</Text>
            <View style={styles.row}>
              <Text style={styles.label}>API Gateway & Firebase:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{overview?.servicesHealth?.api}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Servidores LiveKit WebRTC:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{overview?.servicesHealth?.livekit}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Pasarelas de Pago & Ledger:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{overview?.servicesHealth?.payments}</Text>
            </View>
          </View>

          {/* Specialized Sub-Centers Navigation */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎛️ Centros de Administración Especializados</Text>
            
            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_CFO_CENTER)}>
              <Text style={styles.navBtnText}>💰 CFO Center (Inteligencia Financiera)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_EXPANSION_CENTER)}>
              <Text style={styles.navBtnText}>🌍 Global Expansion Center (Multi-País & Monedas)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_AI_CENTER)}>
              <Text style={styles.navBtnText}>🤖 AI Intelligence Center (Moderación & Asistente)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_MONETIZATION_CENTER)}>
              <Text style={styles.navBtnText}>💎 Monetization Center (VIP & Productos)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_LIVE_ENGAGEMENT)}>
              <Text style={styles.navBtnText}>🔥 Live Engagement Center (Combos & Score)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_VIRAL_GROWTH_CENTER)}>
              <Text style={styles.navBtnText}>🚀 Viral Growth Center (Deep Links & K-Factor)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_TRUST_SAFETY)}>
              <Text style={styles.navBtnText}>🛡️ Trust & Safety Center (Kill Switches & Riesgo)</Text>
            </TouchableOpacity>
          </View>

          {/* Platform Maintenance Mode Toggle */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚠️ Modo Mantenimiento Global de Plataforma</Text>
            <Text style={styles.subText}>
              Estado Actual: <Text style={{ color: overview?.maintenance?.enabled ? '#FF5252' : '#00E5FF', fontWeight: 'bold' }}>
                {overview?.maintenance?.enabled ? 'ACTIVADO' : 'OPERATIVO NORMAL'}
              </Text>
            </Text>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: overview?.maintenance?.enabled ? '#00E5FF' : '#FF5252' }]}
              onPress={handleToggleMaintenance}
            >
              <Text style={styles.actionBtnText}>
                {overview?.maintenance?.enabled ? 'Desactivar Modo Mantenimiento' : 'Activar Modo Mantenimiento'}
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
  navBtn: {
    backgroundColor: '#26203D',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 4,
  },
  navBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionBtn: {
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
});
