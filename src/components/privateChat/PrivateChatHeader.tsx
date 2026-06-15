import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { UserProfile } from '../../types/user';
import { Avatar } from '../Avatar';

interface PrivateChatHeaderProps {
  otherUser: UserProfile | null;
  onBack: () => void;
  onViewProfile: () => void;
  onOptions: () => void;
}

export const PrivateChatHeader: React.FC<PrivateChatHeaderProps> = ({
  otherUser,
  onBack,
  onViewProfile,
  onOptions,
}) => {
  const isOnline = otherUser?.showOnlineStatus; // Simplified online check

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.profileClick} onPress={onViewProfile}>
        <Avatar source={otherUser?.photoURL} size={40} level={otherUser?.level} />
        <View style={styles.userInfo}>
          <Text style={styles.displayName} numberOfLines={1}>
            {otherUser?.displayName || otherUser?.username || 'Usuario'}
          </Text>
          <Text style={styles.statusText}>
            {isOnline ? '🟢 En línea' : 'offline'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionsButton} onPress={onOptions}>
        <Text style={styles.optionsText}>⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  backText: {
    fontSize: 24,
    color: colors.text,
  },
  profileClick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  userInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  displayName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  optionsButton: {
    padding: spacing.sm,
  },
  optionsText: {
    fontSize: 22,
    color: colors.text,
  },
});
