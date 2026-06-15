import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { colors, spacing, textPresets } from '../theme';
import { Button } from '../components/Button';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileStats } from '../components/profile/ProfileStats';
import { WalletSummary } from '../components/profile/WalletSummary';
import { BadgesList } from '../components/profile/BadgesList';
import { UserSocialStats } from '../components/social/UserSocialStats';
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

        <UserSocialStats
          followersCount={userProfile.followersCount}
          followingCount={userProfile.followingCount}
          friendsCount={userProfile.friendsCount || 0}
          onPressFollowers={() =>
            navigation.navigate(MAIN_ROUTES.SEARCH, {
              screen: 'SocialList',
              params: { userId: userProfile.uid, listType: 'followers' },
            })
          }
          onPressFollowing={() =>
            navigation.navigate(MAIN_ROUTES.SEARCH, {
              screen: 'SocialList',
              params: { userId: userProfile.uid, listType: 'following' },
            })
          }
          onPressFriends={() =>
            navigation.navigate(MAIN_ROUTES.SEARCH, {
              screen: 'SocialList',
              params: { userId: userProfile.uid, listType: 'friends' },
            })
          }
        />

        <TouchableOpacity onPress={() => navigation.navigate(MAIN_ROUTES.WALLET)}>
          <WalletSummary
            beans={userWallet ? userWallet.beans : (userProfile.beans || 0)}
            diamonds={userWallet ? userWallet.diamonds : (userProfile.diamonds || 0)}
          />
        </TouchableOpacity>

        <BadgesList badges={userProfile.badges || []} />

        {/* Rank/XP Progression Card */}
        <View style={styles.xpCard}>
          <Text style={styles.xpTitle}>Progreso de Rango (Lvl {userProfile.rankLevel || userProfile.level || 1})</Text>
          <Text style={styles.xpLabel}>{userProfile.rank || 'Novato'}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(((userProfile.xp || 0) / (userProfile.nextRankXp || 100)) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.xpText}>
            ⚡ {userProfile.xp || 0} / {userProfile.nextRankXp || 100} XP para el siguiente rango
          </Text>
        </View>

        {/* Host badge (if approved host) */}
        {userProfile.isHost && (
          <View style={styles.hostBadgeRow}>
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>🌟 HOST VERIFICADO</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <Button
            title="🎯 Mis Misiones Diarias"
            variant="outline"
            size="large"
            onPress={() => navigation.navigate(MAIN_ROUTES.MISSIONS)}
            style={styles.missionsButton}
          />

          <Button
            title="🛡️ Configuración de Privacidad"
            variant="outline"
            size="large"
            onPress={() =>
              navigation.navigate(MAIN_ROUTES.SEARCH, {
                screen: 'PrivacySettings',
              })
            }
            style={styles.missionsButton}
          />

          <Button
            title="🔔 Preferencias de Notificaciones"
            variant="outline"
            size="large"
            onPress={() => navigation.navigate(MAIN_ROUTES.NOTIFICATION_SETTINGS)}
            style={styles.notificationsBtn}
          />

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
  missionsButton: {
    borderColor: colors.primary,
  },
  notificationsBtn: {
    borderColor: colors.primary,
    marginTop: 4,
  },
  xpCard: {
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#292440',
  },
  xpTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  xpLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  xpText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
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
