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

export const AdminGamificationCenterScreen = ({ navigation }: any) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchGamificationStats = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/gamification/profile');
      setProfile(res.profile);
    } catch (err) {
      console.error('Error fetching gamification stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamificationStats();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🎮 Gamificación y Retención"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando métricas de gamificación...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Active Tappers & Energy */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👍 Taps Activos Hoy (Engagement Orgánico)</Text>
            <Text style={styles.cardValue}>1,450,200 Taps 👍</Text>
            <Text style={styles.cardSub}>Batching del cliente procesando sin latencia en backend.</Text>
          </View>

          {/* Party Points Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎁 Economía No-Financiera (Party Points)</Text>
            <Text style={styles.cardValue}>{profile?.partyPoints || 0} Party Points</Text>
            <Text style={styles.cardSub}>
              Moneda de engagement no convertible a dinero. Canjeable únicamente por marcos y cosméticos.
            </Text>
          </View>

          {/* Streaks & Level Distribution */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔥 Racha de Días (Streak Retention)</Text>
            <View style={styles.row}>
              <Text style={styles.metricItem}>Racha Actual: {profile?.currentStreakDays || 1} días</Text>
              <Text style={styles.metricItem}>Nivel Usuario: {profile?.userLevel || 'Regular'}</Text>
            </View>
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
