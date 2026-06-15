import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { colors } from '../../theme';
import { NotificationIcon } from './NotificationIcon';

interface Props {
  title: string;
  body: string;
  type: string;
  onPress: () => void;
  onClose: () => void;
}

export const InAppNotificationBanner: React.FC<Props> = ({ title, body, type, onPress, onClose }) => {
  const [slideAnim] = useState(new Animated.Value(-150));

  useEffect(() => {
    // Slide Down
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.9}>
        <NotificationIcon type={type} />
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Below typical statusbar height
    left: 16,
    right: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#231E3C',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.primary + '55',
    gap: 12,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  body: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
