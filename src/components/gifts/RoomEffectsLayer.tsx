import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

interface RoomEffectsLayerProps {
  roomId: string;
}

interface ActiveEffect {
  id: string;
  effectType: string; // e.g. 'confetti_rain', 'neon_lasers', 'spotlight_show', 'fireworks_gala', 'disco_ball_glow', 'jackpot_coins', 'lightning_strike'
  senderName: string;
  giftName: string;
}

export const RoomEffectsLayer: React.FC<RoomEffectsLayerProps> = ({ roomId }) => {
  const [currentEffect, setCurrentEffect] = useState<ActiveEffect | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Listen to active room effects in real-time
    const unsubscribe = firestore()
      .collection('activeRoomEffects')
      .where('roomId', 'in', [roomId, 'global'])
      .orderBy('expiresAt', 'asc')
      .onSnapshot(
        (snapshot) => {
          if (!snapshot || snapshot.empty) {
            setCurrentEffect(null);
            return;
          }

          // Get the newest unexpired effect
          const now = firestore.Timestamp.now();
          const validEffects = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as any))
            .filter((eff) => eff.expiresAt && eff.expiresAt.toMillis() > now.toMillis());

          if (validEffects.length > 0) {
            // Take the latest one
            const eff = validEffects[validEffects.length - 1];
            setCurrentEffect({
              id: eff.id,
              effectType: eff.effectType,
              senderName: eff.senderName || 'Alguien',
              giftName: eff.giftName || 'Regalo Especial',
            });
          } else {
            setCurrentEffect(null);
          }
        },
        (error) => {
          console.error('Error listening to room effects:', error);
        }
      );

    return () => unsubscribe();
  }, [roomId]);

  if (!currentEffect) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Renders specific premium overlay effects based on type */}
      {currentEffect.effectType === 'confetti_rain' && <ConfettiRainEffect />}
      {currentEffect.effectType === 'neon_lasers' && <NeonLasersEffect />}
      {currentEffect.effectType === 'spotlight_show' && <SpotlightShowEffect />}
      {currentEffect.effectType === 'fireworks_gala' && <FireworksGalaEffect />}
      {currentEffect.effectType === 'disco_ball_glow' && <DiscoBallGlowEffect />}
      {currentEffect.effectType === 'jackpot_coins' && <JackpotCoinsEffect />}
      {currentEffect.effectType === 'lightning_strike' && <LightningStrikeEffect />}

      {/* Banner indicating who triggered the room effect */}
      <EffectAnnouncementBanner currentEffect={currentEffect} />
    </View>
  );
};

// ─── EFFECT BANNER ───
const EffectAnnouncementBanner: React.FC<{ currentEffect: ActiveEffect }> = ({
  currentEffect,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 60,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentEffect.id]);

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Text style={styles.bannerText}>
        🎉 <Text style={styles.bannerHighlight}>{currentEffect.senderName}</Text>{' '}
        desbloqueó un efecto especial con{' '}
        <Text style={styles.bannerHighlight}>{currentEffect.giftName}</Text>! 🌟
      </Text>
    </Animated.View>
  );
};

// ─── 1. CONFETTI RAIN EFFECT ───
const ConfettiRainEffect = () => {
  const count = 40;
  const particles = Array.from({ length: count }).map((_, i) => ({
    id: i,
    delay: Math.random() * 2000,
    left: Math.random() * width,
    color: ['#FF2A6D', '#05D9E8', '#01012B', '#F5A623', '#7ED321', '#B8E986', '#F8E71C'][i % 7],
    spinDirection: Math.random() > 0.5 ? 1 : -1,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {particles.map((p) => (
        <ConfettiParticle key={p.id} {...p} />
      ))}
    </View>
  );
};

const ConfettiParticle = ({ delay, left, color, spinDirection }: any) => {
  const fallAnim = useRef(new Animated.Value(-20)).current;
  const swingAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fallAnim, {
          toValue: height + 20,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(swingAnim, {
              toValue: 30 * spinDirection,
              duration: 800,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(swingAnim, {
              toValue: -30 * spinDirection,
              duration: 800,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1000 + Math.random() * 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]),
    ]).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left,
          backgroundColor: color,
          transform: [
            { translateY: fallAnim },
            { translateX: swingAnim },
            { rotate: spin },
          ],
        },
      ]}
    />
  );
};

// ─── 2. NEON LASERS EFFECT ───
const NeonLasersEffect = () => {
  const laserAnims = Array.from({ length: 6 }).map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    const animations = laserAnims.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1200 + index * 200,
            easing: Easing.inOut(Easing.sine),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1200 + index * 200,
            easing: Easing.inOut(Easing.sine),
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {laserAnims.map((anim, i) => {
        const angle = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${-40 + i * 15}deg`, `${40 + i * 15}deg`],
        });
        const colorsList = ['#FF007F', '#00F0FF', '#7F00FF', '#39FF14'];
        return (
          <Animated.View
            key={i}
            style={[
              styles.laserBeam,
              {
                left: (width / 5) * i,
                backgroundColor: colorsList[i % colorsList.length],
                transform: [{ rotate: angle }, { scaleY: 1.5 }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// ─── 3. SPOTLIGHT SHOW EFFECT ───
const SpotlightShowEffect = () => {
  const leftSpot = useRef(new Animated.Value(0)).current;
  const rightSpot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(leftSpot, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(leftSpot, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(rightSpot, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(rightSpot, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const leftAngle = leftSpot.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '50deg'],
  });

  const rightAngle = rightSpot.interpolate({
    inputRange: [0, 1],
    outputRange: ['10deg', '-50deg'],
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Left Spotlight */}
      <Animated.View
        style={[
          styles.spotlight,
          {
            left: 0,
            transform: [{ rotate: leftAngle }],
          },
        ]}
      />
      {/* Right Spotlight */}
      <Animated.View
        style={[
          styles.spotlight,
          {
            right: 0,
            transform: [{ rotate: rightAngle }],
          },
        ]}
      />
    </View>
  );
};

// ─── 4. FIREWORKS GALA EFFECT ───
const FireworksGalaEffect = () => {
  const burstCount = 6;
  const bursts = Array.from({ length: burstCount }).map((_, i) => ({
    id: i,
    delay: i * 1800,
    top: height * 0.15 + Math.random() * (height * 0.3),
    left: width * 0.1 + Math.random() * (width * 0.8),
    color: ['#FF007F', '#FFD700', '#00FFFF', '#FF3F00', '#7F00FF', '#39FF14'][i % 6],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {bursts.map((b) => (
        <FireworkBurst key={b.id} {...b} />
      ))}
    </View>
  );
};

const FireworkBurst = ({ delay, top, left, color }: any) => {
  const particleAnims = Array.from({ length: 12 }).map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    const animations = particleAnims.map((anim, i) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);
    });
    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={[styles.fireworkCenter, { top, left }]}>
      {particleAnims.map((anim, i) => {
        const rad = (i * 30 * Math.PI) / 180;
        const xVal = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(rad) * 100],
        });
        const yVal = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(rad) * 100],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.fireworkSpark,
              {
                backgroundColor: color,
                opacity,
                transform: [{ translateX: xVal }, { translateY: yVal }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// ─── 5. DISCO BALL GLOW EFFECT ───
const DiscoBallGlowEffect = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.discoContainer}>
      <Animated.Text style={[styles.discoBall, { transform: [{ rotate: spin }] }]}>
        🪩
      </Animated.Text>
      <View style={styles.discoLightGrid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.discoLightRay,
              {
                transform: [{ rotate: `${i * 45}deg` }],
                borderColor: ['rgba(255,0,128,0.2)', 'rgba(0,255,255,0.2)', 'rgba(255,255,0,0.2)'][i % 3],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// ─── 6. JACKPOT COINS EFFECT ───
const JackpotCoinsEffect = () => {
  const count = 30;
  const coins = Array.from({ length: count }).map((_, i) => ({
    id: i,
    delay: Math.random() * 2000,
    left: Math.random() * width,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {coins.map((c) => (
        <JackpotCoin key={c.id} {...c} />
      ))}
    </View>
  );
};

const JackpotCoin = ({ delay, left }: any) => {
  const fallAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(fallAnim, {
        toValue: height + 50,
        duration: 1800 + Math.random() * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.goldCoin,
        {
          left,
          transform: [{ translateY: fallAnim }],
        },
      ]}
    >
      🪙
    </Animated.Text>
  );
};

// ─── 7. LIGHTNING STRIKE EFFECT ───
const LightningStrikeEffect = () => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Repeated quick flashes
    Animated.sequence([
      Animated.timing(opacityAnim, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.1, duration: 100, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.9, duration: 60, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(opacityAnim, { toValue: 0.75, duration: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.lightningStrike,
        {
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#FF007F',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
    maxWidth: '85%',
  },
  bannerText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  bannerHighlight: {
    color: '#FF007F',
    fontWeight: '900',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  laserBeam: {
    position: 'absolute',
    top: -height * 0.1,
    width: 2,
    height: height * 1.5,
    opacity: 0.65,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.9,
    elevation: 4,
  },
  spotlight: {
    position: 'absolute',
    top: 0,
    width: width * 0.4,
    height: height * 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: width * 0.2,
    opacity: 0.4,
  },
  fireworkCenter: {
    position: 'absolute',
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireworkSpark: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  discoContainer: {
    position: 'absolute',
    top: height * 0.1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoBall: {
    fontSize: 68,
    zIndex: 10,
  },
  discoLightGrid: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoLightRay: {
    position: 'absolute',
    width: 4,
    height: 400,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.25,
  },
  goldCoin: {
    position: 'absolute',
    fontSize: 28,
  },
  lightningStrike: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
  },
});
