import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import { MAIN_ROUTES } from '../../app/routes';

export const AdminSuperCenterScreen = ({ navigation }: any) => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [killPayouts, setKillPayouts] = useState(false);
  const [killPayments, setKillPayments] = useState(false);

  const fetchOverview = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/admin/super/overview');
      setOverview(res.overview);
    } catch (err) {
      console.error('Error fetching executive overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKillSwitch = async (featureKey: string, currentValue: boolean, setter: (v: boolean) => void) => {
    const newValue = !currentValue;
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch<any>('/admin/super/kill-switch', {
        method: 'POST',
        body: JSON.stringify({
          featureKey,
          enabled: newValue,
          reason: 'Emergency action from Super Admin panel',
        }),
      });
      setter(newValue);
      Alert.alert('Interruptor de Emergencia', `Interruptor ${featureKey} ${newValue ? 'ACTIVADO (Pausado)' : 'DESACTIVADO (Operativo)'}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al cambiar interruptor');
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="⚡ Super Admin Center"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando estado ejecutivo de la plataforma...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Executive Metrics Overview */}
          <View style={styles.execCard}>
            <Text style={styles.cardHeaderTitle}>📊 Resumen Ejecutivo y Salud Financiera</Text>
            <View style={styles.gridRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>DAU / MAU</Text>
                <Text style={styles.metricVal}>{overview?.dau} / {overview?.mau}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Ingresos Hoy (USD)</Text>
                <Text style={[styles.metricVal, { color: '#00E5FF' }]}>${overview?.revenueTodayUsd}</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Lives Activos</Text>
                <Text style={styles.metricVal}>{overview?.activeLives} ({overview?.concurrentViewers} viewers)</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Pasivo Pendiente (Payouts)</Text>
                <Text style={[styles.metricVal, { color: '#FF1744' }]}>${overview?.payoutLiabilityUsd}</Text>
              </View>
            </View>
          </View>

          {/* System Health */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌐 Estado de Infraestructura</Text>
            <View style={styles.healthRow}>
              <Text style={styles.healthItem}>API: 🟢 HEALTHY</Text>
              <Text style={styles.healthItem}>LiveKit: 🟢 HEALTHY</Text>
              <Text style={styles.healthItem}>Firestore: 🟢 HEALTHY</Text>
            </View>
          </View>

          {/* Emergency Kill Switches */}
          <View style={[styles.card, { borderColor: '#FF1744' }]}>
            <Text style={[styles.cardTitle, { color: '#FF1744' }]}>🚨 Interruptores de Emergencia (Kill Switches)</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Pausar Payouts (KILL_PAYOUTS)</Text>
              <Switch
                value={killPayouts}
                onValueChange={() => handleToggleKillSwitch('KILL_PAYOUTS', killPayouts, setKillPayouts)}
                trackColor={{ false: '#26203D', true: '#FF1744' }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Pausar Compras de Coins (KILL_PAYMENTS)</Text>
              <Switch
                value={killPayments}
                onValueChange={() => handleToggleKillSwitch('KILL_PAYMENTS', killPayments, setKillPayments)}
                trackColor={{ false: '#26203D', true: '#FF1744' }}
              />
            </View>
          </View>

          {/* Module Navigators */}
          <Text style={styles.sectionHeader}>🎛️ Centros de Control Operativo</Text>

          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_REGIONAL_CENTER)}>
            <Text style={styles.navBtnText}>🌍 Panel Regional y Países (Fase 22)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_MONETIZATION_CENTER)}>
            <Text style={styles.navBtnText}>💰 Panel de Monetización e Ingresos (Fase 23)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_CREATOR_CENTER)}>
            <Text style={styles.navBtnText}>🌟 Panel de Creadores y Agencias (Fase 24)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_DISCOVERY_CENTER)}>
            <Text style={styles.navBtnText}>🚀 Panel de Algoritmo y Descubrimiento (Fase 25)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_GAMIFICATION_CENTER)}>
            <Text style={styles.navBtnText}>🎮 Panel de Gamificación y Retención (Fase 26)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate(MAIN_ROUTES.ADMIN_SAFETY_CENTER)}>
            <Text style={styles.navBtnText}>🛡️ Panel de Trust & Safety y Antifraude (Fase 27)</Text>
          </TouchableOpacity>
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
  execCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#7C4DFF',
    gap: spacing.sm,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#1C1733',
    padding: spacing.sm,
    borderRadius: 10,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  healthItem: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  switchLabel: {
    fontSize: 12,
    color: '#FFF',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  navBtn: {
    backgroundColor: '#1C1733',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  navBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
