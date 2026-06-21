import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChatMessage } from '../../types';
import { colors, spacing } from '../../theme';
import { Avatar } from '../Avatar';
import { RoomRoleBadge } from '../rooms/RoomRoleBadge';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUserId: string;
  onLongPress: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  currentUserId,
  onLongPress,
}) => {
  const isOwn = message.senderId === currentUserId;

  // 1. System Logs Render
  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  // 2. Gifts Banner Render
  if (message.type === 'gift') {
    return (
      <View style={styles.giftContainer}>
        <Text style={styles.giftText}>{message.text}</Text>
      </View>
    );
  }

  // 3. Hidden or Deleted status
  if (message.status === 'hidden') {
    return (
      <View style={styles.systemContainer}>
        <Text style={[styles.systemText, { color: '#FF1744', fontStyle: 'italic' }]}>
          Mensaje ocultado por moderación
        </Text>
      </View>
    );
  }

  if (message.status === 'deleted') {
    return (
      <View style={styles.systemContainer}>
        <Text style={[styles.systemText, { fontStyle: 'italic' }]}>
          Mensaje eliminado por el autor
        </Text>
      </View>
    );
  }

  // 4. Quick Emoji reaction Render
  if (message.type === 'emoji') {
    return (
      <TouchableOpacity
        style={[styles.emojiMessageRow, isOwn && styles.ownRow]}
        onLongPress={onLongPress}
        activeOpacity={0.8}
      >
        <Avatar source={message.senderPhotoURL} emoji="👤" size={24} />
        <View style={styles.emojiBubble}>
          <Text style={styles.emojiText}>{message.text}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // 5. Normal text message Render
  const getRoleBadge = () => {
    if (!message.senderRole) return null;
    return (
      <View style={{ transform: [{ scale: 0.85 }] }}>
        <RoomRoleBadge role={message.senderRole} />
      </View>
    );
  };

  const formattedTime = () => {
    if (!message.createdAt) return '';
    try {
      const date = typeof message.createdAt.toDate === 'function'
        ? message.createdAt.toDate()
        : new Date(message.createdAt);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.msgContainer, isOwn && styles.ownRow]}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {!isOwn && (
        <Avatar source={message.senderPhotoURL} emoji="👤" size={32} />
      )}
      
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <View style={styles.headerRow}>
          <Text style={styles.senderName}>{message.senderName}</Text>
          {getRoleBadge()}
        </View>
        
        <Text style={styles.msgText}>{message.text}</Text>
        
        <Text style={styles.timeText}>{formattedTime()}</Text>
      </View>

      {isOwn && (
        <Avatar source={message.senderPhotoURL} emoji="👤" size={32} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  msgContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  ownRow: {
    justifyContent: 'flex-end',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  ownBubble: {
    backgroundColor: '#7C4DFF',
    borderTopRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#1E1B30',
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#292440',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  badge: {
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  ownerBadge: {
    backgroundColor: colors.gold,
    color: '#000',
  },
  hostBadge: {
    backgroundColor: colors.primary,
    color: '#FFF',
  },
  modBadge: {
    backgroundColor: '#00E5FF',
    color: '#000',
  },
  speakerBadge: {
    backgroundColor: '#E0E0E0',
    color: '#000',
  },
  msgText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 8,
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  systemContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginVertical: spacing.xs,
  },
  systemText: {
    fontSize: 11,
    color: colors.accent,
    textAlign: 'center',
  },
  giftContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginVertical: spacing.xs,
    maxWidth: '90%',
  },
  giftText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gold,
    textAlign: 'center',
  },
  emojiMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  emojiBubble: {
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  emojiText: {
    fontSize: 32,
  },
});
