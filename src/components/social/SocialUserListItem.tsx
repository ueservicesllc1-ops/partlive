import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { UserProfile } from '../../types/user';
import { FollowButton } from './FollowButton';
import { useFollow } from '../../hooks/useFollow';
import auth from '@react-native-firebase/auth';

interface SocialUserListItemProps {
  user: UserProfile;
  onPressProfile: () => void;
}

export const SocialUserListItem: React.FC<SocialUserListItemProps> = ({ user, onPressProfile }) => {
  const currentUserId = auth().currentUser?.uid || '';
  const { isFollowing, toggleFollow, actionLoading } = useFollow(user.uid);
  const isMe = currentUserId === user.uid;

  return (
    <TouchableOpacity onPress={onPressProfile} style={styles.container}>
      {user.photoURL ? (
        <Image source={{ uri: user.photoURL }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {user.displayName}
          </Text>
          {user.isVip && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>VIP</Text>
            </View>
          )}
          {user.isHost && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostText}>HOST</Text>
            </View>
          )}
        </View>
        <Text style={styles.username} numberOfLines={1}>
          @{user.username || 'usuario'}
        </Text>
      </View>

      {!isMe && (
        <FollowButton
          isFollowing={isFollowing}
          onPress={toggleFollow}
          loading={actionLoading}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  displayName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: spacing.xs,
  },
  username: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  vipBadge: {
    backgroundColor: colors.gold,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: spacing.xs,
  },
  vipText: {
    color: colors.background,
    fontSize: 8,
    fontWeight: 'bold',
  },
  hostBadge: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  hostText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
export default SocialUserListItem;
