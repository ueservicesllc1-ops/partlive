import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { colors } from '../../theme';

interface EmojiQuickBarProps {
  onSendEmoji: (emoji: string) => void;
  disabled?: boolean;
}

export const EmojiQuickBar: React.FC<EmojiQuickBarProps> = ({ onSendEmoji, disabled = false }) => {
  const QUICK_EMOJIS = ['❤️', '😂', '🔥', '👏', '😮', '🎉', '🙏', '💯'];

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <FlatList
        data={QUICK_EMOJIS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={item => item}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.emojiBtn}
            onPress={() => onSendEmoji(item)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 42,
    backgroundColor: '#1E1B30',
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#292440',
    marginBottom: 6,
  },
  disabled: {
    opacity: 0.5,
  },
  listContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  emojiBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  emojiText: {
    fontSize: 20,
  },
});
