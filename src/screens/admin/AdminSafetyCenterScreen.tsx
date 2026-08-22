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

export const AdminSafetyCenterScreen = ({ navigation }: any) => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSafetyCases = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/safety/queue');
      setCases(res.cases || []);
    } catch (err) {
      console.error('Error fetching safety cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyCases();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🛡️ Centro de Trust & Safety"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando cola de moderación...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Risk Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>🚨 Cola de Moderación y Antifraude</Text>
            <Text style={styles.summarySub}>
              Casos ordenados por severidad (CRITICAL prioritarios).
            </Text>
            <Text style={styles.summaryCount}>{cases.length} Casos Pendientes</Text>
          </View>

          {cases.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No hay casos de seguridad pendientes</Text>
            </View>
          ) : (
            cases.map((c) => (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.categoryTitle}>{c.category}</Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          c.severity === 'CRITICAL'
                            ? 'rgba(255,23,68,0.2)'
                            : c.severity === 'HIGH'
                            ? 'rgba(255,145,0,0.2)'
                            : 'rgba(0,229,255,0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            c.severity === 'CRITICAL'
                              ? '#FF1744'
                              : c.severity === 'HIGH'
                              ? '#FF9100'
                              : '#00E5FF',
                        },
                      ]}
                    >
                      {c.severity}
                    </Text>
                  </View>
                </View>

                <Text style={styles.descText}>{c.description}</Text>
                <Text style={styles.metaText}>
                  Reportes acumulados: {c.reportCount} • Equipo asignado: {c.assignedTeam}
                </Text>
              </View>
            ))
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
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF1744',
    gap: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  summarySub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  summaryCount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF1744',
    marginTop: 4,
  },
  emptyBox: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#141124',
    borderRadius: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  card: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  descText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metaText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});
