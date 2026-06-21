import React, { useEffect, useState, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme';

interface GiftEventData {
  id: string;
  giftId: string;
  giftName: string;
  giftIconUrl?: string; // Emoji
  animationType: 'small' | 'medium' | 'big' | 'global';
  quantity: number;
}

interface GiftAnimationLayerProps {
  lastGiftEvent: GiftEventData | null;
}

const { width, height } = Dimensions.get('window');

interface ActiveAnimation {
  id: string;
  type: 'small' | 'medium' | 'big' | 'global';
  emoji: string;
  quantity: number;
}

export const GiftAnimationLayer: React.FC<GiftAnimationLayerProps> = ({
  lastGiftEvent,
}) => {
  const [activeAnims, setActiveAnims] = useState<ActiveAnimation[]>([]);

  useEffect(() => {
    if (lastGiftEvent) {
      const newAnim: ActiveAnimation = {
        id: lastGiftEvent.id + '_' + Date.now(),
        type: lastGiftEvent.animationType || 'small',
        emoji: lastGiftEvent.giftIconUrl || '🎁',
        quantity: lastGiftEvent.quantity || 1,
      };
      
      setActiveAnims((prev) => [...prev, newAnim]);
    }
  }, [lastGiftEvent]);

  const handleFinish = (id: string) => {
    setActiveAnims((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <View style={styles.overlay} pointerEvents="none">
      {activeAnims.map((anim) => {
        if (anim.type === 'small') {
          return (
            <SmallGiftAnimation
              key={anim.id}
              anim={anim}
              onFinish={() => handleFinish(anim.id)}
            />
          );
        }
        if (anim.type === 'medium') {
          return (
            <MediumGiftAnimation
              key={anim.id}
              anim={anim}
              onFinish={() => handleFinish(anim.id)}
            />
          );
        }
        if (anim.type === 'big') {
          return (
            <BigGiftAnimation
              key={anim.id}
              anim={anim}
              onFinish={() => handleFinish(anim.id)}
            />
          );
        }
        if (anim.type === 'global') {
          return (
            <GlobalGiftAnimation
              key={anim.id}
              anim={anim}
              onFinish={() => handleFinish(anim.id)}
            />
          );
        }
        return null;
      })}
    </View>
  );
};

// ─── Small Gift Animation (floating bubble hearts/roses) ───
interface SubAnimProps {
  anim: ActiveAnimation;
  onFinish: () => void;
}

const SmallGiftAnimation: React.FC<SubAnimProps> = ({ anim, onFinish }) => {
  // Float several particles
  const count = Math.min(anim.quantity * 3, 12);
  const particles = Array.from({ length: count }).map((_, i) => ({
    id: `${anim.id}_p_${i}`,
    delay: i * 120,
    startX: width * 0.7 + (Math.random() * 60 - 30), // Bottom right cluster
  }));

  const [finishedCount, setFinishedCount] = useState(0);

  const handleParticleFinish = () => {
    setFinishedCount((prev) => {
      const next = prev + 1;
      if (next >= count) {
        onFinish();
      }
      return next;
    });
  };

  return (
    <>
      {particles.map((p) => (
        <FloatingParticle
          key={p.id}
          emoji={anim.emoji}
          delay={p.delay}
          startX={p.startX}
          onFinish={handleParticleFinish}
        />
      ))}
    </>
  );
};

interface ParticleProps {
  emoji: string;
  delay: number;
  startX: number;
  onFinish: () => void;
}

const FloatingParticle: React.FC<ParticleProps> = ({
  emoji,
  delay,
  startX,
  onFinish,
}) => {
  const yAnim = useRef(new Animated.Value(height * 0.85)).current;
  const xAnim = useRef(new Animated.Value(startX)).current;
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Generate drift patterns
    const driftValue = Math.random() * 80 - 40;
    
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        // Float up
        Animated.timing(yAnim, {
          toValue: height * 0.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        // Drifting left/right
        Animated.timing(xAnim, {
          toValue: startX + driftValue,
          duration: 2000,
          useNativeDriver: true,
        }),
        // Fade in and out
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1700,
            useNativeDriver: true,
          }),
        ]),
        // Scale pulse
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.Text
      style={[
        styles.particle,
        {
          transform: [
            { translateX: xAnim },
            { translateY: yAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
};

// ─── Medium Gift Animation (glowing center bounce) ───
const MediumGiftAnimation: React.FC<SubAnimProps> = ({ anim, onFinish }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 2,
          useNativeDriver: true,
          tension: 40,
          friction: 5,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Stay on screen
      Animated.delay(1000),
      // Fade out
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <Animated.View
      style={[
        styles.centerContainer,
        {
          transform: [{ scale }, { rotate: spin }],
          opacity,
        },
      ]}
    >
      <View style={styles.glowBg}>
        <Text style={styles.mediumEmoji}>{anim.emoji}</Text>
        <Text style={styles.giftBadge}>x{anim.quantity}</Text>
      </View>
    </Animated.View>
  );
};

// ─── Big Gift Animation (sports car slides across screen) ───
const BigGiftAnimation: React.FC<SubAnimProps> = ({ anim, onFinish }) => {
  const xAnim = useRef(new Animated.Value(-150)).current;
  const yAnim = useRef(new Animated.Value(height * 0.45)).current;
  const scaleAnim = useRef(new Animated.Value(1.5)).current;

  useEffect(() => {
    // Slide fast, slow down in center, then accelerate out
    Animated.sequence([
      Animated.timing(xAnim, {
        toValue: width * 0.4,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 2.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(yAnim, {
          toValue: height * 0.42,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(xAnim, {
          toValue: width + 200,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.bigContainer,
        {
          transform: [
            { translateX: xAnim },
            { translateY: yAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Text style={styles.bigEmoji}>{anim.emoji}</Text>
      <View style={styles.sparkleCloud}>
        <Text style={styles.sparkleText}>💨 ✨ SPEED ✨ 💨</Text>
      </View>
    </Animated.View>
  );
};

// ─── Global/Legendary Gift Animation (giant shake and sparkles) ───
const GlobalGiftAnimation: React.FC<SubAnimProps> = ({ anim, onFinish }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide and grow, then shake screen
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 4,
          useNativeDriver: true,
          tension: 30,
          friction: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      // Screen shake pattern
      Animated.sequence([
        Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.globalContainer,
        {
          transform: [
            { scale },
            { translateX: shake },
          ],
          opacity,
        },
      ]}
    >
      <View style={styles.legendaryGlow}>
        <Text style={styles.legendaryEmoji}>{anim.emoji}</Text>
        <Text style={styles.legendaryTitle}>✨ LEGENDARY ✨</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
  },
  centerContainer: {
    position: 'absolute',
    top: height * 0.4,
    left: width * 0.45,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBg: {
    padding: 12,
    backgroundColor: 'rgba(255, 235, 59, 0.15)',
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediumEmoji: {
    fontSize: 32,
  },
  giftBadge: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFF',
    backgroundColor: colors.secondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: -4,
  },
  bigContainer: {
    position: 'absolute',
    left: 0,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigEmoji: {
    fontSize: 48,
  },
  sparkleCloud: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: 4,
  },
  sparkleText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#FFF',
  },
  globalContainer: {
    position: 'absolute',
    top: height * 0.35,
    left: width * 0.45,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendaryGlow: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(233, 30, 99, 0.18)',
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#FF1744',
  },
  legendaryEmoji: {
    fontSize: 40,
  },
  legendaryTitle: {
    fontSize: 6,
    fontWeight: '900',
    color: '#FFD700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
