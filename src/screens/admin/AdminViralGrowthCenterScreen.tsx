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

export const AdminViralGrowthCenterScreen = ({ navigation }: any) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchViralData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/viral/metrics');
      setMetrics(res.metrics);
    } catch (err) {
      console.error('Error fetching virality metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDeepLink = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/viral/share-link', {
        method: 'POST',
        body: JSON.stringify({ type: 'LIVE', targetId: 'demo_live_123', source: 'admin_dashboard' }),
      });
      setGeneratedLink(res.link.url);
      Alert.alert('Deep Link Generado', `URL: ${res.link.url} | Tipo: ${res.link.type}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al generar deep link');
    }
  };

  const handleTestRecruitmentLink = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/viral/recruitment-link', {
        method: 'POST',
        body: JSON.stringify({ agencyId: 'agency_top_latam' }),
      });
      Alert.alert('Enlace de Reclutamiento Creado', `URL: ${res.url} | Código: ${res.trackingCode}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al generar enlace de reclutamiento');
    }
  };

  useEffect(() => {
    fetchViralData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🚀 Motor de Crecimiento Viral y Referidos"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando métricas de viralidad y factor K...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Virality & K-Factor Monitor */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Monitor de Viralidad y Factor K (K-Factor)</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Factor K (Virality Score):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{metrics?.kFactor}x</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Invitaciones por Usuario:</Text>
              <Text style={styles.val}>{metrics?.invitesPerUser}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Conversión de Referidos Calificados:</Text>
              <Text style={styles.val}>{metrics?.qualifiedConversionPercent}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>CAC Usuario / Creador:</Text>
              <Text style={styles.val}>${metrics?.userCacUsd} / ${metrics?.creatorCacUsd} USD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ratio LTV / CAC:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{metrics?.ltvToCacRatio}x</Text>
            </View>
          </View>

          {/* Deep Link Generator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔗 Generador Universal de Deep Links (7 Tipos de Contenido)</Text>
            <Text style={styles.subText}>
              Redirecciona usuarios hacia Lives, Perfiles, Eventos, Comunidades, Clips y Fan Clubs de forma diferida.
            </Text>
            {generatedLink !== '' && <Text style={styles.urlVal}>{generatedLink}</Text>}
            <TouchableOpacity style={styles.actionBtn} onPress={handleGenerateDeepLink}>
              <Text style={styles.actionBtnText}>Generar Enlace Compartible de Transmisión</Text>
            </TouchableOpacity>
          </View>

          {/* Creator & Agency Recruitment */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🤝 Reclutamiento de Creadores y Agencias</Text>
            <Text style={styles.subText}>
              Genera enlaces de atribución para reclutar nuevos Hosts con bonos de activación diferidos.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleTestRecruitmentLink}>
              <Text style={styles.actionBtnText}>Generar Enlace de Reclutamiento de Agencia</Text>
            </TouchableOpacity>
          </View>

          {/* Anti-Fraud Guardrail */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>🛡️ CONTROL ANTIFRAUDE Y AUTO-REFERENCIA</Text>
            <Text style={styles.noticeText}>
              Queda estrictamente prohibida la auto-referencia y el tráfico de granjas de dispositivos. Los referidos se califican server-side mediante eventos de conversión verificados.
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
  urlVal: {
    fontSize: 11,
    color: '#00E5FF',
    fontWeight: 'bold',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#26203D',
    marginVertical: 4,
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
