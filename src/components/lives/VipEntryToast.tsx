import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useGiftSettingsStore } from '../../services/gifts/giftSettingsStore';

interface VipEntryToastProps {
  userName: string;
  vipLevel: number;
  visible: boolean;
  onDismiss?: () => void;
}

export const VipEntryToast: React.FC<VipEntryToastProps> = ({
  userName,
  vipLevel,
  visible,
  onDismiss,
}) => {
  const { enableAnimations } = useGiftSettingsStore();
  const animOpacity = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible && enableAnimations && vipLevel > 0) {
      Animated.parallel([
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(animOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animTranslateY, {
            toValue: -20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onDismiss) onDismiss();
        });
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [visible, enableAnimations, vipLevel]);

  if (!visible || !enableAnimations || vipLevel === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animOpacity,
          transform: [{ translateY: animTranslateY }],
        },
      ]}
    >
      <Text style={styles.badgeText}>👑 VIP {vipLevel}</Text>
      <Text style={styles.entryText}>
        <Text style={styles.nameText}>{userName}</Text> ha entrado a la transmisión
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    alignSelf: 'center',
    marginVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD700',
    marginRight: 6,
  },
  entryText: {
    fontSize: 11,
    color: '#FFF',
  },
  nameText: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
});
