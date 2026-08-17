import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import { useAuth } from '../../store/AuthContext';

export const MySubscriptionsScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const { apiFetch } = await import('../../services/api/apiClient');
        const res = await apiFetch<any>('/host-subscriptions/my-subscriptions');
        setSubscriptions(res);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="💳 Mis Suscripciones"
        showWallet={true}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando suscripciones activas...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* VIP Status Card */}
          <View style={styles.vipCard}>
            <View style={styles.vipHeader}>
              <Text style={styles.vipEmoji}>👑</Text>
              <View style={styles.vipCol}>
                <Text style={styles.vipTitle}>
                  {userProfile?.isVip ? `VIP Nivel ${userProfile?.vipLevel || 1}` : 'Membresía VIP'}
                </Text>
                <Text style={styles.vipSub}>
                  {userProfile?.isVip ? 'Suscripción Activa' : 'Sin VIP Activo'}
                </Text>
              </View>
            </View>

            {!userProfile?.isVip && (
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => navigation.navigate('VipPlans')}
              >
                <Text style={styles.upgradeBtnText}>Obtener VIP</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Host Subscriptions Section */}
          <Text style={styles.sectionTitle}>🎙️ Suscripciones a Anfitriones</Text>

          {(!subscriptions?.hostSubscriptions || subscriptions.hostSubscriptions.length === 0) ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>⭐</Text>
              <Text style={styles.emptyTitle}>No estás suscrito a ningún anfitrión</Text>
              <Text style={styles.emptySub}>
                Suscríbete a tus creadores favoritos para obtener insignias especiales y salas exclusivas.
              </Text>
            </View>
          ) : (
            subscriptions.hostSubscriptions.map((sub: any) => (
              <View key={sub.id} style={styles.subCard}>
                <View style={styles.subHeader}>
                  <Text style={styles.subBadge}>Nivel {sub.tier}</Text>
                  <Text style={styles.subPrice}>$4.99 / mes</Text>
                </View>
                <Text style={styles.subHost}>Anfitrión #{sub.hostId?.slice(-6)}</Text>
                <Text style={styles.subStatus}>Estado: {sub.status}</Text>
              </View>
            ))
          )}
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
  vipCard: {
    backgroundColor: '#1E1B30',
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  vipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  vipCol: {
    flex: 1,
  },
  vipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  vipSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  upgradeBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  upgradeBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141124',
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emptySub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  subCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    color: colors.accent,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  subHost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subStatus: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
