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
import { useMissions } from '../../hooks/useMissions';
import { MissionCard } from '../../components/missions/MissionCard';
import { MissionEmptyState } from '../../components/missions/MissionEmptyState';

const TABS: { id: 'daily' | 'weekly' | 'host' | 'vip' | 'event'; label: string }[] = [
  { id: 'daily', label: 'Diarias' },
  { id: 'weekly', label: 'Semanales' },
  { id: 'host', label: 'Host' },
  { id: 'vip', label: 'VIP' },
  { id: 'event', label: 'Eventos' },
];

export const MissionsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'host' | 'vip' | 'event'>('daily');
  const { missions, loading, claimReward, getProgressForMission, refreshing, refresh } = useMissions(activeTab);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Misiones y Retos</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsContainer}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(item.id)}
                style={[styles.tabButton, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.tabsContent}
        />
      </View>

      {/* Missions List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MissionCard
              mission={item}
              progress={getProgressForMission(item.id)}
              onClaim={claimReward}
              claimingId={claimingId}
              setClaimingId={setClaimingId}
            />
          )}
          ListEmptyComponent={MissionEmptyState}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1B30',
  },
  backBtn: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    ...textPresets.h2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E1B30',
    backgroundColor: '#151221',
  },
  tabsContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1B30',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
