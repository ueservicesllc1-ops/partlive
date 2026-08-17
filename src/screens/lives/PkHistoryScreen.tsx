import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors, spacing } from '../../theme';
import { getHostPkHistory } from '../../services/api/pkApi';
import { PkHistoryItem } from '../../components/pk/PkHistoryItem';
import { PkBattle } from '../../types/pk';

export const PkHistoryScreen = ({ route, navigation }: any) => {
  const { hostId } = route.params || {};
  const [history, setHistory] = useState<PkBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hostId) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const list = await getHostPkHistory(hostId);
        setHistory(list);
      } catch (err: any) {
        console.error(err);
        setError('Error al cargar el historial de batallas.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [hostId]);

  const wins = history.filter((b) => (b.hostAId === hostId && b.result === 'hostA_win') || (b.hostBId === hostId && b.result === 'hostB_win')).length;
  const losses = history.filter((b) => (b.hostAId === hostId && b.result === 'hostB_win') || (b.hostBId === hostId && b.result === 'hostA_win')).length;
  const draws = history.filter((b) => b.result === 'draw').length;
  const totalCompleted = history.length;
  const winRate = totalCompleted > 0 ? ((wins / totalCompleted) * 100).toFixed(1) : '0.0';
  const totalDiamonds = history.reduce((acc, b) => acc + (b.hostAId === hostId ? (b.hostADiamonds || 0) : (b.hostBDiamonds || 0)), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historial PK & Estadísticas</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorWrapper}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.statsCard}>
              <Text style={styles.statsCardTitle}>📊 RECORD PK ANFITRIÓN</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{wins}</Text>
                  <Text style={styles.statLabel}>Victorias</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{losses}</Text>
                  <Text style={styles.statLabel}>Derrotas</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{draws}</Text>
                  <Text style={styles.statLabel}>Empates</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#4CD964' }]}>{winRate}%</Text>
                  <Text style={styles.statLabel}>Win Rate</Text>
                </View>
              </View>
              <View style={styles.diamondsRow}>
                <Text style={styles.diamondsText}>💎 Total Diamantes Ganados en PK: {totalDiamonds}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyText}>No se encontraron batallas finalizadas en el historial.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PkHistoryItem battle={item} currentHostId={hostId} />
          )}
        />
      )}
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  backBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  statsCard: {
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#342D54',
  },
  statsCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  diamondsRow: {
    marginTop: spacing.xs,
    alignItems: 'center',
    backgroundColor: '#141124',
    paddingVertical: 6,
    borderRadius: 10,
  },
  diamondsText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  emptyWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
export default PkHistoryScreen;
