import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

export const FriendBadge: React.FC = () => {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>🤝 Amigos</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
export default FriendBadge;
