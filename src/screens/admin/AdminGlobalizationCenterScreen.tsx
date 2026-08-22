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

export const AdminGlobalizationCenterScreen = ({ navigation }: any) => {
  const [clConfig, setClConfig] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [marketScore, setMarketScore] = useState<any>(null);
  const [langResult, setLangResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchGlobalizationData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const configRes = await apiFetch<any>('/globalization-2/country?countryCode=CL');
      const pricingRes = await apiFetch<any>('/globalization-2/pricing?countryCode=CL');
      const scoreRes = await apiFetch<any>('/globalization-2/market-score?countryCode=CL');

      setClConfig(configRes.config);
      setPricing(pricingRes.pricing);
      setMarketScore(scoreRes.score);
    } catch (err) {
      console.error('Error fetching globalization data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLanguageResolution = async (lang: string) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/globalization-2/language', {
        method: 'POST',
        body: JSON.stringify({ userPref: lang, countryCode: 'SA' }),
      });
      setLangResult(res);
      Alert.alert(
        'Resolución de Idioma & RTL',
        `Idioma Efectivo: ${res.effectiveLanguage} | Dirección Texto: ${res.textDirection?.toUpperCase()} | Soporte RTL: ${res.isRTL ? 'SÍ 🟢' : 'NO ⚪'}`
      );
    } catch (err: any) {
      Alert.alert('Error Idioma', err.message || 'Error al resolver idioma');
    }
  };

  const handleToggleCountry = async () => {
    const nextStatus = clConfig?.status === 'ACTIVE' ? 'BETA' : 'ACTIVE';
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/globalization-2/toggle-country', {
        method: 'POST',
        body: JSON.stringify({ countryCode: 'CL', status: nextStatus }),
      });
      setClConfig(res.country);
      Alert.alert(
        'Estado de Despliegue de País',
        `Chile (CL) actualizado a estado: ${res.country.status}`
      );
    } catch (err: any) {
      Alert.alert('Error Despliegue', err.message || 'Error al cambiar estado');
    }
  };

  useEffect(() => {
    fetchGlobalizationData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🌐 Centro de Globalización & Expansión"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando países activos, precios regionales e idiomas RTL...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Active Country Configuration */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🗺️ Configuración Regional de País: {clConfig?.name} ({clConfig?.countryCode})</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Estado de Despliegue:</Text>
              <Text style={[styles.val, { color: clConfig?.status === 'ACTIVE' ? '#00E5FF' : '#FF5252' }]}>{clConfig?.status}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Moneda Oficial:</Text>
              <Text style={styles.val}>{clConfig?.currencyCode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Perfil de Precios:</Text>
              <Text style={styles.val}>{clConfig?.pricingProfile}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Zona Horaria Servidor:</Text>
              <Text style={styles.val}>{clConfig?.timezone}</Text>
            </View>
          </View>

          {/* Regional Pricing Profile & Currency Display */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💵 Perfil de Precios Regionales & Moneda Local</Text>
            
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{pricing?.currencySymbol} {pricing?.starterCoinPackPrice}</Text>
                <Text style={styles.kpiLabel}>Pack Inicial Coins ({pricing?.currencyCode})</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiVal, { color: '#00E5FF' }]}>{pricing?.currencySymbol} {pricing?.vipMonthlyPrice}</Text>
                <Text style={styles.kpiLabel}>Membresía VIP Mensual ({pricing?.currencyCode})</Text>
              </View>
            </View>
          </View>

          {/* Market Opportunity Score */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Puntaje de Oportunidad de Mercado (Market Score)</Text>
            <Text style={styles.subText}>Evaluación de potencial para expansión en LATAM y MENA.</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Puntaje Oportunidad Mercado:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{marketScore?.marketScore}/100</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ARPU Estimado:</Text>
              <Text style={styles.val}>${marketScore?.estimatedArpuUsd} USD</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Pasarelas Pago / Retiro Listas:</Text>
              <Text style={styles.val}>{marketScore?.readinessChecklist?.paymentsReady ? 'APROBADO ✅' : 'PENDIENTE ⏳'}</Text>
            </View>
          </View>

          {/* Language Hierarchy & RTL Support Simulator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🗣️ Simulador de Jerarquía de Idiomas & Soporte RTL</Text>
            <Text style={styles.subText}>Prueba la resolución dinámica de idiomas e interfaces RTL (Árabe/Hebreo).</Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => handleTestLanguageResolution('es')}>
                <Text style={styles.actionBtnText}>Español (es)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#00E5FF' }]} onPress={() => handleTestLanguageResolution('ar')}>
                <Text style={[styles.actionBtnText, { color: '#000' }]}>Árabe (ar) RTL</Text>
              </TouchableOpacity>
            </View>

            {langResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>Idioma: {langResult.effectiveLanguage} | Dirección: {langResult.textDirection}</Text>
                <Text style={styles.resultSub}>RTL Activado: {langResult.isRTL ? 'SÍ (Interfaz Invertida)' : 'NO (LTR Normal)'}</Text>
              </View>
            )}
          </View>

          {/* Country Rollout Toggle */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ Gestión de Despliegue de Mercado</Text>
            <Text style={styles.subText}>Cambia el estado operativo de Chile (CL) entre ACTIVE y BETA.</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={handleToggleCountry}>
              <Text style={styles.actionBtnText}>Cambiar Estado de Despliegue País (CL)</Text>
            </TouchableOpacity>
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
