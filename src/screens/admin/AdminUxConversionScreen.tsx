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

export const AdminUxConversionScreen = ({ navigation }: any) => {
  const [funnel, setFunnel] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [creatorAct, setCreatorAct] = useState<any>(null);
  const [tapResult, setTapResult] = useState<any>(null);
  const [giftResult, setGiftResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUxConversionData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const funnelRes = await apiFetch<any>('/ux-conversion-2/funnel');
      const telemRes = await apiFetch<any>('/ux-conversion-2/telemetry');
      const actRes = await apiFetch<any>('/ux-conversion-2/creator-activation');

      setFunnel(funnelRes.funnel);
      setTelemetry(telemRes.telemetry);
      setCreatorAct(actRes.activation);
    } catch (err) {
      console.error('Error fetching UX conversion data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTapBurst = async (taps: number) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/ux-conversion-2/tap-burst', {
        method: 'POST',
        body: JSON.stringify({ liveId: 'live_superstar_1', tapCount: taps }),
      });
      setTapResult(res);
      Alert.alert(
        'Ráfaga de Taps 👍 en Vivo',
        `Taps Registrados: +${res.tapsAdded} 👍\nAnimación Ráfaga: ${res.burstAnimationTriggered ? 'ACTIVADA' : 'NO'}\nPatrón Háptico: ${res.hapticFeedbackPattern}`
      );
    } catch (err: any) {
      Alert.alert('Error Taps', err.message || 'Error al enviar taps');
    }
  };

  const handleTestGiftConversion = async (currentCoins: number) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/ux-conversion-2/gift-conversion', {
        method: 'POST',
        body: JSON.stringify({ liveId: 'live_superstar_1', giftId: 'gift_dragon_fire', currentCoins }),
      });
      setGiftResult(res.conversion);
      Alert.alert(
        'Flujo de Conversión de Regalos & Recarga',
        `Monedas Actuales: ${res.conversion.userCoins} | Requeridas: ${res.conversion.requiredCoins}\nSaldo Suficiente: ${res.conversion.hasSufficientBalance ? 'SÍ ✅' : 'NO ❌'}\nPrompt Recarga Activado: ${res.conversion.rechargeOfferTriggered ? 'SÍ (Pack Sugerido: ' + res.conversion.suggestedCoinPackageId + ')' : 'NO'}`
      );
    } catch (err: any) {
      Alert.alert('Error Conversión Regalos', err.message || 'Error en flujo de conversión');
    }
  };

  useEffect(() => {
    fetchUxConversionData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="✨ Centro de Experiencia UX/UI & Conversión 2.0"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando embudo de conversión y telemetría de rendimiento UX...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Conversion Funnel Metrics */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Métricas del Embudo de Conversión (Conversion Funnel)</Text>
            
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{funnel?.overallConversionRatePercent}%</Text>
                <Text style={styles.kpiLabel}>Conversión General (Total)</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{funnel?.stageRates?.homeToLiveWatch}%</Text>
                <Text style={styles.kpiLabel}>Home -&gt; Live Watch</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{funnel?.stageRates?.liveWatchToTap}%</Text>
                <Text style={styles.kpiLabel}>Live Watch -&gt; 👍 Tap</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{funnel?.stageRates?.tapToGiftSent}%</Text>
                <Text style={styles.kpiLabel}>👍 Tap -&gt; Gift Sent</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Punto Principal de Abandono:</Text>
              <Text style={[styles.val, { color: '#FF5252' }]}>{funnel?.topDropoffStage}</Text>
            </View>
          </View>

          {/* UX Audit & Accessibility Telemetry */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📱 Rendimiento Móvil, Accesibilidad & Anti-Dark Patterns</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>FPS Promedio Móvil:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{telemetry?.mobileFpsAverage} FPS</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Puntaje de Accesibilidad:</Text>
              <Text style={styles.val}>{telemetry?.accessibilityScorePercent}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Soporte RTL (Árabe):</Text>
              <Text style={styles.val}>{telemetry?.rtlLayoutReady ? 'LISTO ✅' : 'NO'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Patrones Oscuros Detectados:</Text>
              <Text style={[styles.val, { color: '#00E5FF', fontWeight: 'bold' }]}>{telemetry?.darkPatternsDetected} (Cero Patrones Engañosos ✅)</Text>
            </View>
          </View>

          {/* Live Experience 👍 Tap Burst Simulator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👍 Simulador de Ráfaga de Taps en Vivo (Interacción)</Text>
            <Text style={styles.subText}>Prueba la respuesta fluida del sistema de me gusta 👍 en vivo.</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => handleTestTapBurst(10)}>
                <Text style={styles.actionBtnText}>Enviar 10 Taps 👍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#00E5FF' }]} onPress={() => handleTestTapBurst(50)}>
                <Text style={[styles.actionBtnText, { color: '#000' }]}>Ráfaga 50 Taps 👍</Text>
              </TouchableOpacity>
            </View>

            {tapResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Taps Agregados: +{tapResult.tapsAdded} 👍 (Total Live: {tapResult.totalLiveTaps})</Text>
                <Text style={styles.resultSub}>Respuesta Háptica: {tapResult.hapticFeedbackPattern} | Animación: RÁFAGA ACTIVADA</Text>
              </View>
            )}
          </View>

          {/* Gift Conversion & Low Balance Recharge Flow */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎁 Optimización de Conversión de Regalos & Recarga</Text>
            <Text style={styles.subText}>Demuestra la detección de saldo insuficiente y la activación de recarga en 1 toque.</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => handleTestGiftConversion(600)}>
                <Text style={styles.actionBtnText}>Probar con 600 Coins</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#FF5252' }]} onPress={() => handleTestGiftConversion(50)}>
                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Probar con 50 Coins (Saldo Bajo)</Text>
              </TouchableOpacity>
            </View>

            {giftResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Requeridas: {giftResult.requiredCoins} | Posee: {giftResult.userCoins} Coins</Text>
                <Text style={styles.resultSub}>Suficiente: {giftResult.hasSufficientBalance ? 'SÍ ✅' : 'NO (Trigger Recarga: Pack ' + giftResult.suggestedCoinPackageId + ')'}</Text>
              </View>
            )}
          </View>

          {/* Creator Activation Journey Milestones */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⭐ Hitos de Activación de Creadores (Creator Journey)</Text>
            <Text style={styles.subText}>Progreso de incorporación y activación de creadores de contenido.</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Progreso de Activación Creador:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{creatorAct?.activationProgressPercent}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Primera Transmisión Live:</Text>
              <Text style={styles.val}>{creatorAct?.milestones?.firstLiveStreamed ? 'COMPLETADO ✅' : 'PENDIENTE ⏳'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Primer Regalo Recibido:</Text>
              <Text style={styles.val}>{creatorAct?.milestones?.firstGiftReceived ? 'COMPLETADO ✅' : 'PENDIENTE ⏳'}</Text>
            </View>
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
    color: '#FFF',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
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
  resultBox: {
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  resultSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
