import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface ProfileVisibilityBadgeProps {
  visibility: 'public' | 'followers' | 'private';
}

export const ProfileVisibilityBadge: React.FC<ProfileVisibilityBadgeProps> = ({ visibility }) => {
  const getLabelAndColor = () => {
    switch (visibility) {
      case 'followers':
        return { label: 'Solo Seguidores 👥', color: colors.primary };
      case 'private':
        return { label: 'Privado 🔒', color: colors.warning };
      default:
        return { label: 'Público 🌍', color: colors.success };
    }
  };

  const { label, color } = getLabelAndColor();

  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}15` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
export default ProfileVisibilityBadge;
