import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors, spacing } from '../../theme';

interface LiveInputBarProps {
  onSendMessage: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const LiveInputBar: React.FC<LiveInputBarProps> = ({
  onSendMessage,
  placeholder = 'Di algo en el chat...',
  disabled = false,
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={disabled ? 'Chat deshabilitado' : placeholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={text}
        onChangeText={setText}
        editable={!disabled}
        onSubmitEditing={handleSend}
        returnKeyType="send"
      />
      {text.trim().length > 0 && (
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    flex: 1,
    height: 44,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  sendText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.background,
  },
});
