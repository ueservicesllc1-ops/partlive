import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';

export const AdminDiscoveryCenterScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<any>({ totalShares: 0, totalClicks: 0, kFactor: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDiscoveryStats = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/viral/analytics');
      setStats(res.stats || { totalShares: 0, totalClicks: 0, kFactor: 0 });
    } catch (err) {
      console.error('Error fetching discovery stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryStats();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🚀 Algoritmo y Crecimiento Viral"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando métricas de descubrimiento y viralidad...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Viral Growth K-Factor */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Coeficiente de Crecimiento Viral (K-Factor)</Text>
            <Text style={styles.cardValue}>{stats.kFactor} K-Factor</Text>
            <Text style={styles.cardSub}>
              Shares Totales: {stats.totalShares} • Clics de Enlace: {stats.totalClicks}
            </Text>
          </View>

          {/* Organic vs Sponsored */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚖️ Distribución Orgánica vs Patrocinada</Text>
            <View style={styles.row}>
              <Text style={styles.metricItem}>Impresiones Orgánicas: 84.5%</Text>
              <Text style={styles.metricItem}>Promocionados: 15.5%</Text>
            </View>
          </View>

          {/* Creator Exposure Equity */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛡️ Protección de Nuevos Anfitriones (Rising)</Text>
            <Text style={styles.cardSub}>
              20% del espacio en "For You" está reservado para creadores Rookie y Rising para garantizar diversidad y talento nuevo.
            </Text>
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
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricItem: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
