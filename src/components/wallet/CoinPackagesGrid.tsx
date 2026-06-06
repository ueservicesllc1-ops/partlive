import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CoinPackage } from '../../types';
import { CoinPackageCard } from './CoinPackageCard';
import { colors, spacing, textPresets } from '../../theme';

interface CoinPackagesGridProps {
  packages: CoinPackage[];
  onPackagePress: (pkg: CoinPackage) => void;
  iapProducts?: Record<string, any>;
}

export const CoinPackagesGrid: React.FC<CoinPackagesGridProps> = ({
  packages,
  onPackagePress,
  iapProducts = {},
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comprar Monedas</Text>
      
      {packages.length === 0 ? (
        <Text style={styles.emptyText}>No hay paquetes disponibles.</Text>
      ) : (
        <View style={styles.grid}>
          {packages.map(pkg => {
            const iapProd = iapProducts[pkg.googlePlayProductId];
            const isPopular = pkg.googlePlayProductId === 'coins_1200' || pkg.googlePlayProductId === 'coins_2800';
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
