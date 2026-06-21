import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { DiamondPackage } from '../../types';
import { colors, spacing, textPresets } from '../../theme';
import { useInAppPurchases } from '../../hooks/useInAppPurchases';

interface DiamondPackagesTabProps {
  packages: DiamondPackage[];
}

export const DiamondPackagesTab: React.FC<DiamondPackagesTabProps> = ({
  packages,
}) => {
  const {
    isReady,
    iapProducts,
    loadingProducts,
    purchasing,
    purchaseStatus,
    buyPackage,
  } = useInAppPurchases(packages);

  const sortedPackages = [...packages].sort((a, b) => a.sortOrder - b.sortOrder);



  return (
    <View style={styles.container}>
      {purchasing && (
        <View style={styles.purchasingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.purchasingText}>
            {purchaseStatus || 'Procesando compra...'}
          </Text>
        </View>
      )}

      {!isReady && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            ⚠️ Modo offline: los precios mostrados son estimaciones en USD.
          </Text>
        </View>
      )}

      <FlatList
        data={sortedPackages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          // Check if Google Play loaded localized details, otherwise fallback to priceUsd
          const iapProduct = iapProducts[item.googlePlayProductId];
          // localizedPrice exists on ProductAndroid; use optional chaining for safety
          const displayPrice = iapProduct
            ? ((iapProduct as any).localizedPrice ?? `$${item.priceUsd.toFixed(2)} USD`)
            : `$${item.priceUsd.toFixed(2)} USD`;

          return (
            <TouchableOpacity
              style={[
                styles.packageCard,
                item.isPopular && styles.packageCardPopular,
              ]}
              activeOpacity={0.8}
              onPress={() => buyPackage(item)}
              disabled={purchasing}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.packageIcon}>💎</Text>
                <View style={styles.packageDetails}>
                  <Text style={styles.packageTitle}>
                    {item.totalDiamonds} Diamantes
                  </Text>
                  {item.bonusDiamonds > 0 && (
                    <Text style={styles.bonusText}>
                      ¡Incluye +{item.bonusDiamonds} de regalo!
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.priceContainer}>
                {item.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>POPULAR</Text>
                  </View>
                )}
                <View style={styles.buyBtn}>
                  <Text style={styles.buyBtnText}>{displayPrice}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  infoBanner: {
    backgroundColor: 'rgba(255, 196, 0, 0.08)',
    borderColor: 'rgba(255, 196, 0, 0.2)',
    borderBottomWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  infoBannerText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.warning,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
  },
  packageCardPopular: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(0, 229, 255, 0.03)',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  packageIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  packageDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  packageTitle: {
    ...textPresets.body,
    fontWeight: '800',
    color: colors.text,
  },
  bonusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  popularBadge: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  popularBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  buyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 86,
    alignItems: 'center',
  },
  buyBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  purchasingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 8, 19, 0.85)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  purchasingText: {
    ...textPresets.body,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
