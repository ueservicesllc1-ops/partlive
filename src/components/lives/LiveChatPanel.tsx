import React, { useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { LiveMessage } from '../../types/live';
import { LiveMessageItem } from './LiveMessageItem';

interface LiveChatPanelProps {
  messages: LiveMessage[];
}

export const LiveChatPanel: React.FC<LiveChatPanelProps> = ({ messages }) => {
  const flatListRef = useRef<FlatList>(null);

  // Return only non-hidden/deleted messages to normal users
  const activeMessages = messages.filter(m => m.status === 'active' || m.type === 'moderation');

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={activeMessages}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => <LiveMessageItem message={item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  listContent: {
    paddingVertical: 8,
    justifyContent: 'flex-end',
  },
});
