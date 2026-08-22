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

export const AdminTrustSafetyScreen = ({ navigation }: any) => {
  const [killSwitches, setKillSwitches] = useState<any>(null);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const ksRes = await apiFetch<any>('/trust/kill-switches');
      setKillSwitches(ksRes.killSwitches);

      const evalRes = await apiFetch<any>('/trust/risk-score', {
        method: 'POST',
        body: JSON.stringify({
          entityId: 'user_test_99',
          entityType: 'PAYOUT',
          context: { isNewDevice: true, amountCents: 150000, giftLoopDetected: false },
        }),
      });
      setEvalResult(evalRes.evaluation);
    } catch (err) {
      console.error('Error fetching security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKillSwitch = async (target: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/trust/kill-switch', {
        method: 'POST',
        body: JSON.stringify({ target, status: nextStatus }),
      });
      Alert.alert('Interruptor de Seguridad Actualizado', `Función ${target}: ${res.killSwitch.status}`);
      fetchSecurityData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al actualizar interruptor');
    }
  };

  const handleTestIdempotency = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const key = 'idem_key_demo_' + Date.now();
      const res1 = await apiFetch<any>('/trust/idempotency', {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey: key, amountCents: 5000 }),
      });
      const res2 = await apiFetch<any>('/trust/idempotency', {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey: key, amountCents: 5000 }),
      });

      Alert.alert(
        'Prueba de Idempotencia Completada',
        `Llamada 1 (Nuevo): Cached=${res1.cached} | Llamada 2 (Reintento): Cached=${res2.cached} (¡Sin cobro duplicado!)`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error en prueba de idempotencia');
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🛡️ Centro de Confianza, Seguridad e Integridad"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando estado de seguridad y cortafuegos de riesgo...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Emergency Kill Switches */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔴 Interruptores de Emergencia (Security Kill Switches)</Text>
            <Text style={styles.subText}>
              Pausa de manera independiente funciones de alto riesgo financiero sin apagar la plataforma.
            </Text>

            {killSwitches &&
              Object.values(killSwitches).map((ks: any) => (
                <View key={ks.target} style={styles.ksRow}>
                  <View>
                    <Text style={styles.ksName}>Módulo: {ks.target}</Text>
                    <Text style={styles.ksStatus}>
                      Estado: <Text style={{ color: ks.status === 'ACTIVE' ? '#00E5FF' : '#FF5252' }}>{ks.status}</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.ksBtn, { backgroundColor: ks.status === 'ACTIVE' ? '#FF5252' : '#00E5FF' }]}
                    onPress={() => handleToggleKillSwitch(ks.target, ks.status)}
                  >
                    <Text style={styles.ksBtnText}>{ks.status === 'ACTIVE' ? 'Pausar' : 'Activar'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>

          {/* Risk Evaluation Monitor */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚖️ Evaluador de Riesgo Multifactorial (Risk Score)</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Nivel de Riesgo:</Text>
              <Text style={[styles.val, { color: evalResult?.riskLevel === 'HIGH' ? '#FF9100' : '#00E5FF' }]}>
                {evalResult?.riskLevel} ({evalResult?.riskScore}/100)
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Acción Recomendada:</Text>
              <Text style={styles.val}>{evalResult?.recommendedAction}</Text>
            </View>

            <View style={styles.divider} />
            <Text style={styles.subText}>Señales de Riesgo Detectadas:</Text>
            {evalResult?.signals?.map((sig: string, idx: number) => (
              <Text key={idx} style={styles.sigItem}>• {sig}</Text>
            ))}
          </View>

          {/* Financial Protection Tools */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔒 Protección Financiera e Idempotencia</Text>
            <Text style={styles.subText}>
              Verifica que las transacciones duplicadas por reintentos de red no generen cobros dobles en el ledger.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleTestIdempotency}>
              <Text style={styles.actionBtnText}>Probar Deduplicación Idempotente por Clave</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Notice */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>🛡️ INTEGRIDAD FINANCIERA E INMUTABILIDAD DEL LEDGER</Text>
            <Text style={styles.noticeText}>
              Ningún cliente puede alterar directamente balances de Coins, Diamonds o Payouts. Todas las transacciones son atómicas y verificadas server-side con logs de auditoría inmutables.
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
  ksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#26203D',
  },
  ksName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  ksStatus: {
    fontSize: 11,
    color: colors.textMuted,
  },
  ksBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ksBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 11,
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
  sigItem: {
    fontSize: 11,
    color: '#FF9100',
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
