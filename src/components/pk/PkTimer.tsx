import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface PkTimerProps {
  timeLeft: number;
}

export const PkTimer: React.FC<PkTimerProps> = ({ timeLeft }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isLowTime = timeLeft <= 30 && timeLeft > 10;
  const isCriticalTime = timeLeft <= 10 && timeLeft > 0;

  return (
    <View style={styles.wrapper}>
      {isLowTime && (
        <Text style={styles.lowTag}>🔥 FINAL 30 SEG</Text>
      )}
      {isCriticalTime && (
        <Text style={styles.criticalText}>{timeLeft}</Text>
      )}

      <View style={[
        styles.container,
        isLowTime && styles.lowTimeContainer,
        isCriticalTime && styles.criticalContainer,
      ]}>
        <Text style={[
          styles.timerText,
          isLowTime && styles.lowTimeText,
          isCriticalTime && styles.criticalTimerText,
        ]}>
          ⏱️ {formatTime(timeLeft)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
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
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 149, 0, 0.4)',
  },
  criticalContainer: {
    borderColor: '#FF2D55',
    backgroundColor: 'rgba(255, 45, 85, 0.7)',
  },
  timerText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  lowTimeText: {
    color: '#FFD700',
  },
  criticalTimerText: {
    color: '#FFF',
    fontSize: 14,
  },
  lowTag: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 2,
  },
  criticalText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF2D55',
    textShadowColor: '#000',
    textShadowRadius: 6,
    marginVertical: 2,
  },
});
