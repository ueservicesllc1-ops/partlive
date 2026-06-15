import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { PrivateConversation } from '../../types/privateChat';
import { UserProfile } from '../../types/user';
import { getUserProfile } from '../../services/firebase/firestore/usersService';
import { Avatar } from '../Avatar';
import { formatLastMessage } from '../../utils/privateChat';
import { toDateSafe } from '../../utils/firestoreDates';

interface ConversationListItemProps {
  conversation: PrivateConversation;
  currentUserId: string;
  onPress: () => void;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  currentUserId,
  onPress,
}) => {
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);

  const otherUserId = conversation.participantAId === currentUserId
    ? conversation.participantBId
    : conversation.participantAId;

  const unreadCount = conversation.unreadCounts?.[currentUserId] || 0;
  const isMuted = conversation.mutedBy && conversation.mutedBy.includes(currentUserId);

  useEffect(() => {
    let active = true;
    getUserProfile(otherUserId).then(profile => {
      if (profile && active) {
        setOtherUser(profile);
      }
    });
    return () => {
      active = false;
    };
  }, [otherUserId]);

  const dateObj = toDateSafe(conversation.lastMessageAt);
  const timeStr = dateObj
    ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Avatar
        source={otherUser?.photoURL}
        size={52}
        isLive={false}
        level={otherUser?.level}
      />
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {otherUser?.displayName || otherUser?.username || 'Usuario'}
          </Text>
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>
        <View style={styles.bodyRow}>
          <Text style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
            {formatLastMessage(conversation as any)}
          </Text>
          <View style={styles.badges}>
            {isMuted && <Text style={styles.muteIcon}>🔇</Text>}
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contentContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  displayName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadMessage: {
    color: colors.text,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muteIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
