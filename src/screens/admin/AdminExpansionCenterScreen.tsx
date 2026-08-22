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

export const AdminExpansionCenterScreen = ({ navigation }: any) => {
  const [usConfig, setUsConfig] = useState<any>(null);
  const [ecConfig, setEcConfig] = useState<any>(null);
  const [conversion, setConversion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchExpansionData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const usRes = await apiFetch<any>('/expansion/countries/US');
      const ecRes = await apiFetch<any>('/expansion/countries/EC');
      setUsConfig(usRes.config);
      setEcConfig(ecRes.config);
    } catch (err) {
      console.error('Error fetching expansion configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCurrencyFx = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/expansion/fx/convert', {
        method: 'POST',
        body: JSON.stringify({ amount: 100, fromCurrency: 'USD', toCurrency: 'MXN' }),
      });
      setConversion(res);
      Alert.alert('Conversión FX Exitosa', `$100 USD = $${res.convertedAmount} MXN (Tasa: ${res.exchangeRate})`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al convertir moneda');
    }
  };

  const handleSimulateMexico = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/expansion/simulate', {
        method: 'POST',
        body: JSON.stringify({ countryCode: 'MX', targetDau: 50000, arppuUsd: 18.0, paymentFeePercent: 3.0 }),
      });
      Alert.alert(
        'Simulación de Expansión México',
        `Ingresos Proyectados: $${res.simulation.projectedMonthlyRevenueUsd} USD | Margen Proyectado: $${res.simulation.projectedContributionMarginUsd} USD`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al simular expansión');
    }
  };

  useEffect(() => {
    fetchExpansionData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🌐 Expansión Global y Multipaís"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando configuraciones regionales y tasas FX...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Active Country Matrix */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌎 Países Activos y Configuraciones Regionales</Text>
            
            <View style={styles.countryRow}>
              <Text style={styles.countryFlag}>🇺🇸 Estados Unidos (US)</Text>
              <Text style={styles.statusBadge}>{usConfig?.status}</Text>
            </View>
            <Text style={styles.subText}>
              Moneda: {usConfig?.defaultCurrency} • Idiomas: {usConfig?.supportedLanguages?.join(', ')}
            </Text>

            <View style={styles.divider} />

            <View style={styles.countryRow}>
              <Text style={styles.countryFlag}>🇪🇨 Ecuador (EC)</Text>
              <Text style={styles.statusBadge}>{ecConfig?.status}</Text>
            </View>
            <Text style={styles.subText}>
              Moneda: {ecConfig?.defaultCurrency} • Idiomas: {ecConfig?.supportedLanguages?.join(', ')}
            </Text>
          </View>

          {/* Currency Engine */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💱 Motor de Conversión de Monedas (FX Engine)</Text>
            <Text style={styles.subText}>
              Preserva el monto original y la tasa aplicada en cada transacción histórica sin recalcular datos pasados.
            </Text>
            {conversion && (
              <Text style={styles.fxVal}>
                ${conversion.originalAmount} {conversion.originalCurrency} → ${conversion.convertedAmount} {conversion.targetCurrency}
              </Text>
            )}
            <TouchableOpacity style={styles.actionBtn} onPress={handleTestCurrencyFx}>
              <Text style={styles.actionBtnText}>Probar Conversión FX ($100 USD → MXN)</Text>
            </TouchableOpacity>
          </View>

          {/* Market Expansion Simulator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🚀 Simulador de Expansión de Nuevos Mercados</Text>
            <Text style={styles.subText}>
              Calcula ingresos proyectados y márgenes de contribución para el lanzamiento en México o Colombia.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSimulateMexico}>
              <Text style={styles.actionBtnText}>Simular Lanzamiento en México (50K DAU)</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Review Guardrail */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>⚖️ REVISIÓN REGIONAL LEGAL Y FISCAL (LEGAL_REVIEW_REQUIRED)</Text>
            <Text style={styles.noticeText}>
              La activación de payouts o monetización en un nuevo país requiere validación previa de los perfiles fiscales y proveedores de pago regionales.
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
  countryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  countryFlag: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#26203D',
    marginVertical: 4,
  },
  fxVal: {
    fontSize: 11,
    color: '#00E5FF',
    fontWeight: 'bold',
    marginTop: 4,
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
    backgroundColor: 'rgba(255, 145, 0, 0.12)',
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
});
