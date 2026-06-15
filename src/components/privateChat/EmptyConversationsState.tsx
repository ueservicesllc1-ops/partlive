import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';

interface EmptyConversationsStateProps {
  onPressDiscover?: () => void;
}

export const EmptyConversationsState: React.FC<EmptyConversationsStateProps> = ({ onPressDiscover }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💬</Text>
      <Text style={styles.title}>Bandeja vacía</Text>
      <Text style={styles.description}>
        No tienes conversaciones activas en este momento. ¡Busca amigos o creadores interesantes y chatea con ellos!
      </Text>
      {onPressDiscover && (
        <TouchableOpacity style={styles.button} onPress={onPressDiscover}>
          <Text style={styles.buttonText}>Descubrir personas</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
