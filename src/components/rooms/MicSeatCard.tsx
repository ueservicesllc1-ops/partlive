import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { RoomMember } from '../../types';
import { colors, spacing } from '../../theme';
import { RoomRoleBadge } from './RoomRoleBadge';
import { Avatar } from '../Avatar';

interface MicSeatCardProps {
  index: number;
  member?: RoomMember;
  locked?: boolean;
  onPress: () => void;
}

const SpeakingPulse: React.FC = () => {
  const scaleAnim1 = React.useRef(new Animated.Value(1)).current;
  const opacityAnim1 = React.useRef(new Animated.Value(0.6)).current;
  const scaleAnim2 = React.useRef(new Animated.Value(1)).current;
  const opacityAnim2 = React.useRef(new Animated.Value(0.6)).current;

  React.useEffect(() => {
    const pulse1 = Animated.loop(
      Animated.parallel([
        Animated.timing(scaleAnim1, {
          toValue: 1.6,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacityAnim1, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim1, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const pulse2 = Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.parallel([
          Animated.timing(scaleAnim2, {
            toValue: 1.6,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacityAnim2, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim2, {
              toValue: 0,
              duration: 1600,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );

    pulse1.start();
    pulse2.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
    };
  }, [scaleAnim1, opacityAnim1, scaleAnim2, opacityAnim2]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.pulseCircle,
          {
            transform: [{ scale: scaleAnim1 }],
            opacity: opacityAnim1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.pulseCircle,
          {
            transform: [{ scale: scaleAnim2 }],
            opacity: opacityAnim2,
          },
        ]}
      />
    </View>
  );
};

const VolumeEqualizer: React.FC = () => {
  const anim1 = React.useRef(new Animated.Value(0.2)).current;
  const anim2 = React.useRef(new Animated.Value(0.2)).current;
  const anim3 = React.useRef(new Animated.Value(0.2)).current;

  React.useEffect(() => {
    const createBarAnimation = (anim: Animated.Value, maxVal: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxVal,
            duration: duration,
            easing: Easing.bezier(0.25, 0.8, 0.25, 1),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.2,
            duration: duration * 0.9,
            easing: Easing.bezier(0.25, 0.8, 0.25, 1),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const a1 = createBarAnimation(anim1, 1.0, 260);
    const a2 = createBarAnimation(anim2, 1.0, 365);
    const a3 = createBarAnimation(anim3, 1.0, 210);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [anim1, anim2, anim3]);

  return (
    <View style={styles.equalizerContainer}>
      <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: anim1 }] }]} />
      <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: anim2 }] }]} />
      <Animated.View style={[styles.equalizerBar, { transform: [{ scaleY: anim3 }] }]} />
    </View>
  );
};

export const MicSeatCard: React.FC<MicSeatCardProps> = ({ index, member, locked, onPress }) => {
  const isSpeaking = member?.isSpeaking;

  return (
    <View style={styles.seatWrapper}>
      <View style={styles.avatarWrapper}>
        {isSpeaking && <SpeakingPulse />}
        <TouchableOpacity
          style={[
            styles.avatarContainer,
            isSpeaking && styles.speakingBorder,
            (!member && locked) && styles.lockedBorder,
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

              {/* Volume equalizer when speaking */}
              {isSpeaking && <VolumeEqualizer />}
            </>
          ) : (
            <View style={[styles.emptySeat, locked && styles.lockedSeat]}>
              <Text style={styles.emptyIcon}>{locked ? '🔒' : '🎙️'}</Text>
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
      </View>

      <Text style={styles.seatLabel} numberOfLines={1}>
        {member ? member.displayName : locked ? 'Bloqueado' : `Asiento ${index + 1}`}
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
  avatarWrapper: {
    position: 'relative',
    width: 58,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
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
  lockedBorder: {
    borderColor: '#FF1744',
  },
  pulseCircle: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    zIndex: -1,
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
  lockedSeat: {
    backgroundColor: 'rgba(255, 23, 68, 0.12)',
    borderStyle: 'solid',
    borderColor: '#FF1744',
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
  equalizerContainer: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C192E',
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#00E676', // Neon green border when speaking!
    height: 18,
    width: 28,
    zIndex: 10,
    elevation: 3,
  },
  equalizerBar: {
    width: 3,
    height: 10,
    backgroundColor: '#00E676', // Neon green bars
    marginHorizontal: 1,
    borderRadius: 1,
  },
});
