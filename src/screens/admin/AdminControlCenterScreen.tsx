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

export const AdminControlCenterScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'BI' | 'PAYOUTS' | 'FRAUD' | 'FEATURES'>('BI');
  const [metrics, setMetrics] = useState<any | null>(null);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { apiFetch } = await import('../../services/api/apiClient');
        const metricsRes = await apiFetch<any>('/admin-control/overview');
        setMetrics(metricsRes.metrics);

        const flagsRes = await apiFetch<any>('/security/features');
        setFlags(flagsRes.flags || {});
      } catch (err) {
        console.error('Error loading admin control metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleToggleFlag = (featureName: string, currentVal: boolean) => {
    Alert.alert(
      'Confirmar Cambio',
      `¿Deseas ${currentVal ? 'desactivar (Killswitch)' : 'activar'} la función ${featureName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setFlags((prev) => ({ ...prev, [featureName]: !currentVal }));
            Alert.alert('Actualizado', `Función ${featureName} actualizada.`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="⚙️ Admin Control Center"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {/* Admin Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'BI' && styles.tabActive]}
          onPress={() => setActiveTab('BI')}
        >
          <Text style={[styles.tabText, activeTab === 'BI' && styles.tabTextActive]}>📊 BI</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PAYOUTS' && styles.tabActive]}
          onPress={() => setActiveTab('PAYOUTS')}
        >
          <Text style={[styles.tabText, activeTab === 'PAYOUTS' && styles.tabTextActive]}>💳 Pagos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'FRAUD' && styles.tabActive]}
          onPress={() => setActiveTab('FRAUD')}
        >
          <Text style={[styles.tabText, activeTab === 'FRAUD' && styles.tabTextActive]}>🛡️ Fraude</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'FEATURES' && styles.tabActive]}
          onPress={() => setActiveTab('FEATURES')}
        >
          <Text style={[styles.tabText, activeTab === 'FEATURES' && styles.tabTextActive]}>🎛️ Flags</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando centro de operaciones...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'BI' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>💰 Métricas Financieras (Real-Time)</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#00E5FF' }]}>${metrics?.grossRevenue || 0}</Text>
                  <Text style={styles.statLabel}>Ingreso Bruto</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#FFD700' }]}>${metrics?.netRevenue || 0}</Text>
                  <Text style={styles.statLabel}>Ingreso Neto Plataforma</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>👥 Usuarios & Creadores</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{metrics?.totalUsers || 0}</Text>
                  <Text style={styles.statLabel}>Usuarios Totales</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{metrics?.totalHosts || 0}</Text>
                  <Text style={styles.statLabel}>Hosts Verificados</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'PAYOUTS' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>💳 Control de Retiros & Aprobación Maker/Checker</Text>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Solicitud de Retiro #PO-8821</Text>
                <Text style={styles.cardSub}>Host: AnaMusic • Monto: $250.00 USD (Requiere 2º Aprobación)</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.statusBadge}>Pendiente 2º Administrador</Text>
                </View>

                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => Alert.alert('Aprobado', 'Solicitud aprobada por el segundo administrador.')}
                >
                  <Text style={styles.approveBtnText}>✅ Aprobar Operación (Maker/Checker)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'FRAUD' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>🛡️ Centro de Prevención de Fraude</Text>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Caso #FR-104: Posible Bucle de Regalos</Text>
                <Text style={styles.cardSub}>Usuarios implicados: @user_a → @user_b</Text>
                <Text style={styles.riskBadge}>Riesgo: MEDIO (Score 45)</Text>
              </View>
            </View>
          )}

          {activeTab === 'FEATURES' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>🎛️ Interruptores de Emergencia (Killswitches)</Text>
              {Object.entries(flags).map(([flagKey, isEnabled]) => (
                <TouchableOpacity
                  key={flagKey}
                  style={styles.flagRow}
                  onPress={() => handleToggleFlag(flagKey, isEnabled)}
                >
                  <Text style={styles.flagName}>{flagKey}</Text>
                  <Text style={[styles.flagState, { color: isEnabled ? '#00E5FF' : '#FF5252' }]}>
                    {isEnabled ? '● ACTIVO' : '○ APAGADO'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#141124',
    padding: 6,
    borderBottomWidth: 1,
    borderColor: '#26203D',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#FFF',
  },
  scrollContent: {
    padding: spacing.md,
  },
  tabContent: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  statVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  badgeRow: {
    marginVertical: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  riskBadge: {
    color: '#FF5252',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  approveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  approveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  flagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  flagName: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: 'bold',
  },
  flagState: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
