import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, textPresets } from '../theme';

interface ScreenLoadingProps {
  message?: string;
}

export const ScreenLoading = ({ message = 'Cargando...' }: ScreenLoadingProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
    marginTop: 16,
  },
});
