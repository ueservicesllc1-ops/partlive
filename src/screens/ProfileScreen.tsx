import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { colors, spacing, textPresets } from '../theme';
import { Button } from '../components/Button';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileStats } from '../components/profile/ProfileStats';
import { WalletSummary } from '../components/profile/WalletSummary';
import { BadgesList } from '../components/profile/BadgesList';
import { MAIN_ROUTES } from '../app/routes';

export const ProfileScreen = ({ navigation }: any) => {
  const { userProfile, userWallet, logout } = useAuth();

  if (!userProfile) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.topActions}>
          <Text style={styles.topTitle}>Mi Perfil</Text>
          <TouchableOpacity onPress={() => navigation.navigate(MAIN_ROUTES.SETTINGS)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ProfileHeader
          photoURL={userProfile.photoURL}
          displayName={userProfile.displayName}
          username={userProfile.username}
          bio={userProfile.bio}
          level={userProfile.level}
          isVerified={userProfile.isVerified}
          role={userProfile.role}
          onEditPress={() => navigation.navigate('EditProfile')}
        />

        <ProfileStats
          followers={userProfile.followersCount}
          following={userProfile.followingCount}
          gifts={userProfile.totalGiftsReceived || 0}
          rooms={userProfile.roomsJoinedCount || 0}
        />

        <TouchableOpacity onPress={() => navigation.navigate(MAIN_ROUTES.WALLET)}>
          <WalletSummary
            coins={userWallet ? userWallet.coins : userProfile.coins}
            diamonds={userWallet ? userWallet.diamonds : userProfile.diamonds}
          />
        </TouchableOpacity>

        <BadgesList badges={userProfile.badges || []} />

        {/* Host badge (if approved host) */}
        {userProfile.isHost && (
          <View style={styles.hostBadgeRow}>
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>🌟 HOST VERIFICADO</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {userProfile.isHost ? (
            <Button
              title="Dashboard de Host"
              variant="primary"
              size="large"
              onPress={() => navigation.navigate(MAIN_ROUTES.HOST_DASHBOARD)}
              style={styles.hostDashBtn}
            />
          ) : (
            <Button
              title="Convertirme en Host"
              variant="secondary"
              size="large"
              onPress={() => navigation.navigate(MAIN_ROUTES.HOST_DASHBOARD)}
              style={styles.hostButton}
            />
          )}
          
          <Button
            title="Cerrar Sesión"
            variant="outline"
            size="large"
            onPress={logout}
            style={styles.logoutButton}
          />
        </View>

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
    paddingBottom: spacing.xxl,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  topTitle: {
    ...textPresets.h2,
    color: colors.text,
  },
  settingsIcon: {
    fontSize: 24,
  },
  actionsContainer: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  hostButton: {
    backgroundColor: 'rgba(255, 64, 129, 0.1)',
    borderColor: 'rgba(255, 64, 129, 0.5)',
  },
  hostDashBtn: {
    backgroundColor: colors.primary,
  },
  hostBadgeRow: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  hostBadge: {
    backgroundColor: colors.gold + '22',
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.gold + '55',
  },
  hostBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.5,
  },
  logoutButton: {
    borderColor: colors.border,
  },
});
