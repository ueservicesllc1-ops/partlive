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
  const [dashboard, setDashboard] = useState<any>(null);
  const [audience, setAudience] = useState<any>(null);
  const [coach, setCoach] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);
  const [mediaKit, setMediaKit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCreatorData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const dashRes = await apiFetch<any>('/creator-studio/dashboard');
      const audRes = await apiFetch<any>('/creator-studio/audience');
      const coachRes = await apiFetch<any>('/creator-studio/coach');

      setDashboard(dashRes.dashboard);
      setAudience(audRes.audience);
      setCoach(coachRes.coach);
    } catch (err) {
      console.error('Error fetching creator studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPreLiveChecklist = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/creator-studio/pre-live', {
        method: 'POST',
        body: JSON.stringify({ category: 'Karaoke & Música' }),
      });
      setChecklist(res.checklist);
    } catch (err: any) {
      Alert.alert('Error Pre-Live', err.message || 'Error al generar checklist');
    }
  };

  const handleGenerateMediaKit = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/creator-studio/media-kit');
      setMediaKit(res.mediaKit);
      Alert.alert(
        'Media Kit Generado',
        `Media Kit Público: ${res.mediaKit.publicProfileUrl}\nLink Profundo: ${res.mediaKit.deepLinkUrl}`
      );
    } catch (err: any) {
      Alert.alert('Error Media Kit', err.message || 'Error generando Media Kit');
    }
  };

  useEffect(() => {
    fetchCreatorData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🌟 Creator Studio Pro & Success"
        showWallet={true}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando Creator Studio Pro y sugerencias de IA...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Today's Performance & Earnings */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💎 Rendimiento e Ingresos del Creador (Hoy)</Text>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{dashboard?.todayLiveHours}h</Text>
                <Text style={styles.kpiLabel}>Horas Transmitidas</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{dashboard?.todayViewers}</Text>
                <Text style={styles.kpiLabel}>Espectadores Hoy</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{dashboard?.diamondsAvailable?.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Diamonds Disponibles</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>${dashboard?.usdEquivalentAvailable?.toFixed(2)} USD</Text>
                <Text style={styles.kpiLabel}>Equivalente USD</Text>
              </View>
            </View>

            <Text style={styles.subText}>Nivel de Creador: {dashboard?.level} | Racha: 🔥 {dashboard?.currentStreakDays} Días</Text>
          </View>

          {/* AI Creator Coach */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🤖 AI Creator Coach (Asistente de Éxito)</Text>
            <Text style={styles.coachInsight}>{coach?.topInsight}</Text>

            <Text style={[styles.subTitle, { marginTop: 8 }]}>Plan de Acción Recomendado:</Text>
            {coach?.actionablePlan?.map((plan: any) => (
              <View key={plan.step} style={styles.planRow}>
                <Text style={styles.planStep}>{plan.step}.</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planAction}>{plan.action}</Text>
                  <Text style={styles.planImpact}>Impacto: {plan.expectedImpact}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pre-Live Checklist & AI Title Assistant */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎥 Asistente de Transmisión & Pre-Live Checklist</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={handleRunPreLiveChecklist}>
              <Text style={styles.actionBtnText}>Generar Pre-Live Checklist & Títulos con IA</Text>
            </TouchableOpacity>

            {checklist && (
              <View style={styles.checklistResult}>
                <Text style={styles.subTitle}>Sugerencias de Títulos Generadas por IA:</Text>
                {checklist.aiTitleSuggestions.map((t: string, idx: number) => (
                  <Text key={idx} style={styles.titleSuggestion}>• {t}</Text>
                ))}
              </View>
            )}
          </View>

          {/* Audience Intelligence & Top Supporters */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👥 Audiencia & Supporters Principales CRM</Text>
            <Text style={styles.subText}>Espectadores Recurrentes: {audience?.returningViewersPercent}% | Conversión a Regalos: {audience?.giftConversionPercent}%</Text>

            <Text style={[styles.subTitle, { marginTop: 8 }]}>Top Supporters (Principales Donadores):</Text>
            {audience?.topSupporters?.map((sup: any) => (
              <View key={sup.userId} style={styles.supRow}>
                <Text style={styles.supName}>👑 {sup.username}</Text>
                <Text style={styles.supVal}>{sup.diamondsContributed} Diamonds ({sup.giftsSent} Regalos)</Text>
              </View>
            ))}
          </View>

          {/* Creator Media Kit & QR Code */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📇 Media Kit Público & Código QR de Creador</Text>
            <Text style={styles.subText}>Comparte tu perfil profesional con agencias, patrocinadores y seguidores.</Text>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#26203D', marginTop: 4 }]} onPress={handleGenerateMediaKit}>
              <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Exportar Media Kit & Código QR</Text>
            </TouchableOpacity>

            {mediaKit && (
              <View style={styles.mediaKitBox}>
                <Text style={styles.mediaKitTitle}>Media Kit de {mediaKit.username}</Text>
                <Text style={styles.mediaKitText}>Seguidores: {mediaKit.totalFollowers?.toLocaleString()} | Horas: {mediaKit.totalLiveHours}h</Text>
                <Text style={styles.mediaKitText}>Categoría Principal: {mediaKit.primaryCategory}</Text>
                <Text style={styles.mediaKitUrl}>Link Público: {mediaKit.publicProfileUrl}</Text>
              </View>
            )}
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
  subTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  subText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  kpiBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  coachInsight: {
    fontSize: 12,
    color: '#00E5FF',
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
  },
  planRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  planStep: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accent,
  },
  planAction: {
    fontSize: 12,
    color: '#FFF',
  },
  planImpact: {
    fontSize: 10,
    color: '#00E5FF',
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
  checklistResult: {
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
  },
  titleSuggestion: {
    fontSize: 11,
    color: '#FFF',
  },
  supRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 2,
  },
  supName: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
  },
  supVal: {
    fontSize: 11,
    color: colors.accent,
  },
  mediaKitBox: {
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  mediaKitTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mediaKitText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  mediaKitUrl: {
    fontSize: 10,
    color: '#00E5FF',
  },
});
