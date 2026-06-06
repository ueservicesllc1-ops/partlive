import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RoomRole } from '../../constants/roomPermissions';
import { colors } from '../../theme';

interface RoomRoleBadgeProps {
  role: RoomRole;
}

export const RoomRoleBadge: React.FC<RoomRoleBadgeProps> = ({ role }) => {
  const getBadgeStyle = () => {
    switch (role) {
      case 'owner':
        return [styles.badge, styles.owner];
      case 'host':
        return [styles.badge, styles.host];
      case 'moderator':
        return [styles.badge, styles.moderator];
      case 'speaker':
        return [styles.badge, styles.speaker];
      default:
        return [styles.badge, styles.listener];
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'host':
        return 'Host';
      case 'moderator':
        return 'Mod';
      case 'speaker':
        return 'Speaker';
      default:
        return 'Oyente';
    }
  };

  return (
    <View style={getBadgeStyle()}>
      <Text style={styles.badgeText}>{getRoleLabel()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
  },
  owner: {
    backgroundColor: colors.gold,
  },
  host: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 0.5,
  },
  moderator: {
    backgroundColor: '#00E5FF',
  },
  speaker: {
    backgroundColor: '#E0E0E0',
  },
  listener: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
