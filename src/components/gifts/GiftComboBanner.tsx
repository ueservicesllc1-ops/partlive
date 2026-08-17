import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme';

interface GiftComboBannerProps {
  comboCount: number;
  senderName: string;
  giftName: string;
  giftEmoji?: string;
  visible: boolean;
}

export const GiftComboBanner: React.FC<GiftComboBannerProps> = ({
  comboCount,
  senderName,
  giftName,
  giftEmoji = '🎁',
  visible,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && comboCount > 1) {
      // Bounce / Pop Animation on combo increment
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.25,
            friction: 3,
            tension: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, comboCount]);

  if (!visible || comboCount <= 1) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.badge}>
        <Text style={styles.comboEmoji}>🔥</Text>
        <View style={styles.textColumn}>
          <Text style={styles.senderText} numberOfLines={1}>
            {senderName}
          </Text>
          <Text style={styles.comboText}>
            COMBO x{comboCount} {giftEmoji}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 140,
    left: 20,
    zIndex: 999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 45, 85, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  comboEmoji: {
    fontSize: 26,
    marginRight: 8,
  },
  textColumn: {
    justifyContent: 'center',
  },
  senderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFE600',
    textTransform: 'uppercase',
  },
  comboText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});
