import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textPresets, spacing } from '../theme';
import { Button } from './Button';

interface ScreenErrorProps {
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export const ScreenError = ({ message = 'Ocurrió un error inesperado.', onRetry, onBack }: ScreenErrorProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>¡Ups!</Text>
      <Text style={styles.text}>{message}</Text>
      
      <View style={styles.actions}>
        {onRetry && <Button title="Reintentar" onPress={onRetry} style={styles.button} />}
        {onBack && <Button title="Volver" variant="outline" onPress={onBack} style={styles.button} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    ...textPresets.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  text: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
});
