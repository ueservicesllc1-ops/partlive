import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DiamondPackage } from '../../types';
import { CoinPackageCard } from './CoinPackageCard';
import { colors, spacing, textPresets } from '../../theme';

interface CoinPackagesGridProps {
  packages: DiamondPackage[];
  onPackagePress: (pkg: DiamondPackage) => void;
  iapProducts?: Record<string, any>;
}

export const CoinPackagesGrid: React.FC<CoinPackagesGridProps> = ({
  packages,
  onPackagePress,
  iapProducts = {},
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comprar Diamantes</Text>
      
      {packages.length === 0 ? (
        <Text style={styles.emptyText}>No hay paquetes disponibles.</Text>
      ) : (
        <View style={styles.grid}>
          {packages.map(pkg => {
            const iapProd = iapProducts[pkg.googlePlayProductId];
            const isPopular = pkg.googlePlayProductId === 'diamonds_1200' || pkg.googlePlayProductId === 'diamonds_2800';
            return (
              <CoinPackageCard 
                key={pkg.id} 
                pkg={pkg} 
                onPress={onPackagePress} 
                localizedPrice={iapProd?.localizedPrice}
                isPopular={isPopular}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
