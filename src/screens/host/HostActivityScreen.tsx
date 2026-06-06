import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { HostActivityType } from '../../types';
import { useHostDashboard } from '../../hooks/useHostDashboard';
import { HostActivityItem } from '../../components/host/HostActivityItem';

const FILTER_TABS: Array<{ label: string; type: HostActivityType | 'all' }> = [
  { label: 'Todo', type: 'all' },
  { label: 'Lives', type: 'live_started' },
  { label: 'Salas', type: 'room_created' },
  { label: 'Regalos', type: 'gift_received' },
  { label: 'Ranking', type: 'ranking_update' },
  { label: 'Sistema', type: 'system' },
];

export const HostActivityScreen = ({ navigation }: any) => {
  const { activities, loading } = useHostDashboard();
  const [activeFilter, setActiveFilter] = useState<HostActivityType | 'all'>('all');

  const filtered = activeFilter === 'all'
    ? activities
    : activities.filter(a => a.type === activeFilter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Actividad</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter tabs */}
      <FlatList
        horizontal
        data={FILTER_TABS}
        keyExtractor={i => i.type}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeFilter === item.type && styles.tabActive]}
            onPress={() => setActiveFilter(item.type)}
          >
            <Text style={[styles.tabText, activeFilter === item.type && styles.tabTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <HostActivityItem activity={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>Sin actividad en este filtro.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: spacing.xxl }}
        />
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
  tabsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary + '33',
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyText: { ...textPresets.bodyMedium, color: colors.textMuted },
});

export default HostActivityScreen;
