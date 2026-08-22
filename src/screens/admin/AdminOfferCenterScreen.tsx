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

export const AdminOfferCenterScreen = ({ navigation }: any) => {
  const [coinPackages, setCoinPackages] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [nbo, setNbo] = useState<any>(null);
  const [killSwitchEnabled, setKillSwitchEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchMonetizationData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const packsRes = await apiFetch<any>('/monetization-offers/coin-packages');
      const offersRes = await apiFetch<any>('/monetization-offers/eligible');
      const nboRes = await apiFetch<any>('/monetization-offers/next-best');

      setCoinPackages(packsRes.packages || []);
      setOffers(offersRes.offers || []);
      setNbo(nboRes);
    } catch (err) {
      console.error('Error fetching monetization offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimOfferTest = async (offerId: string) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/monetization-offers/claim', {
        method: 'POST',
        body: JSON.stringify({ offerId, receiptToken: 'receipt_valid_token_123' }),
      });
      Alert.alert('Reclamo de Oferta', `Oferta Reclamada Exitosamente. Coins Otorgadas: +${res.coinsGranted}`);
    } catch (err: any) {
      Alert.alert('Error Reclamo', err.message || 'Error al reclamar oferta');
    }
  };

  const handleToggleKillSwitch = async () => {
    const nextState = !killSwitchEnabled;
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/monetization-offers/kill-switch', {
        method: 'POST',
        body: JSON.stringify({ enabled: nextState, reason: 'Prueba de control administrativo' }),
      });
      setKillSwitchEnabled(res.killSwitch.enabled);
      Alert.alert(
        'Kill Switch de Monetización',
        `Promociones Inteligentes: ${res.killSwitch.enabled ? 'ACTIVADAS' : 'PAUSADAS DE EMERGENCIA'}`
      );
    } catch (err: any) {
      Alert.alert('Error Kill Switch', err.message || 'Error al cambiar interruptor');
    }
  };

  useEffect(() => {
    fetchMonetizationData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🎁 Centro de Ofertas & Monetización IA"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando ofertas inteligentes, paquetes y experimentos A/B...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Coin Packages Catalog */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🪙 Catálogo Oficial de Paquetes de Coins (Base + Bonus)</Text>
            
            {coinPackages.map((pkg) => (
              <View key={pkg.packageId} style={styles.pkgRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pkgName}>
                    {pkg.tierName} {pkg.isRecommended ? '⭐ (Recomendado)' : ''}
                  </Text>
                  <Text style={styles.pkgDetail}>
                    {pkg.baseCoins} Base + <Text style={{ color: '#00E5FF', fontWeight: 'bold' }}>{pkg.bonusCoins} Bonus</Text> ({pkg.totalCoins} Total)
                  </Text>
                </View>
                <Text style={styles.pkgPrice}>${pkg.priceUsd} USD</Text>
              </View>
            ))}
          </View>

          {/* Next Best Offer Engine */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🤖 Motor Next Best Offer (NBO) & Experimento A/B</Text>
            <Text style={styles.subText}>Variante Asignada: <Text style={{ color: '#00E5FF', fontWeight: 'bold' }}>{nbo?.experimentVariant}</Text> | Relevancia: {nbo?.relevanceScore * 100}%</Text>

            {nbo?.nextOffer && (
              <View style={styles.offerBox}>
                <Text style={styles.offerTitle}>{nbo.nextOffer.title}</Text>
                <Text style={styles.offerDesc}>{nbo.nextOffer.description}</Text>
                <Text style={styles.offerSavings}>Ahorro Real Transparente: {nbo.nextOffer.savingsPercent}%</Text>
                
                <TouchableOpacity style={styles.claimBtn} onPress={() => handleClaimOfferTest(nbo.nextOffer.offerId)}>
                  <Text style={styles.claimBtnText}>Probar Reclamo de Oferta</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Active Targeted Offers List */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Ofertas Promocionales Segmentadas Activas</Text>
            
            {offers.map((off) => (
              <View key={off.offerId} style={styles.offerItem}>
                <Text style={styles.offTitle}>{off.title}</Text>
                <Text style={styles.offDesc}>{off.description}</Text>
                <Text style={styles.offMeta}>Ubicación: {off.placement} | Uso Único: {off.isSingleUse ? 'Sí' : 'No'}</Text>
              </View>
            ))}
          </View>

          {/* Emergency Monetization Kill Switch */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚠️ Interruptor de Emergencia de Promociones</Text>
            <Text style={styles.subText}>
              Pausa ofertas promocionales sin interrumpir las compras normales de paquetes de Coins.
            </Text>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: killSwitchEnabled ? '#FF5252' : '#00E5FF' }]}
              onPress={handleToggleKillSwitch}
            >
              <Text style={[styles.actionBtnText, { color: killSwitchEnabled ? '#FFF' : '#000' }]}>
                {killSwitchEnabled ? 'Pausar Ofertas Promocionales (Kill Switch)' : 'Reactivar Ofertas Promocionales'}
              </Text>
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
  pkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 4,
  },
  pkgName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  pkgDetail: {
    fontSize: 10,
    color: colors.textMuted,
  },
  pkgPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.accent,
  },
  offerBox: {
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
  },
  offerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  offerDesc: {
    fontSize: 11,
    color: '#FFF',
  },
  offerSavings: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: 'bold',
  },
  claimBtn: {
    backgroundColor: colors.accent,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  claimBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 11,
  },
  offerItem: {
    backgroundColor: '#1C1830',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  offTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  offDesc: {
    fontSize: 11,
    color: colors.textMuted,
  },
  offMeta: {
    fontSize: 10,
    color: '#00E5FF',
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
});
