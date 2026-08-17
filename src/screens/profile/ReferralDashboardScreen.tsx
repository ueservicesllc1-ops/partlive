import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';

export const ReferralDashboardScreen = ({ navigation }: any) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const { apiFetch } = await import('../../services/api/apiClient');
        const res = await apiFetch<any>('/referrals/my-code');
        setData(res);
      } catch (err) {
        console.error('Error fetching referral dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, []);

  const handleShare = async () => {
    if (!data?.shareLink) return;
    try {
      await Share.share({
        message: `¡Únete a PartyLive y obtén recompensas exclusivas usando mi código ${data.referralCode}! ${data.shareLink}`,
        url: data.shareLink,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo compartir el código.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🎁 Invita & Gana"
        showWallet={true}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando panel de referidos...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Referral Code Card */}
          <View style={styles.codeCard}>
            <Text style={styles.cardLabel}>TU CÓDIGO DE REFERIDO</Text>
            <Text style={styles.codeText}>{data?.referralCode || 'PARTY'}</Text>
            <Text style={styles.cardSub}>
              Gana +500 XP por cada amigo que complete su registro e interactúe en la plataforma.
            </Text>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>🚀 Compartir Enlace de Invitación</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{data?.totalReferrals || 0}</Text>
              <Text style={styles.statLabel}>Amigos Invitados</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#FFD700' }]}>{data?.qualifiedReferrals || 0}</Text>
              <Text style={styles.statLabel}>Calificados</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: colors.accent }]}>+{data?.earnedXp || 0}</Text>
              <Text style={styles.statLabel}>XP Ganada</Text>
            </View>
          </View>

          {/* Invited Friends List */}
          <Text style={styles.sectionTitle}>👥 Tus Invitados</Text>
          {(!data?.referrals || data.referrals.length === 0) ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>Aún no has invitado a ningún amigo</Text>
              <Text style={styles.emptySub}>
                Comparte tu enlace único en WhatsApp o redes sociales para comenzar a ganar XP.
              </Text>
            </View>
          ) : (
            data.referrals.map((item: any) => (
              <View key={item.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>Usuario #{item.referredUserId?.slice(-6)}</Text>
                <Text
                  style={[
                    styles.itemBadge,
                    { color: item.status === 'QUALIFIED' ? '#00E5FF' : colors.textMuted },
                  ]}
                >
                  {item.status === 'QUALIFIED' ? '✅ Calificado' : '⏳ Pendiente'}
                </Text>
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
  codeCard: {
    backgroundColor: '#1E1B30',
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.accent,
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginVertical: 8,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  shareBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#26203D',
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
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
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  itemTitle: {
    fontSize: 13,
    color: '#FFF',
  },
  itemBadge: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
