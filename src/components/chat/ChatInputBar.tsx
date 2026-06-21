import React, { useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { colors, spacing } from '../../theme';

interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  text: string;
  onChangeText: (text: string) => void;
  onTogglePicker: () => void;
  showPicker: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Escribe un mensaje...',
  text,
  onChangeText,
  onTogglePicker,
  showPicker,
}) => {
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (disabled || text.trim().length === 0) return;
    onSend(text);
  };

  const handleToggle = () => {
    if (showPicker) {
      onTogglePicker();
      inputRef.current?.focus();
    } else {
      Keyboard.dismiss();
      onTogglePicker();
    }
  };

  const handleFocus = () => {
    if (showPicker) {
      onTogglePicker();
    }
  };

  const isNearLimit = text.length > 250;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.keyboardView}
    >
      <View style={[styles.container, disabled && styles.disabledContainer]}>
        {/* Toggle Picker Button */}
        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={handleToggle}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleIcon}>{showPicker ? '⌨️' : '😊'}</Text>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={[styles.input, { maxHeight: 100 }]}
          placeholder={disabled ? 'Chat deshabilitado' : placeholder}
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={onChangeText}
          maxLength={300}
          multiline
          editable={!disabled}
          onFocus={handleFocus}
        />
        
        {isNearLimit && (
          <Text style={styles.counter}>{300 - text.length}</Text>
        )}

        <TouchableOpacity
          style={[styles.sendBtn, (disabled || text.trim().length === 0) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={disabled || text.trim().length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.sendIcon}>🚀</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    width: '100%',
  },
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
  disabledContainer: {
    opacity: 0.5,
    backgroundColor: '#151221',
  },
  toggleBtn: {
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  toggleIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 8,
  },
  counter: {
    fontSize: 10,
    color: colors.secondary,
    marginRight: 6,
    fontWeight: 'bold',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(41, 36, 64, 0.6)',
  },
  sendIcon: {
    fontSize: 15,
  },
});
