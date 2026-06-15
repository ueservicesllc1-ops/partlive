import React, { useState, useEffect, useCallback } from 'react';
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
import { analyticsApi } from '../../services/api/analyticsApi';

interface AgencyPeriodStats {
  periodKey: string;
  activeHosts: number;
  totalHosts: number;
  diamondsGenerated: number;
  hostBeansGenerated: number;
  agencyBeansEarned: number;
  commissionsCount: number;
}

const MetricCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) => (
  <View style={[styles.metricCard, { borderColor: color + '33' }]}>
    <Text style={styles.metricIcon}>{icon}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

export const AgencyAnalyticsScreen = ({ route, navigation }: any) => {
  const { agencyId } = route.params || {};
  const [data, setData] = useState<AgencyPeriodStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const fetchData = useCallback(async () => {
    if (!agencyId) {
      setError('ID de agencia no proporcionado');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const result = await analyticsApi.getMyAgencyAnalytics(agencyId, parseInt(period));
      setData(result.data || []);
    } catch (err: any) {
      setError('No se pudieron cargar las analíticas de la agencia');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agencyId, period]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Aggregate totals
  const totals = data.reduce(
    (acc, d) => ({
      activeHosts: Math.max(acc.activeHosts, d.activeHosts || 0),
      totalHosts: Math.max(acc.totalHosts, d.totalHosts || 0),
      hostBeans: acc.hostBeans + (d.hostBeansGenerated || 0),
      agencyBeans: acc.agencyBeans + (d.agencyBeansEarned || 0),
      commissionsCount: acc.commissionsCount + (d.commissionsCount || 0),
    }),
    { activeHosts: 0, totalHosts: 0, hostBeans: 0, agencyBeans: 0, commissionsCount: 0 }
  );

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analíticas de Agencia</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(['7', '30', '90'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
              {p === '7' ? '7 días' : p === '30' ? '30 días' : '90 días'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando analíticas...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Total Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resumen — últimos {period} días</Text>
                <View style={styles.metricsGrid}>
                  <MetricCard label="Comisión de Agencia" value={`🫘 ${formatNumber(totals.agencyBeans)}`} icon="" color="#f59e0b" />
                  <MetricCard label="Beans Generados Hosts" value={`🫘 ${formatNumber(totals.hostBeans)}`} icon="" color="#3b82f6" />
                  <MetricCard label="Hosts Activos" value={`👥 ${totals.activeHosts}`} icon="" color="#10b981" />
                  <MetricCard label="Eventos Comisión" value={`📈 ${totals.commissionsCount}`} icon="" color="#ec4899" />
                </View>
              </View>

              {/* Per period history */}
              {data.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Historial por Período</Text>
                  {data.map((row, i) => (
                    <View key={i} style={styles.historyRow}>
                      <Text style={styles.historyPeriod}>{row.periodKey}</Text>
                      <View style={styles.historyStats}>
                        <Text style={styles.histStat}>💼 Agencia: 🫘 {formatNumber(row.agencyBeansEarned || 0)}</Text>
                        <Text style={styles.histStat}>🎤 Hosts: 🫘 {formatNumber(row.hostBeansGenerated || 0)}</Text>
                        <Text style={styles.histStat}>👥 Activos: {row.activeHosts || 0} / {row.totalHosts || 0}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {data.length === 0 && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyIcon}>🏢</Text>
                  <Text style={styles.emptyTitle}>Aún no hay datos</Text>
                  <Text style={styles.emptySubtitle}>Los datos de rendimiento de tu agencia aparecerán aquí una vez que tus hosts comiencen a generar Beans</Text>
                </View>
              )}
            </>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backBtn: { padding: spacing.xs },
  backIcon: { fontSize: 22, color: colors.text },
  headerTitle: { ...textPresets.h2, fontSize: 17, color: colors.text },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodBtnText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  periodBtnTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  section: { gap: spacing.sm },
  sectionTitle: { ...textPresets.caption, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  metricIcon: { fontSize: 22 },
  metricValue: { fontSize: 20, fontWeight: '800' },
  metricLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', textAlign: 'center' },
  historyRow: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  historyPeriod: { fontSize: 12, color: '#9ca3af', fontWeight: '700', marginBottom: 8 },
  historyStats: { flexDirection: 'column', gap: 6 },
  histStat: { fontSize: 13, color: colors.text, fontWeight: '600' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { ...textPresets.caption, color: '#9ca3af' },
  errorBox: { alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  errorText: { color: '#ef4444', textAlign: 'center', fontSize: 14 },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...textPresets.h2, color: colors.text, fontSize: 18 },
  emptySubtitle: { ...textPresets.caption, color: '#6b7280', textAlign: 'center', maxWidth: 260 },
});
