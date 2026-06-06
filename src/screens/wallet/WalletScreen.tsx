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
import { CoinPackage } from '../../types';

export const WalletScreen = ({ navigation }: any) => {
  const {
    wallet,
    transactions,
    coinPackages,
    loading,
    error,
    refresh,
    devCreditCoins,
    devCreditDiamonds,
  } = useWallet();

  const {
    iapProducts,
    purchasing,
    purchaseStatus,
    buyPackage,
  } = useInAppPurchases(coinPackages);

  const handlePackagePress = (pkg: CoinPackage) => {
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
          coins={wallet?.coins || 0}
          diamonds={wallet?.diamonds || 0}
        />

        {/* Development Tools */}
        <DevWalletTools
          onCreditCoins={devCreditCoins}
          onCreditDiamonds={devCreditDiamonds}
          loading={loading}
        />

        {/* Stats */}
        <WalletStatsCard
          lifetimeCoinsPurchased={wallet?.lifetimeCoinsPurchased || 0}
          lifetimeCoinsSpent={wallet?.lifetimeCoinsSpent || 0}
          lifetimeDiamondsEarned={wallet?.lifetimeDiamondsEarned || 0}
          lifetimeDiamondsWithdrawn={wallet?.lifetimeDiamondsWithdrawn || 0}
        />

        {/* Coin Packages Grid */}
        <CoinPackagesGrid
          packages={coinPackages}
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
