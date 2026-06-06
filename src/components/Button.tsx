import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyles = (): StyleProp<ViewStyle> => {
    const base = styles.button;
    let variantStyle = {};
    
    switch (variant) {
      case 'primary':
        variantStyle = { backgroundColor: colors.primary };
        break;
      case 'secondary':
        variantStyle = { backgroundColor: colors.secondary };
        break;
      case 'accent':
        variantStyle = { backgroundColor: colors.accent };
        break;
      case 'outline':
        variantStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
        break;
      case 'text':
        variantStyle = { backgroundColor: 'transparent' };
        break;
    }

    let sizeStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: 16 };
        break;
      case 'medium':
        sizeStyle = { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: 20 };
        break;
      case 'large':
        sizeStyle = { paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, borderRadius: 25 };
        break;
    }

    return [base, variantStyle, sizeStyle, disabled && styles.disabled, style];
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    const base = styles.text;
    let variantText = {};

    switch (variant) {
      case 'outline':
        variantText = { color: colors.primary };
        break;
      case 'text':
        variantText = { color: colors.textMuted };
        break;
      case 'accent':
        variantText = { color: '#0B0813', fontWeight: 'bold' }; // Deep dark color for strong contrast against cyan
        break;
      default:
        variantText = { color: colors.text };
    }

    let sizeText = {};
    switch (size) {
      case 'small':
        sizeText = { fontSize: typography.sizes.sm };
        break;
      case 'medium':
        sizeText = { fontSize: typography.sizes.md };
        break;
      case 'large':
        sizeText = { fontSize: typography.sizes.lg, fontWeight: 'bold' };
        break;
    }

    return [base, variantText, sizeText, textStyle];
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={getButtonStyles()}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.text} size="small" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
