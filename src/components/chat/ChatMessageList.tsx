import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { ChatMessage } from '../../types';
import { ChatMessageItem } from './ChatMessageItem';
import { colors, spacing } from '../../theme';

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  onLoadOlder: () => void;
  onMessageLongPress: (message: ChatMessage) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentUserId,
  onLoadOlder,
  onMessageLongPress,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Group messages or filter out blocked users (handled at higher level or hook)
  const renderItem = ({ item }: { item: ChatMessage }) => {
    return (
      <ChatMessageItem
        message={item}
        currentUserId={currentUserId}
        onLongPress={() => onMessageLongPress(item)}
      />
    );
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // FlatList inverted: scroll up increases offsetY, scroll down decreases to 0 (bottom of chat)
    if (offsetY > 300) {
      setShowScrollBottomBtn(true);
    } else {
      setShowScrollBottomBtn(false);
    }
  };

  const scrollToEnd = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <View style={styles.container}>
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🎉 ¡Comienza el chat de la sala!</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            inverted
            onScroll={handleScroll}
            onEndReached={onLoadOlder}
            onEndReachedThreshold={0.2}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {showScrollBottomBtn && (
            <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToEnd} activeOpacity={0.8}>
              <Text style={styles.scrollTopText}>⬇️ Ver nuevos</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingVertical: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  scrollTopBtn: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scrollTopText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
