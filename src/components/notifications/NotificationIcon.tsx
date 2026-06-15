import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface Props {
  type: string;
}

export const NotificationIcon: React.FC<Props> = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case 'game_invite':
        return '🎮';
      case 'live_started':
        return '📺';
      case 'room_invite':
        return '🎙️';
      case 'gift_received':
        return '🎁';
      case 'mission_completed':
      case 'mission_reward':
        return '🎯';
      case 'payout_update':
        return '💸';
      case 'vip_update':
        return '👑';
      case 'event_started':
        return '🎉';
      case 'moderation':
        return '🚨';
      case 'follow':
        return '👤';
      case 'wallet_update':
        return '💎';
      default:
        return '🔔';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'moderation':
        return colors.error + '22';
      case 'gift_received':
      case 'wallet_update':
        return colors.gold + '22';
      case 'live_started':
      case 'room_invite':
        return colors.primary + '22';
      case 'game_invite':
        return colors.accent + '22';
      default:
        return '#292440';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getColor() }]}>
      <Text style={styles.icon}>{getIcon()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
});
