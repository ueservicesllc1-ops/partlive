import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';
import { formatCoins } from '../../utils/formatNumbers';

interface LiveGiftGoalCardProps {
  goalTitle?: string;
  targetDiamonds: number;
  currentDiamonds: number;
  onPressHostGoalConfig?: () => void;
  isHost?: boolean;
}

export const LiveGiftGoalCard: React.FC<LiveGiftGoalCardProps> = ({
  goalTitle = '🎯 Meta del Live',
  targetDiamonds,
  currentDiamonds,
  onPressHostGoalConfig,
  isHost = false,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  const percentage = Math.min(100, Math.floor((currentDiamonds / Math.max(1, targetDiamonds)) * 100));

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  if (targetDiamonds <= 0) {
    if (isHost && onPressHostGoalConfig) {
      return (
        <TouchableOpacity style={styles.emptyContainer} onPress={onPressHostGoalConfig} activeOpacity={0.8}>
          <Text style={styles.emptyText}>🎯 Configurar Meta de Regalos del Live</Text>
        </TouchableOpacity>
      );
    }
    return null;
  }

  const isCompleted = percentage >= 100;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={isHost ? 0.8 : 1}
      onPress={isHost ? onPressHostGoalConfig : undefined}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {goalTitle}
        </Text>
        <Text style={styles.values}>
          💎 {formatCoins(currentDiamonds)} / {formatCoins(targetDiamonds)} ({percentage}%)
        </Text>
      </View>

      {/* Progress Bar Background */}
      <View style={styles.progressBackground}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: isCompleted ? '#4CD964' : colors.accent,
            },
          ]}
        />
      </View>

      {isCompleted && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>🎉 ¡META COMPLETADA!</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 22, 46, 0.85)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
    marginVertical: 6,
  },
  emptyContainer: {
    backgroundColor: 'rgba(138, 79, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    marginHorizontal: 16,
    marginVertical: 6,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    marginRight: 8,
  },
  values: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
  },
  progressBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completedBadge: {
    marginTop: 4,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4CD964',
    letterSpacing: 0.5,
  },
});
