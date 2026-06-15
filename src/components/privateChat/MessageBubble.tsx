import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing } from '../../theme';
import { PrivateMessage } from '../../types/privateChat';
import { toDateSafe } from '../../utils/firestoreDates';
import { MessageStatusIcon } from './MessageStatusIcon';

interface MessageBubbleProps {
  message: PrivateMessage;
  currentUserId: string;
  onDeleteMessage: () => void;
  onReportMessage: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  onDeleteMessage,
  onReportMessage,
}) => {
  const isMe = message.senderId === currentUserId;

  const dateObj = toDateSafe(message.createdAt);
  const timeStr = dateObj
    ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const handleLongPress = () => {
    Alert.alert(
      'Opciones de mensaje',
      'Elige una acción para este mensaje.',
      [
        { text: 'Eliminar para mí', onPress: onDeleteMessage, style: 'destructive' },
        !isMe ? { text: 'Reportar mensaje', onPress: onReportMessage } : undefined,
        { text: 'Cancelar', style: 'cancel' },
      ].filter(Boolean) as any
    );
  };

  if (message.hiddenByAdmin) {
    return (
      <View style={[styles.container, isMe ? styles.alignRight : styles.alignLeft]}>
        <View style={[styles.bubble, styles.systemBubble]}>
          <Text style={styles.systemText}>[Mensaje ocultado por moderación]</Text>
        </View>
      </View>
    );
  }

  if (message.status === 'deleted') {
    return (
      <View style={[styles.container, isMe ? styles.alignRight : styles.alignLeft]}>
        <View style={[styles.bubble, styles.systemBubble]}>
          <Text style={styles.systemText}>Mensaje eliminado</Text>
        </View>
      </View>
    );
  }

  const isEmojiOnly = message.type === 'emoji';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={handleLongPress}
      style={[styles.container, isMe ? styles.alignRight : styles.alignLeft]}
    >
      {isEmojiOnly ? (
        <View style={styles.emojiContainer}>
          <Text style={styles.emojiText}>{message.emoji}</Text>
          <Text style={styles.timeTextEmoji}>{timeStr}</Text>
        </View>
      ) : (
        <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
          <Text style={styles.messageText}>{message.text}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{timeStr}</Text>
            {isMe && <MessageStatusIcon status={message.status} />}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
  },
  alignLeft: {
    justifyContent: 'flex-start',
  },
  alignRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    position: 'relative',
  },
  bubbleLeft: {
    backgroundColor: colors.surfaceLight,
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  systemBubble: {
    backgroundColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  systemText: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  timeText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emojiContainer: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  emojiText: {
    fontSize: 48,
  },
  timeTextEmoji: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
