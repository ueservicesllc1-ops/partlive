import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '../../theme';

interface LiveLikeButtonProps {
  liked: boolean;
  onPress: () => void;
  count: number;
}

export const LiveLikeButton: React.FC<LiveLikeButtonProps> = ({ liked, onPress, count }) => {
  return (
    <TouchableOpacity
      style={[styles.button, liked && styles.buttonLiked]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{liked ? '❤️' : '🤍'}</Text>
      {count > 0 && <Text style={styles.count}>{count}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonLiked: {
    backgroundColor: 'rgba(233, 30, 99, 0.2)',
  },
  icon: {
    fontSize: 20,
  },
  count: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
