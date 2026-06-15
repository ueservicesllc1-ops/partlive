import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../../theme';
import { Mission, UserMissionProgress } from '../../types/mission';
import { MissionProgressBar } from './MissionProgressBar';
import { MissionRewardBadge } from './MissionRewardBadge';

interface Props {
  mission: Mission;
  progress?: UserMissionProgress;
  onClaim: (progressId: string) => Promise<boolean>;
  claimingId: string | null;
  setClaimingId: (id: string | null) => void;
}

export const MissionCard: React.FC<Props> = ({
  mission,
  progress,
  onClaim,
  claimingId,
  setClaimingId,
}) => {
  const currentVal = progress?.progress ?? 0;
  const isCompleted = progress?.isCompleted ?? false;
  const isClaimed = progress?.isClaimed ?? false;
  const isClaiming = claimingId === progress?.id;

  const handleClaim = async () => {
    if (!progress?.id) return;
    setClaimingId(progress.id);
    await onClaim(progress.id);
    setClaimingId(null);
  };

  return (
    <View style={[styles.card, isCompleted && !isClaimed && styles.cardCompleted]}>
      <View style={styles.topRow}>
        <View style={styles.infoCol}>
          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.description}>{mission.description}</Text>
        </View>
        <MissionRewardBadge type={mission.rewardType} amount={mission.rewardAmount} />
      </View>

      <MissionProgressBar progress={currentVal} target={mission.targetValue} />

      <View style={styles.bottomRow}>
        {isClaimed ? (
          <View style={styles.claimedBadge}>
            <Text style={styles.claimedText}>✓ Reclamado</Text>
          </View>
        ) : isCompleted ? (
          <TouchableOpacity
            style={styles.claimBtn}
            onPress={handleClaim}
            disabled={isClaiming}
          >
            {isClaiming ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.claimBtnText}>Reclamar Recompensa</Text>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={styles.pendingText}>En progreso</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: '#292440',
  },
  cardCompleted: {
    borderColor: colors.success + '44',
    backgroundColor: '#18242A',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  infoCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  description: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  claimBtn: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  claimBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimedBadge: {
    backgroundColor: '#292440',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  claimedText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
