import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '../../types';
import { colors, spacing } from '../../theme';
import { Avatar } from '../Avatar';

interface RoomMessageItemProps {
  message: ChatMessage;
}

export const RoomMessageItem: React.FC<RoomMessageItemProps> = ({ message }) => {
  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  if (message.type === 'gift') {
    return (
      <View style={styles.giftContainer}>
        <Text style={styles.giftText}>{message.text}</Text>
      </View>
    );
  }

  // Active or active and hidden by moderation
  if (message.status === 'hidden') {
    return (
      <View style={styles.hiddenContainer}>
        <Text style={styles.hiddenText}>Mensaje ocultado por moderación</Text>
      </View>
    );
  }

  return (
    <View style={styles.msgContainer}>
      <Avatar source={message.senderPhotoURL} emoji="👤" size={28} />
      <View style={styles.msgBubble}>
        <Text style={styles.senderName}>{message.senderName}</Text>
        <Text style={styles.msgText}>{message.text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  msgContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  msgBubble: {
    backgroundColor: '#1E1B30',
    borderRadius: 12,
    borderTopLeftRadius: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginLeft: spacing.xs,
    maxWidth: '80%',
  },
  senderName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 2,
  },
  msgText: {
    fontSize: 13,
    color: colors.text,
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
  },
  giftText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gold,
    textAlign: 'center',
  },
  hiddenContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 23, 68, 0.08)',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginVertical: spacing.xs,
  },
  hiddenText: {
    fontSize: 11,
    color: '#ff1744',
    fontStyle: 'italic',
  },
});
