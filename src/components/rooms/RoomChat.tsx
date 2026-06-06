import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { ChatMessage } from '../../types';
import { RoomMessageItem } from './RoomMessageItem';
import { colors, spacing } from '../../theme';

interface RoomChatProps {
  messages: ChatMessage[];
}

export const RoomChat: React.FC<RoomChatProps> = ({ messages }) => {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Autoscroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <View style={styles.container}>
      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <Text style={styles.welcomeText}>🎙️ ¡Bienvenidos a la sala! Envía un mensaje para saludar.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <RoomMessageItem message={item} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(21, 18, 33, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292440',
    padding: spacing.sm,
    height: 180,
    marginVertical: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  welcomeText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
