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

export const AdminComplianceCenterScreen = ({ navigation }: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplianceRequests = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/legal/privacy-requests');
      setRequests(res.requests || []);
    } catch (err) {
      console.error('Error fetching compliance requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceRequests();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="⚖️ Legal, Privacidad y Compliance"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando estado de cumplimiento y solicitudes de privacidad...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Legal Review Warning */}
          <View style={styles.legalNoticeCard}>
            <Text style={styles.noticeTitle}>⚖️ REVISIÓN LEGAL REQUERIDA (LEGAL_REVIEW_REQUIRED)</Text>
            <Text style={styles.noticeText}>
              Todas las decisiones de licencias, acuerdos de creadores/agencias y términos finales deben ser validadas por asesores legales autorizados antes del lanzamiento comercial.
            </Text>
          </View>

          {/* Privacy Requests */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📥 Solicitudes de Privacidad (GDPR / CCPA / ARCO)</Text>
            <Text style={styles.cardSub}>
              Descargas de datos y eliminaciones de cuenta con retención financiera estricta.
            </Text>
            <Text style={styles.cardVal}>{requests.length} Solicitudes Recibidas</Text>
          </View>

          {/* Store Readiness Checklist */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📱 Lista de Verificación para Tiendas de Apps</Text>
            <Text style={styles.checkItem}>✅ Eliminación de Cuenta en App (Exigido por Apple/Google)</Text>
            <Text style={styles.checkItem}>✅ Validación Server-side de In-App Purchases & Suscripciones</Text>
            <Text style={styles.checkItem}>✅ Herramientas UGC de Moderación y Bloqueo de Usuarios</Text>
            <Text style={styles.checkItem}>✅ Enlaces Directos a Políticas de Privacidad y Soporte</Text>
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
  legalNoticeCard: {
    backgroundColor: 'rgba(255, 145, 0, 0.15)',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF9100',
    gap: 4,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9100',
  },
  noticeText: {
    fontSize: 11,
    color: '#FFF',
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
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  cardVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginTop: 4,
  },
  checkItem: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 2,
  },
});
