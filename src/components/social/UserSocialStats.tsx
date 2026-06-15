import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';

interface UserSocialStatsProps {
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
  onPressFriends?: () => void;
}

export const UserSocialStats: React.FC<UserSocialStatsProps> = ({
  followersCount,
  followingCount,
  friendsCount,
  onPressFollowers,
  onPressFollowing,
  onPressFriends,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPressFollowing} style={styles.statBox}>
        <Text style={styles.number}>{followingCount}</Text>
        <Text style={styles.label}>Siguiendo</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity onPress={onPressFollowers} style={styles.statBox}>
        <Text style={styles.number}>{followersCount}</Text>
        <Text style={styles.label}>Seguidores</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity onPress={onPressFriends} style={styles.statBox}>
        <Text style={styles.number}>{friendsCount}</Text>
        <Text style={styles.label}>Amigos</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  number: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 24,
    width: 1,
    backgroundColor: colors.border,
  },
});
export default UserSocialStats;
