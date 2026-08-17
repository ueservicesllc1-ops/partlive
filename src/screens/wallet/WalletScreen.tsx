import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../store/AuthContext';
import { useInAppPurchases } from '../../hooks/useInAppPurchases';
import { WalletBalanceCard } from '../../components/wallet/WalletBalanceCard';
import { HostEarningsCard } from '../../components/host/HostEarningsCard';
import { CoinPackagesGrid } from '../../components/wallet/CoinPackagesGrid';
import { WalletTransactionList } from '../../components/wallet/WalletTransactionList';
import { DevWalletTools } from '../../components/wallet/DevWalletTools';
import { ScreenLoading } from '../../components/ScreenLoading';
import { ScreenError } from '../../components/ScreenError';
import { DiamondPackage } from '../../types';

export const WalletScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'user' | 'host'>('user');

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

  const coinsBalance = wallet?.coins ?? wallet?.coinsBalance ?? wallet?.diamonds ?? 0;
  const diamondsBalance = wallet?.diamonds ?? wallet?.availableDiamonds ?? wallet?.beans ?? 0;
  const availableDiamonds = wallet?.availableDiamonds ?? diamondsBalance;
  const pendingDiamonds = wallet?.pendingDiamonds ?? 0;
  const lifetimeDiamonds = wallet?.lifetimeDiamonds ?? wallet?.lifetimeBeansEarned ?? 0;
  const withdrawnDiamonds = wallet?.withdrawnDiamonds ?? wallet?.lifetimeBeansWithdrawn ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="Billetera PartyLive"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'user' && styles.tabButtonActive]}
          onPress={() => setActiveTab('user')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'user' && styles.tabTextActive]}>
            🪙 Mi Saldo de Coins
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'host' && styles.tabButtonActive]}
          onPress={() => setActiveTab('host')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'host' && styles.tabTextActive]}>
            💎 Ganancias Creador
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.accent]} />
        }
      >
        {/* Main Balance Overview */}
        <WalletBalanceCard
          coins={coinsBalance}
          diamonds={diamondsBalance}
          availableDiamonds={availableDiamonds}
        />

        {activeTab === 'host' ? (
          /* Host Creator Earnings View */
          <HostEarningsCard
            availableDiamonds={availableDiamonds}
            pendingDiamonds={pendingDiamonds}
            lifetimeDiamonds={lifetimeDiamonds}
            withdrawnDiamonds={withdrawnDiamonds}
            isKycVerified={userProfile?.isKycVerified || false}
            minPayoutDiamonds={5000}
            onRequestPayout={() => {
              // Navigates or shows payout info
            }}
          />
        ) : (
          /* User Coins Purchase View */
          <>
            {/* Packages Grid */}
            <CoinPackagesGrid
              packages={diamondPackages}
              onPackagePress={handlePackagePress}
              iapProducts={iapProducts}
            />
          </>
        )}

        {/* Development Tools */}
        <DevWalletTools
          onCreditBeans={devCreditBeans}
          onCreditDiamonds={devCreditDiamonds}
          loading={loading}
        />

        {/* Transaction History */}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#161326',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
