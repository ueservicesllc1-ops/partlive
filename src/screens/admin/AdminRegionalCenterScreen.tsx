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

export const AdminRegionalCenterScreen = ({ navigation }: any) => {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarkets = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/regional/countries');
      setMarkets(res.markets || []);
    } catch (err) {
      console.error('Error fetching regional markets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const handleToggleCountryStatus = async (countryCode: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'BETA' : 'ACTIVE';
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch(`/regional/countries/${countryCode}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      Alert.alert('Actualizado', `Estado de ${countryCode} cambiado a ${nextStatus}.`);
      fetchMarkets();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el estado.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🌐 Control de Expansión Global"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando mercados e idiomas...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌍 Mercados Activos y Regionales</Text>
            <Text style={styles.sectionSub}>
              Administra la disponibilidad de mercados, monedas locales y reglas de retiro por país.
            </Text>
          </View>

          {markets.map((m) => (
            <View key={m.countryCode} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.countryName}>
                  {m.countryName} ({m.countryCode})
                </Text>

                <TouchableOpacity
                  style={[
                    styles.statusBadge,
                    { backgroundColor: m.status === 'ACTIVE' ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 215, 0, 0.2)' },
                  ]}
                  onPress={() => handleToggleCountryStatus(m.countryCode, m.status)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: m.status === 'ACTIVE' ? '#00E5FF' : '#FFD700' },
                    ]}
                  >
                    {m.status}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailItem}>Moneda: {m.currency}</Text>
                <Text style={styles.detailItem}>Idioma: {m.defaultLanguage}</Text>
                <Text style={styles.detailItem}>Mínimo Payout: ${m.minimumPayoutUsd} USD</Text>
              </View>

              <Text style={styles.timezoneText}>Zona Horaria: {m.timezone}</Text>
            </View>
          ))}
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
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    fontSize: 11,
    color: colors.textMuted,
  },
  timezoneText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});
