import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../../theme';

interface FollowButtonProps {
  isFollowing: boolean;
  onPress: () => void;
  loading?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ isFollowing, onPress, loading }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[
        styles.button,
        isFollowing ? styles.buttonFollowing : styles.buttonFollow,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.text}>
          {isFollowing ? '✓ Siguiendo' : '+ Seguir'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    minWidth: 100,
  },
  buttonFollow: {
    backgroundColor: colors.primary,
  },
  buttonFollowing: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
export default FollowButton;
