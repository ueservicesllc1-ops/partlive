import { TextStyle } from 'react-native';

export const typography = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const presets = {
  header: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    lineHeight: 24,
  } as TextStyle,
  h1: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    lineHeight: 34,
  } as TextStyle,
  h2: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    lineHeight: 28,
  } as TextStyle,
  h3: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    lineHeight: 24,
  } as TextStyle,
  bodyLarge: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.regular,
    lineHeight: 22,
  } as TextStyle,
  bodyMedium: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    lineHeight: 20,
  } as TextStyle,
  body: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    lineHeight: 20,
  } as TextStyle,
  bodySmall: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    lineHeight: 16,
  } as TextStyle,
  caption: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    lineHeight: 14,
  } as TextStyle,
};
