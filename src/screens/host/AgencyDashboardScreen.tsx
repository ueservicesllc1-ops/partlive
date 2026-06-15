import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../../theme';
import { useAgencyDashboard } from '../../hooks/useAgencyDashboard';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/Button';

export const AgencyDashboardScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  
  // Try to use owner profile ID to get active links
  const { dashboardData, loading, error, refresh } = useAgencyDashboard(userProfile?.uid);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando dashboard de la agencia...</Text>
      </SafeAreaView>
    );
  }

  const agency = dashboardData?.agency || null;

  if (!agency) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agencia</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏢</Text>
          <Text style={styles.emptyTitle}>Sin Agencia Activa</Text>
          <Text style={styles.emptyText}>
            No pareces ser el propietario de una agencia registrada o aprobada.
          </Text>
          <Button
            title="Solicitar ser Agencia"
            variant="primary"
            onPress={() => navigation.navigate('AgencyApplication')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{agency.name}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info card */}
        <View style={styles.agencyCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Agencia Aprobada</Text>
          </View>
          <Text style={styles.agencyName}>{agency.name}</Text>
          <Text style={styles.agencySub}>{agency.country} • Comisión: {agency.commissionPercent || 10}%</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{agency.totalHosts || 0}</Text>
            <Text style={styles.statLabel}>Hosts Activos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{(agency.totalBeansGenerated || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Beans Totales</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: colors.gold }]}>
              {(agency.totalCommissionBeans || 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Comisión (Beans)</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Operaciones</Text>
          
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('AgencyHosts', { agencyId: agency.id })}
          >
            <View style={styles.actionLeft}>
              <Text style={styles.actionEmoji}>👥</Text>
              <View>
                <Text style={styles.actionLabel}>Administrar Hosts</Text>
                <Text style={styles.actionDesc}>Invitar o remover streamers de tu agencia.</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, { marginTop: spacing.sm }]}
            onPress={() => navigation.navigate('AgencyAnalytics', { agencyId: agency.id })}
          >
            <View style={styles.actionLeft}>
              <Text style={styles.actionEmoji}>📊</Text>
              <View>
                <Text style={styles.actionLabel}>Ver Analíticas</Text>
                <Text style={styles.actionDesc}>Estadísticas de rendimiento y comisiones de tu agencia.</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  scrollContent: {
    padding: spacing.md,
  },
  agencyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  badge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  badgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: 'bold',
  },
  agencyName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  agencySub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  statVal: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  actionSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionDesc: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  arrow: {
    color: colors.textMuted,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
});
export default AgencyDashboardScreen;
