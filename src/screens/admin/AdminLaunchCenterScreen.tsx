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

export const AdminLaunchCenterScreen = ({ navigation }: any) => {
  const [readiness, setReadiness] = useState<any>(null);
  const [canaryPercent, setCanaryPercent] = useState<number>(100);
  const [loading, setLoading] = useState(true);

  const fetchLaunchData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/beta/readiness');
      setReadiness(res.report);
    } catch (err) {
      console.error('Error fetching launch readiness:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInviteCode = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const code = 'BETA_' + Math.floor(1000 + Math.random() * 9000);
      const res = await apiFetch<any>('/beta/invites', {
        method: 'POST',
        body: JSON.stringify({ code, maxUses: 25, campaignId: 'closed_beta' }),
      });
      Alert.alert('Código Beta Creado', `Código: ${res.invite.code} | Usos Máximos: ${res.invite.maxUses}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al crear código beta');
    }
  };

  const handleUpdateCanary = async (percent: number) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/beta/canary', {
        method: 'POST',
        body: JSON.stringify({ percentage: percent }),
      });
      setCanaryPercent(res.state.percentage);
      Alert.alert('Despliegue Canary Actualizado', `Porcentaje Actual de Despliegue: ${res.state.percentage}%`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al actualizar despliegue canary');
    }
  };

  useEffect(() => {
    fetchLaunchData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🚀 Centro de Lanzamiento Comercial"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando puntuaciones de lanzamiento y despliegue...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Launch Score Card */}
          <View style={styles.scoreCard}>
            <Text style={styles.cardTitle}>🌟 Puntuación Global de Preparación para Lanzamiento</Text>
            <Text style={styles.scoreVal}>{readiness?.overallScore} / 100 🏆</Text>
            <Text style={styles.subText}>
              Seguridad: {readiness?.securityScore}% • Rendimiento: {readiness?.performanceScore}% • Finanzas: {readiness?.financialScore}%
            </Text>
          </View>

          {/* Canary Rollout Controls */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🐤 Control de Despliegue Canary (Rollout Incremental)</Text>
            <Text style={styles.canaryVal}>Porcentaje Actual de Tráfico Activo: {canaryPercent}%</Text>
            <View style={styles.btnRow}>
              {[1, 10, 25, 50, 100].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.smallBtn, canaryPercent === p && styles.activeBtn]}
                  onPress={() => handleUpdateCanary(p)}
                >
                  <Text style={[styles.smallBtnText, canaryPercent === p && styles.activeBtnText]}>{p}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Beta Invite Code Generator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎫 Generación de Códigos de Invitación Beta</Text>
            <Text style={styles.subText}>
              Crea códigos con usos limitados para probadores Alpha y grupos de Closed Beta.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCreateInviteCode}>
              <Text style={styles.actionBtnText}>Generar Nuevo Código Beta</Text>
            </TouchableOpacity>
          </View>

          {/* App Store & Play Store Final Checklist */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📱 Lista de Verificación Final para Tiendas</Text>
            <Text style={styles.checkItem}>✅ Iconos, Capturas y Screenshots de Alta Definición</Text>
            <Text style={styles.checkItem}>✅ Términos, Privacidad y Enlace de Soporte Activos</Text>
            <Text style={styles.checkItem}>✅ Verificación Server-Side de In-App Purchases (iOS / Android)</Text>
            <Text style={styles.checkItem}>✅ Canal de Registro y Moderación de Contenido UGC</Text>
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
  scoreCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00E5FF',
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00E5FF',
    marginTop: 2,
  },
  subText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 8,
  },
  canaryVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  smallBtn: {
    flex: 1,
    backgroundColor: '#26203D',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeBtn: {
    backgroundColor: colors.accent,
  },
  smallBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeBtnText: {
    color: '#000',
  },
  actionBtn: {
    backgroundColor: colors.accent,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  actionBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  checkItem: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 2,
  },
});
