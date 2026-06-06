import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LiveMessage } from '../../types/live';
import { colors, spacing } from '../../theme';

interface LiveMessageItemProps {
  message: LiveMessage;
}

export const LiveMessageItem: React.FC<LiveMessageItemProps> = ({ message }) => {
  const getRoleColor = (role?: string) => {
    if (role === 'host') return colors.accent;
    if (role === 'moderator') return '#00E5FF';
    return '#E0E0E0';
  };

  const getRolePrefix = (role?: string) => {
    if (role === 'host') return '👑 ';
    if (role === 'moderator') return '🛡️ ';
    return '';
  };

  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  if (message.type === 'gift') {
    const meta = message.metadata || {};
    return (
      <View style={styles.giftContainer}>
        <Text style={styles.giftText}>
          🎁 <Text style={styles.boldText}>{message.senderName}</Text> envió{' '}
          <Text style={styles.giftAccent}>{meta.quantity}x {meta.giftName}</Text>{' '}
          a <Text style={styles.boldText}>{meta.receiverName}</Text> {meta.giftIconUrl || '🎁'}
        </Text>
      </View>
    );
  }

  if (message.type === 'moderation') {
    return (
      <View style={styles.moderationContainer}>
        <Text style={styles.moderationText}>⚠️ {message.text}</Text>
      </View>
    );
  }

  return (
    <View style={styles.messageBubble}>
      <Text style={styles.messageText}>
        <Text style={[styles.senderName, { color: getRoleColor(message.senderRole) }]}>
          {getRolePrefix(message.senderRole)}
          {message.senderName}:{' '}
        </Text>
        <Text style={message.type === 'emoji' ? styles.emojiText : styles.bodyText}>
          {message.text}
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    maxWidth: '85%',
  },
  messageText: {
    fontSize: 12,
    lineHeight: 16,
  },
  senderName: {
    fontWeight: 'bold',
  },
  bodyText: {
    color: '#FFF',
  },
  emojiText: {
    fontSize: 20,
  },
  systemContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 4,
  },
  systemText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  giftContainer: {
    backgroundColor: 'rgba(233, 30, 99, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(233, 30, 99, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    maxWidth: '85%',
  },
  giftText: {
    fontSize: 12,
    color: '#FFF',
    lineHeight: 16,
  },
  giftAccent: {
    color: '#FF4081',
    fontWeight: 'bold',
  },
  boldText: {
    fontWeight: 'bold',
  },
  moderationContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  moderationText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: 'bold',
  },
});
