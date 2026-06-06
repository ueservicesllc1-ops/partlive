import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RoomMember } from '../../types';
import { colors, spacing } from '../../theme';
import { RoomRoleBadge } from './RoomRoleBadge';
import { Avatar } from '../Avatar';

interface MicSeatCardProps {
  index: number;
  member?: RoomMember;
  onPress: () => void;
}

export const MicSeatCard: React.FC<MicSeatCardProps> = ({ index, member, onPress }) => {
  return (
    <View style={styles.seatWrapper}>
      <TouchableOpacity
        style={[
          styles.avatarContainer,
          member?.isSpeaking && styles.speakingBorder,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {member ? (
          <>
            <Avatar
              source={member.photoURL}
              emoji="👤"
              size={52}
            />
            {/* LiveKit Connected Dot */}
            <View style={styles.liveKitConnectedDot} />
          </>
        ) : (
          <View style={styles.emptySeat}>
            <Text style={styles.emptyIcon}>🎙️</Text>
          </View>
        )}

        {/* Mute Overlay Badge */}
        {member?.isMuted && (
          <View style={styles.muteBadge}>
            <Text style={styles.muteIcon}>🔇</Text>
          </View>
        )}

        {/* Role Badge (RoomRoleBadge) */}
        {member && (
          <View style={styles.roleBadgeContainer}>
            <RoomRoleBadge role={member.role} />
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.seatLabel} numberOfLines={1}>
        {member ? member.displayName : `Asiento ${index + 1}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  seatWrapper: {
    width: '23%',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  avatarContainer: {
    position: 'relative',
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C192E',
    borderWidth: 1.5,
    borderColor: '#292440',
  },
  speakingBorder: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  emptySeat: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    backgroundColor: 'rgba(41, 36, 64, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  muteBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FF1744',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#151221',
  },
  muteIcon: {
    fontSize: 9,
    color: '#FFF',
  },
  roleBadgeContainer: {
    position: 'absolute',
    top: -6,
    left: -6,
    transform: [{ scale: 0.85 }],
  },
  seatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    width: '100%',
  },
  liveKitConnectedDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00E5FF',
    borderWidth: 1,
    borderColor: '#151221',
  },
});
