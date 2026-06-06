import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { colors, spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'solid' | 'gradient' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'solid',
}) => {
  const getCardStyle = (): StyleProp<ViewStyle> => {
    let variantStyle = {};
    switch (variant) {
      case 'solid':
        variantStyle = { backgroundColor: colors.surface };
        break;
      case 'bordered':
        variantStyle = {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
        break;
      case 'gradient':
        variantStyle = {
          backgroundColor: colors.surfaceLight,
          borderWidth: 1,
          borderColor: colors.primary + '33', // Subtle violet tint
        };
        break;
    }
    return [styles.card, variantStyle, style];
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={getCardStyle()}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={getCardStyle()}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
});
