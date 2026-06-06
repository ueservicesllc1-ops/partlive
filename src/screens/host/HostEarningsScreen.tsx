import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { useHostDashboard } from '../../hooks/useHostDashboard';
import { HostEarningsCard } from '../../components/host/HostEarningsCard';
import { HostActivityList } from '../../components/host/HostActivityList';

export const HostEarningsScreen = ({ navigation }: any) => {
  const { stats, activities, loading } = useHostDashboard();

  // Filter only gift_received activities for earnings history
  const giftActivities = activities.filter(a => a.type === 'gift_received');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Ganancias</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Earnings summary */}
          <HostEarningsCard stats={stats} />

          {/* Total gifts info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Total de regalos recibidos</Text>
            <Text style={styles.infoBig}>{(stats?.totalGiftsReceived ?? 0).toLocaleString()}</Text>
          </View>

          {/* Explanation box */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerTitle}>¿Qué son los diamonds?</Text>
            <Text style={styles.disclaimerText}>
              Los diamonds son puntos que ganas al recibir regalos de tus espectadores. Aún no son dinero real.{'\n\n'}
              Cuando el sistema de retiros esté disponible, podrás convertir tus diamonds disponibles en pagos reales a tu cuenta bancaria o PayPal.{'\n\n'}
              La plataforma puede revisar tu actividad antes de aprobar cualquier retiro.
            </Text>
          </View>

          {/* Gift history */}
          <Text style={styles.sectionTitle}>Historial de Regalos</Text>
          <HostActivityList activities={giftActivities} />

          {giftActivities.length === 0 && (
            <View style={styles.emptyGifts}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyText}>Sin regalos aún</Text>
              <Text style={styles.emptySubtext}>
                Haz lives y crea salas para que tus seguidores puedan enviarte regalos.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  backArrow: { fontSize: 24, color: colors.text },
  headerTitle: { ...textPresets.h2, color: colors.text, flex: 1, textAlign: 'center' },
  headerRight: { width: 40 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: spacing.xxl },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '22',
  },
  infoTitle: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.xs },
  infoBig: { fontSize: 40, fontWeight: '900', color: colors.gold },
  disclaimerBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.lg,
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  disclaimerText: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  sectionTitle: {
    ...textPresets.h3,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  emptyGifts: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { ...textPresets.h3, color: colors.textMuted },
  emptySubtext: { ...textPresets.bodySmall, color: colors.textDark, textAlign: 'center', marginTop: spacing.xs, lineHeight: 18 },
});

export default HostEarningsScreen;
