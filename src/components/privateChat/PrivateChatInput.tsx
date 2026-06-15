import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Keyboard } from 'react-native';
import { colors, spacing } from '../../theme';
import { EmojiQuickPicker } from './EmojiQuickPicker';

interface PrivateChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSendEmoji: (emoji: string) => void;
  sending?: boolean;
}

export const PrivateChatInput: React.FC<PrivateChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onSendEmoji,
  sending = false,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleToggleEmoji = () => {
    Keyboard.dismiss();
    setShowEmojiPicker(prev => !prev);
  };

  const handleSend = () => {
    if (!value.trim()) return;
    onSend();
    setShowEmojiPicker(false);
  };

  const handleSelectEmoji = (emoji: string) => {
    onSendEmoji(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <View style={styles.outerContainer}>
      {showEmojiPicker && <EmojiQuickPicker onSelectEmoji={handleSelectEmoji} />}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.emojiToggle} onPress={handleToggleEmoji}>
          <Text style={styles.emojiToggleText}>😊</Text>
        </TouchableOpacity>
        <TextInput
          value={value}
          onChangeText={text => {
            onChangeText(text);
            if (showEmojiPicker) setShowEmojiPicker(false);
          }}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.textDark}
          style={styles.textInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!value.trim() || sending}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emojiToggle: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  emojiToggleText: {
    fontSize: 22,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxHeight: 100,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    marginLeft: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  sendButtonText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
