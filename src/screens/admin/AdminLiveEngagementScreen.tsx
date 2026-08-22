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

export const AdminLiveEngagementScreen = ({ navigation }: any) => {
  const [score, setScore] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEngagementData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const scoreRes = await apiFetch<any>('/engagement/score/demo_live_123');
      const timelineRes = await apiFetch<any>('/engagement/timeline/demo_live_123');
      setScore(scoreRes.score);
      setTimeline(timelineRes.timeline);
    } catch (err) {
      console.error('Error fetching engagement score:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTapBatch = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/engagement/taps/batch', {
        method: 'POST',
        body: JSON.stringify({ liveId: 'demo_live_123', tapCount: 25 }),
      });
      Alert.alert(
        'Taps 👍 Procesados',
        `Taps Aceptados: ${res.acceptedTaps} | Multiplicador Combo: ${res.comboMultiplier} | ${res.milestoneTriggered || 'Continúa interactuando'}`
      );
      fetchEngagementData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al procesar taps');
    }
  };

  const handleCreatePoll = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/engagement/polls', {
        method: 'POST',
        body: JSON.stringify({
          liveId: 'demo_live_123',
          question: '¿Qué canción quieres en el próximo bloque de Karaoke?',
          options: ['Canción A (Pop Retro)', 'Canción B (Rock 80s)', 'Canción C (Balada)'],
        }),
      });
      Alert.alert('Encuesta Creada', `Pregunta: "${res.poll.question}" | ID: ${res.poll.id}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al crear encuesta');
    }
  };

  useEffect(() => {
    fetchEngagementData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🔥 Motor de Interacción y Live Energy"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando puntaje de energía e interacciones en vivo...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Live Energy Score */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚡ Puntaje de Energía en Vivo (Live Energy Score)</Text>
            <Text style={styles.subText}>Fórmula = Taps 👍 × 1 + Comentarios × 5 + Regalos × 50</Text>

            <View style={styles.scoreRow}>
              <Text style={styles.scoreVal}>{score?.liveEnergyScore || 0}</Text>
              <Text style={styles.scoreLabel}>Puntos de Energía</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Taps 👍 Totales:</Text>
              <Text style={styles.val}>{score?.tapsCount}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Comentarios Registrados:</Text>
              <Text style={styles.val}>{score?.commentsCount}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Regalos Enviados:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{score?.giftsCount}</Text>
            </View>
          </View>

          {/* Interactive Tools */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👍 Taps, Combos y Encuestas en Tiempo Real</Text>
            <Text style={styles.subText}>
              Prueba el envío por lotes con combos visuales (x5, x10, x25, x50) sin convertir taps en dinero.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleTestTapBatch}>
              <Text style={styles.actionBtnText}>Probar Lote de 25 Taps 👍 (Combo x50)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#26203D', marginTop: 8 }]} onPress={handleCreatePoll}>
              <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Crear Encuesta de Karaoke en Vivo</Text>
            </TouchableOpacity>
          </View>

          {/* Live Moment Timeline */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⏱️ Cronología de Hitos en Vivo (Moment Timeline)</Text>
            {timeline.map((item, idx) => (
              <View key={idx} style={styles.timelineRow}>
                <Text style={styles.timeTag}>+{item.timeOffsetSeconds}s</Text>
                <Text style={styles.timeDesc}>{item.description}</Text>
              </View>
            ))}
          </View>

          {/* Policy Guardrail */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>🛡️ REGLA INMUTABLE: TAPS SON INTERACCIÓN SOCIAL</Text>
            <Text style={styles.noticeText}>
              Los Taps 👍 sirven para animar y elevar el Live Energy del show. NO se convierten automáticamente en Coins, Diamonds ni USD bajo ninguna circunstancia.
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
  scoreRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  scoreVal: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  scoreLabel: {
    fontSize: 12,
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
  divider: {
    height: 1,
    backgroundColor: '#26203D',
    marginVertical: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  timeTag: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeDesc: {
    fontSize: 11,
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
