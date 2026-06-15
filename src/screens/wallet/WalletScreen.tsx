import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import { useWallet } from '../../hooks/useWallet';
import { useInAppPurchases } from '../../hooks/useInAppPurchases';
import { WalletBalanceCard } from '../../components/wallet/WalletBalanceCard';
import { WalletStatsCard } from '../../components/wallet/WalletStatsCard';
import { CoinPackagesGrid } from '../../components/wallet/CoinPackagesGrid';
import { WalletTransactionList } from '../../components/wallet/WalletTransactionList';
import { DevWalletTools } from '../../components/wallet/DevWalletTools';
import { ScreenLoading } from '../../components/ScreenLoading';
import { ScreenError } from '../../components/ScreenError';
import { DiamondPackage } from '../../types';

export const WalletScreen = ({ navigation }: any) => {
  const {
    wallet,
    transactions,
    diamondPackages,
    loading,
    error,
    refresh,
    devCreditDiamonds,
    devCreditBeans,
  } = useWallet();

  const {
    iapProducts,
    purchasing,
    purchaseStatus,
    buyPackage,
  } = useInAppPurchases(diamondPackages);

  const handlePackagePress = (pkg: DiamondPackage) => {
    buyPackage(pkg);
  };

  if (purchasing) {
    return <ScreenLoading message={purchaseStatus || 'Procesando compra...'} />;
  }

  if (loading && !wallet) {
    return <ScreenLoading message="Cargando billetera..." />;
  }

  if (error && !wallet) {
    return <ScreenError message={error} onRetry={refresh} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="Billetera"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.accent]} />
        }
      >
        {/* Balances */}
        <WalletBalanceCard
          diamonds={wallet?.diamonds || 0}
          beans={wallet?.beans || 0}
        />

        {/* Development Tools */}
        <DevWalletTools
          onCreditBeans={devCreditBeans}
          onCreditDiamonds={devCreditDiamonds}
          loading={loading}
        />

        {/* Stats */}
        <WalletStatsCard
          lifetimeDiamondsPurchased={wallet?.lifetimeDiamondsPurchased || 0}
          lifetimeDiamondsSpent={wallet?.lifetimeDiamondsSpent || 0}
          lifetimeBeansEarned={wallet?.lifetimeBeansEarned || 0}
          lifetimeBeansWithdrawn={wallet?.lifetimeBeansWithdrawn || 0}
        />

        {/* Diamond Packages Grid */}
        <CoinPackagesGrid
          packages={diamondPackages}
          onPackagePress={handlePackagePress}
          iapProducts={iapProducts}
        />

        {/* History */}
        <WalletTransactionList transactions={transactions} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
