import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { MissionRewardType } from '../../types/mission';

interface Props {
  type: MissionRewardType;
  amount: number;
}

export const MissionRewardBadge: React.FC<Props> = ({ type, amount }) => {
  const getBadgeIcon = () => {
    switch (type) {
      case 'xp':
        return '⚡';
      case 'diamonds':
        return '💎';
      case 'beans':
        return '🫘';
      case 'badge':
        return '🎖️';
      case 'event_points':
        return '🏆';
      case 'vip_trial':
        return '👑';
      case 'gift_ticket':
        return '🎟️';
      default:
        return '🎁';
    }
  };

  const getBadgeColor = () => {
    switch (type) {
      case 'xp':
        return colors.success;
      case 'diamonds':
        return colors.primary;
      case 'beans':
        return colors.gold;
      case 'vip_trial':
        return '#FFD54F';
      case 'gift_ticket':
        return colors.accent;
      default:
        return colors.border;
    }
  };

  return (
    <View style={[styles.container, { borderColor: getBadgeColor() + '44' }]}>
      <Text style={styles.icon}>{getBadgeIcon()}</Text>
      <Text style={[styles.amount, { color: getBadgeColor() }]}>
        +{amount} {type.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B30',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  icon: {
    fontSize: 12,
  },
  amount: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
