import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';

export const CreatorStudioScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CALENDAR' | 'EARNINGS'>('DASHBOARD');
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudioData = async () => {
      try {
        const { apiFetch } = await import('../../services/api/apiClient');
        const dashRes = await apiFetch<any>('/creator/dashboard');
        setDashboard(dashRes.dashboard);

        const calRes = await apiFetch<any>('/creator/calendar');
        setCalendar(calRes.calendar || []);
      } catch (err) {
        console.error('Error loading Creator Studio data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudioData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🎙️ Creator Studio"
        showWallet={true}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'DASHBOARD' && styles.tabActive]}
          onPress={() => setActiveTab('DASHBOARD')}
        >
          <Text style={[styles.tabText, activeTab === 'DASHBOARD' && styles.tabTextActive]}>📊 Panel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'CALENDAR' && styles.tabActive]}
          onPress={() => setActiveTab('CALENDAR')}
        >
          <Text style={[styles.tabText, activeTab === 'CALENDAR' && styles.tabTextActive]}>📅 Calendario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'EARNINGS' && styles.tabActive]}
          onPress={() => setActiveTab('EARNINGS')}
        >
          <Text style={[styles.tabText, activeTab === 'EARNINGS' && styles.tabTextActive]}>💎 Ganancias</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando Creator Studio...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Quick Actions Bar */}
          <Text style={styles.sectionTitle}>⚡ Acciones Rápida</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CreateRoom')}>
              <Text style={styles.actionEmoji}>🔴</Text>
              <Text style={styles.actionLabel}>Transmitir</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('SocialFeed')}>
              <Text style={styles.actionEmoji}>✍️</Text>
              <Text style={styles.actionLabel}>Post / Historia</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PkDiscovery')}>
              <Text style={styles.actionEmoji}>⚔️</Text>
              <Text style={styles.actionLabel}>Batalla PK</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Events')}>
              <Text style={styles.actionEmoji}>📅</Text>
              <Text style={styles.actionLabel}>Evento</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'DASHBOARD' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>📈 Rendimiento de Hoy</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{dashboard?.todayViews || 0}</Text>
                  <Text style={styles.statLabel}>Espectadores</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#00E5FF' }]}>+{dashboard?.todayFollowersGrowth || 0}</Text>
                  <Text style={styles.statLabel}>Seguidores</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#FFD700' }]}>💎 {dashboard?.todayDiamondsEarned || 0}</Text>
                  <Text style={styles.statLabel}>Diamantes</Text>
                </View>
              </View>

              {/* AI Insights Card */}
              <Text style={styles.sectionTitle}>🤖 Recomendaciones IA</Text>
              <View style={styles.aiCard}>
                {dashboard?.aiInsights?.map((insight: string, idx: number) => (
                  <Text key={idx} style={styles.aiText}>• {insight}</Text>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'CALENDAR' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>📅 Calendario de Contenido Programado</Text>
              {calendar.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>📅</Text>
                  <Text style={styles.emptyTitle}>No tienes eventos o publicaciones programadas</Text>
                </View>
              ) : (
                calendar.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <Text style={styles.itemBadge}>{item.type}</Text>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'EARNINGS' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>💎 Centro de Ganancias de Creador</Text>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsLabel}>Ingreso Mensual Estimado</Text>
                <Text style={styles.earningsVal}>${dashboard?.estimatedMonthlyUsd || '0.00'} USD</Text>
                <Text style={styles.earningsSub}>
                  Basado en Diamantes acumulados y suscripciones activas ({dashboard?.activeSubscribers || 0} suscriptores).
                </Text>

                <TouchableOpacity
                  style={styles.payoutBtn}
                  onPress={() => navigation.navigate('HostEarnings')}
                >
                  <Text style={styles.payoutBtnText}>Solicitar Retiro de Diamantes</Text>
                </TouchableOpacity>
              </View>
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
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#141124',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#26203D',
  },
  actionEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tabContent: {
    gap: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  aiCard: {
    backgroundColor: '#1E1B30',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 6,
  },
  aiText: {
    fontSize: 12,
    color: '#FFF',
    lineHeight: 16,
  },
  emptyBox: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#141124',
    borderRadius: 14,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  itemCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemBadge: {
    backgroundColor: colors.accent,
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemTitle: {
    fontSize: 12,
    color: '#FFF',
  },
  earningsCard: {
    backgroundColor: '#1E1B30',
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  earningsVal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginVertical: 6,
  },
  earningsSub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 14,
  },
  payoutBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  payoutBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
