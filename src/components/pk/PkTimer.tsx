import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface PkTimerProps {
  timeLeft: number;
}

export const PkTimer: React.FC<PkTimerProps> = ({ timeLeft }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isLowTime = timeLeft < 30;

  return (
    <View style={[styles.container, isLowTime && styles.lowTimeContainer]}>
      <Text style={[styles.timerText, isLowTime && styles.lowTimeText]}>
        {formatTime(timeLeft)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lowTimeContainer: {
    borderColor: colors.secondary,
    backgroundColor: 'rgba(255, 51, 102, 0.2)',
  },
  timerText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  lowTimeText: {
    color: colors.secondary,
  },
});
