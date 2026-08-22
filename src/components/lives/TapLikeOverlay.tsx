import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import { useTapLikeEngine } from '../../hooks/useTapLikeEngine';

const MAX_VISIBLE_TAPS = 25;
const EMOJIS = ['❤️', '💖', '💕', '💙', '💜', '💛', '🧡', '💚'];

interface TapParticle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  anim: Animated.Value;
  sway: Animated.Value;
  scale: Animated.Value;
  rotation: number;
}

interface TapLikeOverlayProps {
  liveId: string;
  totalLikes: number;
  likesPerMinute?: number;
}

export const TapLikeOverlay: React.FC<TapLikeOverlayProps> = ({
  liveId,
  totalLikes,
  likesPerMinute = 0,
}) => {
  const [particles, setParticles] = useState<TapParticle[]>([]);
  const particleIdRef = useRef(0);

  const spawnParticle = useCallback((x: number, y: number) => {
    setParticles((prev) => {
      if (prev.length >= MAX_VISIBLE_TAPS) {
        // Discard oldest particle visually — counter still syncs to server
        prev = prev.slice(1);
      }

      const id = `tap_${particleIdRef.current++}`;
      const anim = new Animated.Value(0);       // y progress 0→1
      const sway = new Animated.Value(0);       // x sway
      const scale = new Animated.Value(0.6);   // scale start

      const rotation = Math.floor(Math.random() * 50) - 25; // -25° to +25°
      const swayAmount = (Math.random() * 40 - 20);          // ±20px
      const duration = 1400 + Math.random() * 400;           // 1.4s – 1.8s
      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

      // Kick off animation immediately
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1 + Math.random() * 0.3,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.0,
            duration: duration - 180,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(sway, {
          toValue: swayAmount,
          duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setParticles((ps) => ps.filter((p) => p.id !== id));
      });

      return [...prev, { id, x, y, emoji, anim, sway, scale, rotation }];
    });
  }, []);

  const { handleTap } = useTapLikeEngine({ liveId, onAnimateTap: spawnParticle });

  const lastTapRef = useRef<number>(0);
  const onPress = useCallback((evt: any) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      const { locationX, locationY } = evt.nativeEvent;
      handleTap(locationX, locationY);
    }
    lastTapRef.current = now;
  }, [handleTap]);

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Floating particle layer — passthrough touches */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {particles.map((p) => {
          const translateY = p.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -220],
          });
          const opacity = p.anim.interpolate({
            inputRange: [0, 0.65, 1],
            outputRange: [1, 0.7, 0],
          });

          return (
            <Animated.Text
              key={p.id}
              style={[
                styles.particle,
                {
                  left: p.x - 14,
                  top: p.y - 20,
                  transform: [
                    { translateY },
                    { translateX: p.sway },
                    { scale: p.scale },
                    { rotate: `${p.rotation}deg` },
                  ],
                  opacity,
                },
              ]}
            >
              {p.emoji}
            </Animated.Text>
          );
        })}
      </View>

      {/* Full-screen tap zone */}
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.tapZone} />
      </TouchableWithoutFeedback>

      {/* Tap counter badge — top-right or wherever positioned */}
      <View style={styles.counterBadge} pointerEvents="none">
        <Text style={styles.counterText}>❤️ {formatCount(totalLikes)}</Text>
        {likesPerMinute > 0 && (
          <Text style={styles.rateText}>🔥 +{formatCount(likesPerMinute)}/min</Text>
        )}
      </View>

      {/* Accessible button alternative for single tap */}
      <TouchableOpacity
        style={styles.accessibleBtn}
        activeOpacity={0.6}
        onPress={() => handleTap(150, 300)}
        accessibilityLabel="Like this live"
        accessibilityRole="button"
      >
        <Text style={styles.accessibleBtnText}>❤️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    fontSize: 28,
  },
  tapZone: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  counterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
  },
  counterText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  rateText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  accessibleBtn: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessibleBtnText: {
    fontSize: 22,
  },
});
