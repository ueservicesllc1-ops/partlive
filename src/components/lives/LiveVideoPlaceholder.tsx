import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';

interface LiveVideoPlaceholderProps {
  title?: string;
  category?: string;
}

export const LiveVideoPlaceholder: React.FC<LiveVideoPlaceholderProps> = ({ title, category }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowingCore, { opacity: pulseAnim }]} />
      <View style={styles.content}>
        <Text style={styles.emoji}>🎥</Text>
        <Text style={styles.title} numberOfLines={1}>{title || 'Live Stream'}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category || 'Conversación'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F0C1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowingCore: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary,
    position: 'absolute',
    transform: [{ scale: 1.5 }],
    filter: 'blur(60px)', // supported on React Native Web, will fall back gracefully on Mobile
    opacity: 0.5,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(21, 18, 33, 0.65)',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  title: {
    ...textPresets.bodyMedium,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.background,
  },
});
