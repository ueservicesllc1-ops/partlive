import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { MAIN_ROUTES } from '../../app/routes';
import { useHostDashboard } from '../../hooks/useHostDashboard';
import { useAuth } from '../../store/AuthContext';
import {
  HostStatusCard,
  HostStatsGrid,
  HostEarningsCard,
  HostQuickActions,
  HostRankingCard,
  HostActivityList,
} from '../../components/host';
import { Button } from '../../components/Button';

export const HostDashboardScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const { hostStatus, application, stats, activities, loading, refresh } = useHostDashboard();

  const handleBack = () => navigation.goBack();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} accessibilityLabel="Volver">
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Host Center</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── NOT APPLIED ── */}
        {hostStatus === 'not_applied' && (
          <View>
            <View style={styles.heroSection}>
              <Text style={styles.heroEmoji}>🎙️</Text>
              <Text style={styles.heroTitle}>Conviértete en Host</Text>
              <Text style={styles.heroSubtitle}>
                Haz lives, crea salas, recibe regalos y aparece en los rankings de PartyLive.
              </Text>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsCard}>
              <Text style={styles.benefitsTitle}>¿Por qué ser host?</Text>
              {BENEFITS.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Text style={styles.benefitEmoji}>{b.emoji}</Text>
                  <View>
                    <Text style={styles.benefitLabel}>{b.label}</Text>
                    <Text style={styles.benefitDesc}>{b.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.ctaContainer}>
              <Button
                title="Solicitar ser Host"
                variant="primary"
                size="large"
                onPress={() => navigation.navigate(MAIN_ROUTES.HOST_APPLICATION)}
              />
              <Button
                title="Ver Reglas del Programa"
                variant="outline"
                size="large"
                onPress={() => navigation.navigate(MAIN_ROUTES.HOST_RULES)}
              />
            </View>
          </View>
        )}

        {/* ── PENDING ── */}
        {hostStatus === 'pending' && (
          <View>
            <HostStatusCard
              hostStatus="pending"
              displayName={userProfile?.displayName}
              reviewNote={application?.reviewNote}
            />
            <View style={styles.pendingInfoCard}>
              <Text style={styles.pendingLabel}>Datos enviados</Text>
              <InfoRow label="Nombre" value={application?.fullName || '—'} />
              <InfoRow label="País" value={application?.country || '—'} />
              {application?.socialLink ? (
                <InfoRow label="Red Social" value={application.socialLink} />
              ) : null}
              <InfoRow label="Enviado" value={formatTimestamp(application?.createdAt)} />
            </View>
            <View style={styles.ctaContainer}>
              <Button
                title="Ver Reglas del Programa"
                variant="outline"
                size="large"
                onPress={() => navigation.navigate(MAIN_ROUTES.HOST_RULES)}
              />
            </View>
          </View>
        )}

        {/* ── APPROVED (full dashboard) ── */}
        {hostStatus === 'approved' && (
          <View>
            <HostStatusCard hostStatus="approved" displayName={userProfile?.displayName} />

            <HostQuickActions
              onStartLive={() => navigation.navigate(MAIN_ROUTES.START_LIVE)}
              onCreateRoom={() => navigation.navigate(MAIN_ROUTES.CREATE_ROOM)}
              onViewEarnings={() => navigation.navigate(MAIN_ROUTES.HOST_EARNINGS)}
              onViewPayouts={() => navigation.navigate(MAIN_ROUTES.HOST_PAYOUTS)}
              onViewPayoutMethods={() => navigation.navigate(MAIN_ROUTES.PAYOUT_METHODS)}
            />

            <HostEarningsCard stats={stats} />

            <HostStatsGrid stats={stats} />

            <HostRankingCard
              dailyRank={stats?.currentDailyRank}
              weeklyRank={stats?.currentWeeklyRank}
              bestRank={stats?.bestRankingPosition}
            />

            {/* Recent Activity preview */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Actividad Reciente</Text>
              <TouchableOpacity onPress={() => navigation.navigate(MAIN_ROUTES.HOST_ACTIVITY)}>
                <Text style={styles.sectionMore}>Ver todo →</Text>
              </TouchableOpacity>
            </View>
            <HostActivityList activities={activities} maxItems={5} />
          </View>
        )}

        {/* ── REJECTED ── */}
        {hostStatus === 'rejected' && (
          <View>
            <HostStatusCard
              hostStatus="rejected"
              displayName={userProfile?.displayName}
              reviewNote={application?.reviewNote}
            />
            <View style={styles.ctaContainer}>
              <Button
                title="Contactar Soporte"
                variant="secondary"
                size="large"
                onPress={() => {/* mock */}}
              />
              <Button
                title="Ver Reglas del Programa"
                variant="outline"
                size="large"
                onPress={() => navigation.navigate(MAIN_ROUTES.HOST_RULES)}
              />
            </View>
          </View>
        )}

        {/* ── SUSPENDED ── */}
        {hostStatus === 'suspended' && (
          <View>
            <HostStatusCard hostStatus="suspended" displayName={userProfile?.displayName} />
            <View style={styles.ctaContainer}>
              <Button
                title="Contactar Soporte"
                variant="secondary"
                size="large"
                onPress={() => {/* mock */}}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BENEFITS = [
  { emoji: '🎁', label: 'Recibe Regalos', desc: 'Los espectadores te envían gifts que se convierten en diamonds.' },
  { emoji: '💎', label: 'Gana Diamonds', desc: 'Acumula diamonds que podrán convertirse en retiros en el futuro.' },
  { emoji: '🏆', label: 'Aparece en Rankings', desc: 'Sube en los rankings diarios y semanales de la plataforma.' },
  { emoji: '🌟', label: 'Crea Comunidad', desc: 'Conecta con tu audiencia a través de lives y salas de voz.' },
];

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const formatTimestamp = (ts: any): string => {
  if (!ts) return '—';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  scrollContent: { paddingBottom: spacing.xxl },

  // Hero (not_applied)
  heroSection: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  heroEmoji: { fontSize: 64, marginBottom: spacing.md },
  heroTitle: { ...textPresets.h1, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  heroSubtitle: { ...textPresets.bodyMedium, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },

  // Benefits
  benefitsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  benefitsTitle: { ...textPresets.h3, color: colors.text, marginBottom: spacing.xs },
  benefitRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  benefitEmoji: { fontSize: 24, width: 32 },
  benefitLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  benefitDesc: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },

  // CTAs
  ctaContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },

  // Pending info
  pendingInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pendingLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.xs },
  infoRow: { flexDirection: 'row', gap: spacing.sm },
  infoLabel: { fontSize: 12, color: colors.textMuted, width: 80 },
  infoValue: { fontSize: 12, color: colors.text, flex: 1 },

  // Activity section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...textPresets.h3, color: colors.text },
  sectionMore: { fontSize: 12, color: colors.primary, fontWeight: '600' },
});

export default HostDashboardScreen;
