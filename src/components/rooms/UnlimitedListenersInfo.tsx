import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';

export const UnlimitedListenersInfo: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📢</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Oyentes Ilimitados</Text>
        <Text style={styles.subtitle}>
          Los micrófonos son limitados, pero los oyentes pueden entrar sin límite para escuchar, chatear y enviar regalos.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#292440',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  emoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...textPresets.bodySmall,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
