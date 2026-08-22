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

export const AdminGrowthCenterScreen = ({ navigation }: any) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchGrowthData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/growth/metrics');
      setMetrics(res.metrics);
    } catch (err) {
      console.error('Error fetching growth metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const name = 'Campaña TikTok Hosts Q3';
      const res = await apiFetch<any>('/growth/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name, channel: 'TikTok', budgetUsd: 500, targetCacUsd: 1.50 }),
      });
      Alert.alert('Campaña Creada', `Campaña: ${res.campaign.name} | Presupuesto: $${res.campaign.budgetUsd}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al crear campaña');
    }
  };

  const handleCreatePromoCode = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const code = 'PROMO_' + Math.floor(1000 + Math.random() * 9000);
      const res = await apiFetch<any>('/growth/promos', {
        method: 'POST',
        body: JSON.stringify({ code, rewardCoins: 100, maxUses: 50 }),
      });
      Alert.alert('Código Promocional Creado', `Código: ${res.promo.code} | Coins: ${res.promo.rewardCoins} | Usos: ${res.promo.maxUses}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al crear código promo');
    }
  };

  useEffect(() => {
    fetchGrowthData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="📈 Growth Engine y Reclutamiento"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando métricas de adquisición y economía de unidad...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Unit Economics Metrics */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Economía de Adquisición (CAC / LTV / ROAS)</Text>
            <View style={styles.row}>
              <Text style={styles.label}>CAC (Costo de Adquisición):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>${metrics?.cacUsd}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>LTV (Valor del Cliente a Largo Plazo):</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>${metrics?.ltvUsd}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ratio LTV / CAC:</Text>
              <Text style={[styles.val, { color: '#00E5FF' }]}>{metrics?.ltvToCacRatio}x</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Periodo de Retorno (Payback):</Text>
              <Text style={styles.val}>{metrics?.paybackPeriodDays} Días</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ARPU / ARPPU:</Text>
              <Text style={styles.val}>${metrics?.arpuUsd} / ${metrics?.arppuUsd}</Text>
            </View>
          </View>

          {/* Campaign Controls */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Gestión de Campañas de Marketing</Text>
            <Text style={styles.subText}>
              Configura límites de presupuesto y reglas de pausa automática si el CAC excede $1.50 USD.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCreateCampaign}>
              <Text style={styles.actionBtnText}>Crear Nueva Campaña de Marketing</Text>
            </TouchableOpacity>
          </View>

          {/* Promo Code Engine */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎁 Generador de Códigos Promocionales</Text>
            <Text style={styles.subText}>
              Otorga Coins de prueba y bonos con control estricto antifraude por usuario y presupuesto.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCreatePromoCode}>
              <Text style={styles.actionBtnText}>Generar Código Promocional</Text>
            </TouchableOpacity>
          </View>

          {/* Growth Policy */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>🛡️ REGLAS DE CRECIMIENTO ORGÁNICO Y TRANSPARENTE</Text>
            <Text style={styles.noticeText}>
              Queda estrictamente prohibida la simulación de usuarios falsos, compras de bots o manipulación de ratings. Todas las conversiones son 100% orgánicas y verificadas server-side.
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
