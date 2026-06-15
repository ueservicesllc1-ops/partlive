import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DiamondPackage } from '../../types';
import { colors, spacing, textPresets } from '../../theme';
import { formatCoins } from '../../utils/formatNumbers';

interface CoinPackageCardProps {
  pkg: DiamondPackage;
  onPress: (pkg: DiamondPackage) => void;
  localizedPrice?: string;
  isPopular?: boolean;
}

export const CoinPackageCard: React.FC<CoinPackageCardProps> = ({
  pkg,
  onPress,
  localizedPrice,
  isPopular = false,
}) => {
  // Fallback to Firestore static price if localized price is not loaded yet
  const displayPrice = localizedPrice || `USD $${pkg.priceUsd.toFixed(2)}`;

  return (
    <TouchableOpacity
      style={[styles.card, isPopular && styles.popularCard]}
      onPress={() => onPress(pkg)}
      activeOpacity={0.85}
    >
      {/* Popular Badge */}
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
      )}

      {/* Icon & Diamonds */}
      <View style={styles.coinWrapper}>
        <Text style={styles.coinEmoji}>💎</Text>
        <Text style={styles.coinsAmount}>{formatCoins(pkg.diamonds)}</Text>
      </View>

      {/* Bonus Badge */}
      {pkg.bonusDiamonds > 0 && (
        <View style={styles.bonusBadge}>
          <Text style={styles.bonusText}>+{pkg.bonusDiamonds} Bonus</Text>
        </View>
      )}

      {/* Package Title */}
      <Text style={styles.title} numberOfLines={1}>
        {pkg.title}
      </Text>

      {/* Price Button */}
      <View style={[styles.priceBtn, isPopular && styles.popularPriceBtn]}>
        <Text style={styles.priceText}>{displayPrice}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#292440',
    marginVertical: spacing.xs,
    position: 'relative',
  },
  popularCard: {
    borderColor: '#FF007F', // Brighter border for highlighted packages
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  popularBadge: {
    position: 'absolute',
    top: -9,
    backgroundColor: '#FF007F',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
  },
  popularText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  coinWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 6,
  },
  coinEmoji: {
    fontSize: 22,
    marginRight: 4,
  },
  coinsAmount: {
    ...textPresets.h3,
    color: colors.text,
  },
  bonusBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    marginVertical: 4,
  },
  bonusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  title: {
    fontSize: 11,
    color: colors.textMuted,
    marginVertical: 4,
    textAlign: 'center',
  },
  priceBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  popularPriceBtn: {
    backgroundColor: '#FF007F',
  },
  priceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
