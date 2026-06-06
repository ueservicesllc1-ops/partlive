import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { Button } from '../Button';

interface MissionsProps {
  missions: any[];
}

export const DailyMissionsSection = ({ missions }: MissionsProps) => {
  if (!missions || missions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Misiones Diarias 🎯</Text>
      </View>
      
      <View style={styles.list}>
        {missions.map((mission) => {
          const isCompleted = mission.progress >= mission.total;
          const progressPercentage = Math.min((mission.progress / mission.total) * 100, 100);

          return (
            <View key={mission.id} style={styles.missionCard}>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDesc}>{mission.description}</Text>
                
                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{mission.progress}/{mission.total}</Text>
                </View>
              </View>
              
              <View style={styles.actionCol}>
                <View style={styles.rewardBox}>
                  <Text style={styles.rewardIcon}>🪙</Text>
                  <Text style={styles.rewardAmount}>+{mission.reward}</Text>
                </View>
                <Button 
                  title={isCompleted ? "Reclamar" : "Ir"} 
                  variant={isCompleted ? "primary" : "outline"} 
                  size="small" 
                  style={styles.actionBtn}
                  onPress={() => {}} 
                  disabled={!isCompleted}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl, // Extra space at the bottom of the screen
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
  },
  list: {
    gap: spacing.sm,
  },
  missionCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  missionInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  missionTitle: {
    ...textPresets.bodyMedium,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  missionDesc: {
    ...textPresets.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    ...textPresets.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  actionCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rewardIcon: { fontSize: 14, marginRight: 2 },
  rewardAmount: { ...textPresets.caption, color: '#FFB800', fontWeight: 'bold' },
  actionBtn: { width: '100%' },
});
