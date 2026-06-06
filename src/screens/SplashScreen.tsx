import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { colors, textPresets } from '../theme';

export const SplashScreen = ({ navigation }: any) => {
  useEffect(() => {
    if (!navigation) return;
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        <Text style={styles.logoText}>
          Party<Text style={styles.liveSpan}>Live</Text>
        </Text>
        <Text style={styles.tagline}>Conecta. Juega. Transmite.</Text>
      </View>

      <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
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
  content: {
    alignItems: 'center',
  },
  logoText: {
    ...textPresets.h1,
    fontSize: 48,
    color: colors.text,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  liveSpan: {
    color: colors.secondary,
  },
  tagline: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
    marginTop: 8,
    letterSpacing: 1.2,
  },
  loader: {
    position: 'absolute',
    bottom: 80,
  },
});
