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

export const MusicAdminCenterScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'CLAIMS' | 'APPEALS'>('CATALOG');
  const [tracks, setTracks] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMusicAdminData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const catRes = await apiFetch<any>('/music/catalog');
      setTracks(catRes.tracks || []);
    } catch (err) {
      console.error('Error loading Music Admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusicAdminData();
  }, []);

  const handleTakedownAction = async (claimId: string, action: string) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch('/copyright/takedown', {
        method: 'POST',
        body: JSON.stringify({ claimId, action }),
      });
      Alert.alert('Éxito', `Acción ${action} ejecutada.`);
      fetchMusicAdminData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo procesar la acción.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🎵 Centro de Derechos de Música"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'CATALOG' && styles.tabActive]}
          onPress={() => setActiveTab('CATALOG')}
        >
          <Text style={[styles.tabText, activeTab === 'CATALOG' && styles.tabTextActive]}>🎶 Catálogo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'CLAIMS' && styles.tabActive]}
          onPress={() => setActiveTab('CLAIMS')}
        >
          <Text style={[styles.tabText, activeTab === 'CLAIMS' && styles.tabTextActive]}>⚠️ Reclamaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'APPEALS' && styles.tabActive]}
          onPress={() => setActiveTab('APPEALS')}
        >
          <Text style={[styles.tabText, activeTab === 'APPEALS' && styles.tabTextActive]}>⚖️ Apelaciones</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando catálogo y licencias...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'CATALOG' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎼 Pistas Licenciadas en el Catálogo</Text>
              {tracks.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No hay pistas registradas</Text>
                </View>
              ) : (
                tracks.map((t) => (
                  <View key={t.trackId} style={styles.trackCard}>
                    <View style={styles.trackHeader}>
                      <Text style={styles.trackTitle}>{t.title}</Text>
                      <Text style={styles.rightsBadge}>{t.rightsStatus}</Text>
                    </View>
                    <Text style={styles.trackArtist}>{t.artist} • {t.genre}</Text>
                    <Text style={styles.territoriesText}>
                      Territorios: {t.allowedCountries?.join(', ') || 'ALL'}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'CLAIMS' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Reclamaciones de Derechos de Autor</Text>
              {claims.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No hay reclamaciones abiertas</Text>
                </View>
              ) : (
                claims.map((c) => (
                  <View key={c.id} style={styles.claimCard}>
                    <Text style={styles.claimTitle}>Reclamación #{c.id.slice(-6)} ({c.contentType})</Text>
                    <Text style={styles.claimReason}>Motivo: {c.reason}</Text>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actBtn, { backgroundColor: '#FFD700' }]}
                        onPress={() => handleTakedownAction(c.id, 'MUTE')}
                      >
                        <Text style={styles.actBtnText}>Silenciar Audio</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actBtn, { backgroundColor: colors.accent }]}
                        onPress={() => handleTakedownAction(c.id, 'TAKEDOWN')}
                      >
                        <Text style={styles.actBtnText}>Takedown</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
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
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emptyBox: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#141124',
    borderRadius: 14,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  trackCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 4,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  rightsBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trackArtist: {
    fontSize: 12,
    color: colors.textMuted,
  },
  territoriesText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  claimCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 8,
  },
  claimTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  claimReason: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actBtnText: {
    color: '#141124',
    fontWeight: 'bold',
    fontSize: 11,
  },
});
