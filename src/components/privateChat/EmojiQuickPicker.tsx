import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface EmojiQuickPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

const QUICK_EMOJIS = ['👋', '❤️', '🔥', '😂', '😮', '👏', '🎉', '🌟', '🚀', '💯'];

export const EmojiQuickPicker: React.FC<EmojiQuickPickerProps> = ({ onSelectEmoji }) => {
  return (
    <View style={styles.container}>
      {QUICK_EMOJIS.map(emoji => (
        <TouchableOpacity
          key={emoji}
          onPress={() => onSelectEmoji(emoji)}
          style={styles.emojiButton}
        >
          <Text style={styles.emojiText}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emojiButton: {
    padding: spacing.xs,
  },
  emojiText: {
    fontSize: 24,
  },
});
