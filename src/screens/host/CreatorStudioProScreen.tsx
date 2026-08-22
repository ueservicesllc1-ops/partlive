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

export const CreatorStudioProScreen = ({ navigation }: any) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCreatorData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const analyticsRes = await apiFetch<any>('/creator-pro/analytics?period=30d');
      const healthRes = await apiFetch<any>('/creator-pro/health/demo_live_123');
      setAnalytics(analyticsRes.analytics);
      setHealth(healthRes.health);
    } catch (err) {
      console.error('Error fetching creator pro data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/creator-pro/goals', {
        method: 'POST',
        body: JSON.stringify({ liveId: 'demo_live_123', type: 'GIFTS', targetAmount: 5000 }),
      });
      Alert.alert('Meta de Regalos Creada', `Meta: ${res.goal.targetAmount} Regalos | ID: ${res.goal.id}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al crear meta de transmisión');
    }
  };

  const handleScheduleEvent = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const startDate = new Date(Date.now() + 86400000).toISOString();
      const res = await apiFetch<any>('/creator-pro/schedule', {
        method: 'POST',
        body: JSON.stringify({ title: 'Especial de Karaoke Retro', category: 'Karaoke', startDate }),
      });
      Alert.alert('Evento Programado', `Evento: ${res.event.title} | Fecha: ${res.event.startDate}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al programar evento');
    }
  };

  useEffect(() => {
    fetchCreatorData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🌟 Creator Studio Profesional"
        showWallet={true}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando herramientas profesionales y estado de transmisión LiveKit...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Stream Health & WebRTC Status */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📡 Estado de Calidad de Transmisión (LiveKit Health)</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Calidad de Conexión:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{health?.connectionQuality}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tasa de Bits (Bitrate):</Text>
              <Text style={styles.val}>{health?.bitrateKbps} kbps</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Fotogramas por Segundo (FPS):</Text>
              <Text style={styles.val}>{health?.fps} FPS</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Latencia de Red:</Text>
              <Text style={styles.val}>{health?.latencyMs} ms</Text>
            </View>
          </View>

          {/* Advanced Audience Analytics */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Analítica de Audiencia y Retención (30 Días)</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Espectadores Únicos:</Text>
              <Text style={styles.val}>{analytics?.uniqueViewers}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Horas Totales Reproducidas:</Text>
              <Text style={styles.val}>{analytics?.totalWatchTimeHours} hrs</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Pico Máximo de Espectadores (PCCU):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{analytics?.peakConcurrentViewers}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nuevos Seguidores Ganados:</Text>
              <Text style={styles.val}>+{analytics?.newFollowers}</Text>
            </View>
          </View>

          {/* Stream Goals */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Objetivos de Transmisión (Stream Goals)</Text>
            <Text style={styles.subText}>
              Establece metas visuales de regalos o seguidores durante tu Live con animaciones de celebración.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCreateGoal}>
              <Text style={styles.actionBtnText}>Crear Meta de Regalos para el Live</Text>
            </TouchableOpacity>
          </View>

          {/* Schedule Event */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Programador de Eventos en Vivo</Text>
            <Text style={styles.subText}>
              Notifica automáticamente a tus seguidores con recordatorios antes de tu próximo show.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleScheduleEvent}>
              <Text style={styles.actionBtnText}>Programar Próximo Evento de Karaoke</Text>
            </TouchableOpacity>
          </View>

          {/* Policy Guardrail */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>🛡️ TRANSPARENCIA Y DATOS REALES</Text>
            <Text style={styles.noticeText}>
              Todas las estadísticas de Creator Studio provienen exclusivamente de interacciones reales de usuarios. Queda prohibida la fabricación de métricas o viewers simulados.
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
  actionBtn: {
    backgroundColor: colors.accent,
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
  noticeCard: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00E5FF',
    gap: 4,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  noticeText: {
    fontSize: 11,
    color: '#FFF',
  },
});
