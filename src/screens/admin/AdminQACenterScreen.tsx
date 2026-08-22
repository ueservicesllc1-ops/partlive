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

export const AdminQACenterScreen = ({ navigation }: any) => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [gate, setGate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchQADashboard = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const invRes = await apiFetch<any>('/qa/inventory');
      const gateRes = await apiFetch<any>('/qa/gate');
      setInventory(invRes.inventory || []);
      setGate(gateRes.decision);
    } catch (err) {
      console.error('Error fetching QA dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/qa/audit/run', { method: 'POST' });
      Alert.alert('Auditoría QA Completa', `Pruebas Ejecutadas: ${res.report.totalTestsRun} | Exitosas: ${res.report.passedCount} | Fallidas: ${res.report.failedCount}`);
      fetchQADashboard();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al ejecutar auditoría');
    }
  };

  useEffect(() => {
    fetchQADashboard();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🧪 Centro de Auditoría QA y Gate de Producción"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando inventario maestro de QA...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Official Production Gate Card */}
          <View
            style={[
              styles.gateCard,
              { borderColor: gate?.decision === 'GO' ? '#00E5FF' : '#FF1744' },
            ]}
          >
            <Text style={styles.gateTitle}>🚦 Decisión del Gate de Producción</Text>
            <Text
              style={[
                styles.gateVal,
                { color: gate?.decision === 'GO' ? '#00E5FF' : '#FF1744' },
              ]}
            >
              ESTADO FINAL: {gate?.decision} 🚀
            </Text>
            <Text style={styles.gateSummary}>{gate?.summary}</Text>
            <Text style={styles.gateMeta}>
              Puntuación: {gate?.scorePercent}% • Bloqueadores Críticos (P0/P1): {gate?.criticalBlockersCount}
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.auditBtn} onPress={handleRunAudit}>
            <Text style={styles.auditBtnText}>Ejecutar Auditoría Completa de Plataforma (142 Tests)</Text>
          </TouchableOpacity>

          {/* Master Inventory by Phase */}
          <Text style={styles.sectionTitle}>📋 Inventario Maestro de Fases (1 al 31)</Text>
          {inventory.map((item) => (
            <View key={item.phaseId} style={styles.moduleCard}>
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleName}>Fase {item.phaseId}: {item.moduleName}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.moduleMeta}>
                Categoría: {item.category} • Tasa de Aprobación: {item.passRate}%
              </Text>
            </View>
          ))}
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
  gateCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    gap: 6,
  },
  gateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  gateVal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  gateSummary: {
    fontSize: 11,
    color: '#FFF',
    lineHeight: 16,
  },
  gateMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  auditBtn: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  auditBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  moduleCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 4,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  badge: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  moduleMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
