import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { Avatar } from '../Avatar';

export interface GiftToastData {
  id: string;
  senderName: string;
  senderPhotoURL?: string;
  receiverName: string;
  giftName: string;
  giftIconEmoji?: string;
  quantity: number;
}

interface GiftReceivedToastProps {
  toast: GiftToastData;
  onDismiss: (id: string) => void;
}

export const GiftReceivedToast: React.FC<GiftReceivedToastProps> = ({
  toast,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-120)).current; // Start off-screen (left)
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide In
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: spacing.md,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 3.5 seconds
    const timer = setTimeout(() => {
      // Slide Out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(toast.id);
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, slideAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Avatar source={toast.senderPhotoURL} emoji="👤" size={32} />
      
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={2}>
          <Text style={styles.sender}>{toast.senderName}</Text> envió{' '}
          <Text style={styles.gift}>
            {toast.quantity}x {toast.giftName}
          </Text>{' '}
          a <Text style={styles.receiver}>{toast.receiverName}</Text>
        </Text>
      </View>

      <View style={styles.iconWrapper}>
        <Text style={styles.emoji}>{toast.giftIconEmoji || '🎁'}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 18, 33, 0.92)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary + '66',
    padding: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  text: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
  },
  sender: {
    fontWeight: 'bold',
    color: colors.accent,
  },
  receiver: {
    fontWeight: 'bold',
    color: colors.secondary,
  },
  gift: {
    fontWeight: '900',
    color: colors.gold,
  },
  iconWrapper: {
    marginLeft: spacing.xs,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
  },
  emoji: {
    fontSize: 18,
  },
});
