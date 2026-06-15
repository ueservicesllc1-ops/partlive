import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../../theme';

interface GameTimerProps {
  seconds: number;
  onExpire?: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GameTimer: React.FC<GameTimerProps> = ({
  seconds,
  onExpire,
  color = colors.accent,
  size = 'md',
}) => {
  const [remaining, setRemaining] = useState(seconds);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);

  // Pulse when ≤ 5 seconds
  useEffect(() => {
    if (remaining <= 5 && remaining > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [remaining]);

  const urgentColor = remaining <= 5 ? colors.error : remaining <= 10 ? colors.warning : color;

  const fontSize =
    size === 'sm' ? 20 : size === 'lg' ? 48 : 32;
  const boxSize =
    size === 'sm' ? 36 : size === 'lg' ? 80 : 56;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: boxSize / 2,
          borderColor: urgentColor,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <Text style={[styles.text, { color: urgentColor, fontSize }]}>{remaining}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  text: { fontWeight: '700' },
});
