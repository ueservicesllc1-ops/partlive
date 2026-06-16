import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { colors, spacing } from '../../theme';

export interface GlobalGiftBannerData {
  id: string;
  senderName: string;
  receiverName: string;
  giftName: string;
  giftIconEmoji?: string;
}

interface GlobalGiftBannerProps {
  banner: GlobalGiftBannerData;
  onDismiss: (id: string) => void;
}

const { width } = Dimensions.get('window');

export const GlobalGiftBanner: React.FC<GlobalGiftBannerProps> = ({
  banner,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current; // Start above screen
  const marqueeAnim = useRef(new Animated.Value(width)).current; // Start on right side

  useEffect(() => {
    // 1. Slide banner down from top
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 25,
      friction: 6,
    }).start();

    // 2. Continuous text scroll (marquee)
    Animated.loop(
      Animated.timing(marqueeAnim, {
        toValue: -width - 200,
        duration: 5500,
        useNativeDriver: true,
      })
    ).start();

    // 3. Auto dismiss after 6 seconds
    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onDismiss(banner.id);
      });
    }, 6000);

    return () => clearTimeout(timer);
  }, [banner, onDismiss, slideAnim, marqueeAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.gradientBorder}>
        <View style={styles.bannerContent}>
          <Animated.Text
            style={[
              styles.marqueeText,
              {
                transform: [{ translateX: marqueeAnim }],
              },
            ]}
            numberOfLines={1}
          >
            ✨ ¡¡REGALO LEGENDARIO!! <Text style={styles.sender}>{banner.senderName.toUpperCase()}</Text> le envió un{' '}
            <Text style={styles.gift}>{banner.giftName.toUpperCase()}</Text> a{' '}
            <Text style={styles.receiver}>{banner.receiverName.toUpperCase()}</Text> {banner.giftIconEmoji || '🐉'} ✨
          </Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Below header
    left: spacing.md,
    right: spacing.md,
    height: 42,
    zIndex: 9999,
  },
  gradientBorder: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#FF1744', // Hot neon pink backdrop
    padding: 1.5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerContent: {
    flex: 1,
    backgroundColor: '#0B0813', // Deep dark backdrop inside
    borderRadius: 18.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  marqueeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
    width: width + 200,
    position: 'absolute',
  },
  sender: {
    color: colors.accent,
  },
  receiver: {
    color: colors.secondary,
  },
  gift: {
    color: colors.gold,
    fontWeight: '900',
  },
});
