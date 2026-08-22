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

export const AdminAICenterScreen = ({ navigation }: any) => {
  const [costs, setCosts] = useState<any>(null);
  const [modResult, setModResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAIData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/ai/costs');
      setCosts(res.costs);
    } catch (err) {
      console.error('Error fetching AI costs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestModeration = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/ai/moderate', {
        method: 'POST',
        body: JSON.stringify({ text: 'Gana $10000 gratis compra spam followers ahora', context: 'chat' }),
      });
      setModResult(res.result);
      Alert.alert(
        'Moderación de IA Evaluada',
        `Nivel de Riesgo: ${res.result.riskLevel} | Puntaje: ${res.result.riskScore}/100 | Categorías: ${res.result.categoriesDetected.join(', ')}`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al probar moderación');
    }
  };

  const handleTestFinancialGuard = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/ai/financial-guard-check', {
        method: 'POST',
        body: JSON.stringify({ actionName: 'mutateCoinsBalance' }),
      });
      Alert.alert(
        'Guardia de Aislamiento Financiero',
        `Permitido: ${res.allowed} | Razón: ${res.reason || 'Acción permitida'}`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al probar guardia financiero');
    }
  };

  useEffect(() => {
    fetchAIData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🤖 Centro de Inteligencia Artificial"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando métricas de IA, costos y enrutamiento de modelos...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* AI Usage & Cost Tracker */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Control de Consumo y Presupuesto de IA</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Gasto Mensual Total:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>${costs?.totalCostMonthUsd} USD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Límite de Presupuesto (Cap):</Text>
              <Text style={styles.val}>${costs?.budgetCapUsd} USD</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Costo Moderación de Chat:</Text>
              <Text style={styles.val}>${costs?.moderationCostUsd} USD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Costo Asistente de Creadores:</Text>
              <Text style={styles.val}>${costs?.creatorAiCostUsd} USD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Costo Traducción en Vivo:</Text>
              <Text style={styles.val}>${costs?.translationCostUsd} USD</Text>
            </View>
          </View>

          {/* AI Moderation Tester */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛡️ Evaluador de Moderación de Texto y Spam</Text>
            <Text style={styles.subText}>
              Clasifica spam, fraudes y acoso con modelos de baja latencia sin generar baneos permanentes automáticos.
            </Text>
            {modResult && (
              <Text style={styles.resVal}>
                Puntaje: {modResult.riskScore} | Nivel: {modResult.riskLevel} | Modelo: {modResult.modelUsed}
              </Text>
            )}
            <TouchableOpacity style={styles.actionBtn} onPress={handleTestModeration}>
              <Text style={styles.actionBtnText}>Probar Moderación de Texto</Text>
            </TouchableOpacity>
          </View>

          {/* Financial Security Guard */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔒 Guardia de Aislamiento Financiero</Text>
            <Text style={styles.subText}>
              Protege el Financial Ledger impidiendo que cualquier modelo de IA modifique Coins, Diamonds o Payouts.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleTestFinancialGuard}>
              <Text style={styles.actionBtnText}>Probar Intento de Mutación Financiera por IA</Text>
            </TouchableOpacity>
          </View>

          {/* Governance Notice */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>⚖️ REGLAS DE GOBERNANZA DE IA (AI GOVERNANCE)</Text>
            <Text style={styles.noticeText}>
              Toda decisión de moderación crítica requiere revisión humana previa. Ninguna IA tiene privilegios para alterar código de producción, reglas de seguridad ni la economía virtual.
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
  resVal: {
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
