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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historial PK</Text>
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
