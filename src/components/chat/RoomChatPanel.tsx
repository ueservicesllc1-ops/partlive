import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { ChatMessage, RoomMember } from '../../types';
import { RoomRole } from '../../constants/roomPermissions';
import { ChatMessageList } from './ChatMessageList';
import { EmojiQuickBar } from './EmojiQuickBar';
import { ChatInputBar } from './ChatInputBar';
import { ChatModerationMenu } from './ChatModerationMenu';
import { colors, spacing } from '../../theme';
import { checkChatRateLimit } from '../../utils/chatRateLimit';
import { validateChatText } from '../../utils/chatValidation';

interface RoomChatPanelProps {
  roomId: string;
  currentUserId: string;
  currentMember: RoomMember | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onSendEmoji: (emoji: string) => Promise<void>;
  onLoadOlder: () => void;
  onHideMessage: (messageId: string, reason: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onReportMessage: (messageId: string, reason: string) => Promise<void>;
  onBlockUser: (targetUserId: string) => Promise<void>;
  onKickMember?: (targetUserId: string) => Promise<void>;
  canModerate: boolean;
  actorRole: RoomRole | null;
  disabled?: boolean;
}

export const RoomChatPanel: React.FC<RoomChatPanelProps> = ({
  roomId,
  currentUserId,
  currentMember,
  messages,
  onSendMessage,
  onSendEmoji,
  onLoadOlder,
  onHideMessage,
  onDeleteMessage,
  onReportMessage,
  onBlockUser,
  onKickMember,
  canModerate,
  actorRole,
  disabled = false,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | undefined>(undefined);
  const [menuVisible, setMenuVisible] = useState(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);

  const handleSendMessage = async (text: string) => {
    // 1. Enforce rate limiting local checks
    const rateLimit = checkChatRateLimit(currentUserId, false);
    if (!rateLimit.allowed) {
      Alert.alert('Calma', `Estás enviando mensajes muy rápido. Espera ${rateLimit.waitSeconds}s.`);
      return;
    }

    // 2. Validate content sanitization, URLs, and words
    const validation = validateChatText(text);
    if (!validation.valid) {
      Alert.alert('Mensaje bloqueado', validation.reason);
      return;
    }

    setOfflineError(null);
    try {
      await onSendMessage(text);
    } catch (e: any) {
      setOfflineError('No se pudo enviar el mensaje.');
    }
  };

  const handleSendEmoji = async (emoji: string) => {
    const rateLimit = checkChatRateLimit(currentUserId, true);
    if (!rateLimit.allowed) {
      Alert.alert('Calma', `Estás enviando reacciones muy rápido. Espera ${rateLimit.waitSeconds}s.`);
      return;
    }

    setOfflineError(null);
    try {
      await onSendEmoji(emoji);
    } catch (e: any) {
      setOfflineError('No se pudo enviar el emoji.');
    }
  };

  const handleLongPress = (msg: ChatMessage) => {
    if (disabled) return;
    setSelectedMessage(msg);
    setMenuVisible(true);
  };

  return (
    <View style={styles.container}>
      {offlineError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {offlineError}</Text>
        </View>
      )}

      {/* Message Stream list */}
      <ChatMessageList
        messages={messages}
        currentUserId={currentUserId}
        onLoadOlder={onLoadOlder}
        onMessageLongPress={handleLongPress}
      />

      {/* Quick Emojis feedback bar */}
      <EmojiQuickBar onSendEmoji={handleSendEmoji} disabled={disabled || !currentMember} />

      {/* TextInput compose row */}
      <ChatInputBar onSend={handleSendMessage} disabled={disabled || !currentMember} />

      {/* Message action sheet options */}
      {selectedMessage && (
        <ChatModerationMenu
          isVisible={menuVisible}
          message={selectedMessage}
          currentUserId={currentUserId}
          canModerate={canModerate}
          onClose={() => setMenuVisible(false)}
          onDeleteMessage={() => onDeleteMessage(selectedMessage.id)}
          onHideMessage={reason => onHideMessage(selectedMessage.id, reason)}
          onReportMessage={reason => onReportMessage(selectedMessage.id, reason)}
          onBlockUser={() => onBlockUser(selectedMessage.senderId)}
          onKickMember={
            onKickMember ? () => onKickMember(selectedMessage.senderId) : undefined
          }
          actorRole={actorRole}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorBanner: {
    backgroundColor: '#FF1744',
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 4,
  },
  errorText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
