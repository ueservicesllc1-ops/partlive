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

export const AdminCreatorCenterScreen = ({ navigation }: any) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/creators/applications');
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Error fetching host applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleReview = async (appId: string, approve: boolean) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch(`/creators/applications/${appId}/review`, {
        method: 'POST',
        body: JSON.stringify({ approve }),
      });
      Alert.alert('Revisado', `Solicitud ${approve ? 'Aprobada' : 'Rechazada'}.`);
      fetchApplications();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo revisar la solicitud.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🌟 Centro de Creadores y Agencias"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando creadores y solicitudes...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Level Distribution Summary */}
          <View style={styles.levelCard}>
            <Text style={styles.levelTitle}>🏆 Niveles de Creador Activos</Text>
            <View style={styles.levelRow}>
              <Text style={styles.levelItem}>Rookie: 120</Text>
              <Text style={styles.levelItem}>Rising: 45</Text>
              <Text style={styles.levelItem}>Pro: 18</Text>
              <Text style={styles.levelItem}>Star: 4</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>📝 Solicitudes de Anfitrión Pendientes ({applications.length})</Text>

          {applications.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No hay solicitudes de anfitrión pendientes</Text>
            </View>
          ) : (
            applications.map((app) => (
              <View key={app.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.applicantName}>{app.displayName}</Text>
                  <Text style={styles.categoryBadge}>{app.category}</Text>
                </View>

                <Text style={styles.bioText}>{app.bio || 'Sin biografía proporcionada.'}</Text>
                <Text style={styles.countryMeta}>País: {app.country}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReview(app.id, false)}>
                    <Text style={styles.rejectText}>Rechazar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleReview(app.id, true)}>
                    <Text style={styles.approveText}>Aprobar Anfitrión</Text>
                  </TouchableOpacity>
                </View>
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
  levelCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 8,
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelItem: {
    fontSize: 12,
    color: '#00E5FF',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
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
  applicantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  categoryBadge: {
    backgroundColor: 'rgba(0,229,255,0.15)',
    color: '#00E5FF',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: 'bold',
  },
  bioText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  countryMeta: {
    fontSize: 10,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  rejectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,23,68,0.2)',
  },
  rejectText: {
    color: '#FF1744',
    fontSize: 12,
    fontWeight: 'bold',
  },
  approveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  approveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
