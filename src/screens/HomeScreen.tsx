import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, ScrollView, RefreshControl, View, Text, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../theme';
import { MainHeader } from '../components/navigation/MainHeader';
import { MAIN_ROUTES, TAB_ROUTES } from '../app/routes';
import { useHomeData } from '../hooks/useHomeData';
import { useAuth } from '../store/AuthContext';

// Modulares
import { HomeGreeting } from '../components/home/HomeGreeting';
import { HomeBannerCarousel } from '../components/home/HomeBannerCarousel';
import { QuickActions } from '../components/home/QuickActions';
import { PopularRoomsSection } from '../components/home/PopularRoomsSection';
import { LiveStreamsSection } from '../components/home/LiveStreamsSection';
import { QuickGamesSection } from '../components/home/QuickGamesSection';
import { DailyRankingSection } from '../components/home/DailyRankingSection';
import { FeaturedHostsSection } from '../components/home/FeaturedHostsSection';
import { DailyMissionsSection } from '../components/home/DailyMissionsSection';
import { FloatingCreateButton } from '../components/home/FloatingCreateButton';

export const HomeScreen = ({ navigation }: any) => {
  const { 
    loading, refreshing, error, 
    banners, rooms, lives, games, rankings, events, hosts, missions, 
    refresh 
  } = useHomeData();
  const { userProfile } = useAuth();

  const handleBannerPress = (banner: any) => {
    if (banner.actionType === 'event') navigation.navigate(MAIN_ROUTES.EVENTS);
    else if (banner.actionType === 'room') navigation.navigate(MAIN_ROUTES.ROOM_DETAILS, { roomId: banner.actionValue });
    else if (banner.actionType === 'url') navigation.navigate(MAIN_ROUTES.RANKINGS);
  };

  const handleQuickAction = (action: string) => {
    switch(action) {
      case 'rooms': navigation.navigate(TAB_ROUTES.ROOMS); break;
      case 'lives': navigation.navigate(TAB_ROUTES.LIVES); break;
      case 'games': navigation.navigate(TAB_ROUTES.GAMES); break;
      case 'rankings': navigation.navigate(MAIN_ROUTES.RANKINGS); break;
      case 'events': navigation.navigate(MAIN_ROUTES.EVENTS); break;
      case 'wallet': navigation.navigate(MAIN_ROUTES.WALLET); break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <MainHeader 
        showSearch={true}
        onSearchPress={() => navigation.navigate(MAIN_ROUTES.SEARCH)}
        onNotificationsPress={() => navigation.navigate(MAIN_ROUTES.NOTIFICATIONS)}
        onWalletPress={() => navigation.navigate(MAIN_ROUTES.WALLET)}
      />
      
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={refresh} 
              tintColor={colors.primary} 
              colors={[colors.primary]} 
            />
          }
        >
          <HomeGreeting />
          <HomeBannerCarousel banners={banners} onPress={handleBannerPress} />
          <QuickActions onAction={handleQuickAction} />

          {/* Host Center Banner */}
          {userProfile?.isHost ? (
            <TouchableOpacity
              style={styles.hostBanner}
              onPress={() => navigation.navigate(MAIN_ROUTES.HOST_DASHBOARD)}
              activeOpacity={0.8}
            >
              <Text style={styles.hostBannerEmoji}>🌟</Text>
              <View style={styles.hostBannerText}>
                <Text style={styles.hostBannerTitle}>Host Center</Text>
                <Text style={styles.hostBannerSub}>Ver stats, earnings y actividad</Text>
              </View>
              <Text style={styles.hostBannerArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.becomeHostBanner}
              onPress={() => navigation.navigate(MAIN_ROUTES.HOST_DASHBOARD)}
              activeOpacity={0.8}
            >
              <Text style={styles.becomeHostText}>🎙️  ¿Quieres ser host?  →</Text>
            </TouchableOpacity>
          )}
          
          <PopularRoomsSection 
            rooms={rooms} 
            onRoomPress={(id) => navigation.navigate(MAIN_ROUTES.ROOM_DETAILS, { roomId: id })} 
          />
          
          <LiveStreamsSection 
            lives={lives} 
            onLivePress={(id) => navigation.navigate(MAIN_ROUTES.LIVE_DETAILS, { liveId: id })} 
          />
          
          <QuickGamesSection 
            games={games} 
            onGamePress={(id) => navigation.navigate(MAIN_ROUTES.GAME_DETAILS, { gameId: id })} 
          />
          
          <DailyRankingSection 
            rankings={rankings} 
            onViewAll={() => navigation.navigate(MAIN_ROUTES.RANKINGS)} 
          />
          
          <FeaturedHostsSection 
            hosts={hosts} 
            onHostPress={(id) => navigation.navigate(MAIN_ROUTES.PUBLIC_PROFILE, { userId: id })} 
          />
          
          <DailyMissionsSection missions={missions} />
        </ScrollView>
      )}

      {!loading && !error && (
        <FloatingCreateButton onCreateRoom={() => navigation.navigate(MAIN_ROUTES.CREATE_ROOM)} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingBottom: 80, // Space for FAB
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
  },
  errorText: {
    ...textPresets.bodyMedium,
    color: colors.error,
  },
  hostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold + '44',
    gap: spacing.sm,
  },
  hostBannerEmoji: { fontSize: 28 },
  hostBannerText: { flex: 1 },
  hostBannerTitle: { fontSize: 14, fontWeight: '700', color: colors.gold },
  hostBannerSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  hostBannerArrow: { fontSize: 18, color: colors.gold },
  becomeHostBanner: {
    backgroundColor: colors.primary + '15',
    borderRadius: 14,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    alignItems: 'center',
  },
  becomeHostText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
});
