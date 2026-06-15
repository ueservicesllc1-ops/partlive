import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { useMissions } from '../../hooks/useMissions';
import { MissionCard } from '../missions/MissionCard';

interface DailyMissionsSectionProps {
  onSeeAll?: () => void;
}

export const DailyMissionsSection: React.FC<DailyMissionsSectionProps> = ({ onSeeAll }) => {
  const { missions, loading, claimReward, getProgressForMission } = useMissions('daily');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Slice to show up to 3 daily missions
  const displayedMissions = missions.slice(0, 3);
  if (displayedMissions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Misiones Diarias 🎯</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAllBtn}>Ver todas →</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.list}>
        {displayedMissions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            progress={getProgressForMission(mission.id)}
            onClaim={claimReward}
            claimingId={claimingId}
            setClaimingId={setClaimingId}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  center: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
  },
  seeAllBtn: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
  },
  list: {
    gap: spacing.sm,
  },
});
