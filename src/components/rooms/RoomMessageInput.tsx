import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text } from 'react-native';
import { colors, spacing } from '../../theme';

interface RoomMessageInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
}

export const RoomMessageInput: React.FC<RoomMessageInputProps> = ({ onSend, placeholder = 'Di algo lindo...' }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim().length === 0) return;
    if (text.length > 300) return; // Limit characters
    onSend(text);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        maxLength={300}
      />
      <TouchableOpacity
        style={[styles.sendButton, text.trim().length === 0 && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={text.trim().length === 0}
        activeOpacity={0.8}
      >
        <Text style={styles.sendIcon}>🚀</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B30',
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#292440',
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(41, 36, 64, 0.6)',
  },
  sendIcon: {
    fontSize: 16,
  },
});
