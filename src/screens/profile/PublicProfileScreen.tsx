import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Text, Alert } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../../components/Button';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { BadgesList } from '../../components/profile/BadgesList';
import { getPublicUserProfile } from '../../services/firebase/firestore/usersService';
import { UserProfile } from '../../types/user';
import { ScreenLoading } from '../../components/ScreenLoading';
import { ScreenError } from '../../components/ScreenError';
import { useAuth } from '../../store/AuthContext';
import { isUserBlocked } from '../../services/firebase/firestore/blocksService';
import { ReportModal } from '../../components/moderation/ReportModal';
import { BlockUserModal } from '../../components/moderation/BlockUserModal';
import { useFollow } from '../../hooks/useFollow';
import { listenIsFollowing } from '../../services/firebase/firestore/followsService';
import { UserSocialStats } from '../../components/social/UserSocialStats';
import { FriendBadge } from '../../components/social/FriendBadge';
import { ProfileVisibilityBadge } from '../../components/social/ProfileVisibilityBadge';
import { MAIN_ROUTES } from '../../app/routes';

export const PublicProfileScreen = ({ route, navigation }: any) => {
  const { userId } = route.params || {};
  const { user } = useAuth();

  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isReverseFollowing, setIsReverseFollowing] = useState(false);

  const {
    isFollowing,
    toggleFollow,
    actionLoading,
    followersCount,
    followingCount,
  } = useFollow(userId);

  const isMe = user?.uid === userId;
  const isFriend = isFollowing && isReverseFollowing;

  useEffect(() => {
    if (!userId) {
      setError('Usuario no especificado.');
      setLoading(false);
      return;
    }

    const fetchProfileAndBlockStatus = async () => {
      try {
        const data = await getPublicUserProfile(userId);
        if (data) {
          setProfile(data);

          if (user && user.uid !== userId) {
            const blocked = await isUserBlocked(user.uid, userId);
            setIsBlocked(blocked);
          }
        } else {
          setError('Este usuario no existe o ha sido eliminado.');
        }
      } catch (err) {
        setError('No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndBlockStatus();
  }, [userId, user]);

  // Listen if target follows the current user (reverse following)
  useEffect(() => {
    if (user && userId && user.uid !== userId) {
      const unsubscribe = listenIsFollowing(userId, user.uid, hasFollow => {
        setIsReverseFollowing(hasFollow);
      });
      return unsubscribe;
    }
  }, [user, userId]);

  if (loading) return <ScreenLoading message="Cargando perfil..." />;
  if (error || !profile) return <ScreenError message={error || 'Error desconocido'} onBack={() => navigation.goBack()} />;

  const isOwnProfile = user?.uid === userId;
  const isBanned = profile.status === 'banned' || profile.status === 'suspended';
  
  // Privacy Visibility Checks
  const isFollower = isFollowing;
  const canViewFullProfile =
    isOwnProfile ||
    profile.profileVisibility === 'public' ||
    !profile.profileVisibility ||
    (profile.profileVisibility === 'followers' && isFollower);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.topActions}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setReportModalVisible(true)}>
          <Text style={styles.optionsIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ProfileHeader
          photoURL={profile.photoURL}
          displayName={profile.displayName!}
          username={profile.username!}
          bio={profile.bio}
          level={profile.level!}
          isVerified={profile.isVerified!}
          role={profile.role!}
        />

        {/* Badges and tags row */}
        <View style={styles.badgesRow}>
          {profile.profileVisibility && (
            <ProfileVisibilityBadge visibility={profile.profileVisibility as any} />
          )}
          {isFriend && <FriendBadge />}
        </View>

        {/* Social Counters */}
        <View style={styles.statsContainer}>
          <UserSocialStats
            followersCount={followersCount}
            followingCount={followingCount}
            friendsCount={profile.friendsCount || 0}
            onPressFollowers={() => {
              if (canViewFullProfile) {
                navigation.navigate(MAIN_ROUTES.SEARCH, {
                  screen: 'SocialList',
                  params: { userId, listType: 'followers' },
                });
              } else {
                Alert.alert('Perfil Privado', 'Sigue a este usuario para ver su lista de seguidores.');
              }
            }}
            onPressFollowing={() => {
              if (canViewFullProfile) {
                navigation.navigate(MAIN_ROUTES.SEARCH, {
                  screen: 'SocialList',
                  params: { userId, listType: 'following' },
                });
              } else {
                Alert.alert('Perfil Privado', 'Sigue a este usuario para ver sus seguidos.');
              }
            }}
            onPressFriends={() => {
              if (canViewFullProfile) {
                navigation.navigate(MAIN_ROUTES.SEARCH, {
                  screen: 'SocialList',
                  params: { userId, listType: 'friends' },
                });
              } else {
                Alert.alert('Perfil Privado', 'Sigue a este usuario para ver sus amigos.');
              }
            }}
          />
        </View>

        {isBanned && (
          <View style={styles.bannedContainer}>
            <Text style={styles.bannedText}>🚫 Esta cuenta ha sido suspendida temporalmente.</Text>
          </View>
        )}

        {isBlocked && (
          <View style={styles.bannedContainer}>
            <Text style={styles.bannedText}>🔒 Has bloqueado a este usuario.</Text>
          </View>
        )}

        {canViewFullProfile ? (
          <>
            <BadgesList badges={profile.badges || []} />
            {/* Add placeholder for social activities feed in target profile */}
            <View style={styles.activitySection}>
              <Text style={styles.sectionTitle}>Actividad Reciente</Text>
              <Text style={styles.activityText}>Sin novedades del usuario.</Text>
            </View>
          </>
        ) : (
          <View style={styles.privateContainer}>
            <Text style={styles.privateIcon}>🔒</Text>
            <Text style={styles.privateTitle}>Este perfil es privado</Text>
            <Text style={styles.privateText}>
              Sigue a este usuario para tener acceso a sus badges y actividad reciente.
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {!isOwnProfile && (
            <View style={{ gap: spacing.md, width: '100%' }}>
              {!isBlocked && !isBanned && (
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <Button
                    title={isFollowing ? '✓ Siguiendo' : 'Seguir'}
                    variant={isFollowing ? 'outline' : 'primary'}
                    size="large"
                    onPress={toggleFollow}
                    loading={actionLoading}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Mensaje"
                    variant="primary"
                    size="large"
                    onPress={() => {
                      if (profile.allowMessagesFrom === 'none') {
                        Alert.alert('Privacidad', 'Este usuario no acepta mensajes privados.');
                        return;
                      }
                      navigation.navigate(MAIN_ROUTES.PRIVATE_CHAT, { targetUserId: userId });
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
              )}

              {isBlocked && (
                <Button
                  title="Mensaje privado no disponible"
                  variant="outline"
                  size="large"
                  disabled
                  onPress={() => {}}
                  style={{ width: '100%' }}
                />
              )}

              {isBanned && (
                <Button
                  title="Usuario suspendido"
                  variant="outline"
                  size="large"
                  disabled
                  onPress={() => {}}
                  style={{ width: '100%' }}
                />
              )}
            </View>
          )}

          {!isOwnProfile && (
            <View style={styles.secondaryActions}>
              <Button
                title="Reportar"
                variant="outline"
                size="medium"
                onPress={() => setReportModalVisible(true)}
                style={{ flex: 1 }}
              />
              <Button
                title={isBlocked ? 'Desbloquear' : 'Bloquear'}
                variant="outline"
                size="medium"
                onPress={() => setBlockModalVisible(true)}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        targetType="user"
        targetId={userId}
      />

      <BlockUserModal
        visible={blockModalVisible}
        onClose={() => setBlockModalVisible(false)}
        targetUserId={userId}
        targetUserName={profile.displayName || profile.username || 'Usuario'}
        isBlocked={isBlocked}
        onSuccess={wasBlocked => setIsBlocked(wasBlocked)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backIcon: { paddingRight: spacing.lg, paddingVertical: spacing.xs },
  optionsIcon: { fontSize: 24, color: colors.text, paddingLeft: spacing.lg, paddingVertical: spacing.xs },
  scrollContent: { paddingBottom: spacing.xxl },
  badgesRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginTop: spacing.sm },
  statsContainer: { paddingHorizontal: spacing.xl },
  actionsContainer: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl, gap: spacing.md },
  followButton: { width: '100%' },
  secondaryActions: { flexDirection: 'row', gap: spacing.md },
  activitySection: { paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: spacing.sm },
  activityText: { color: colors.textDark, fontSize: 13 },
  bannedContainer: {
    marginHorizontal: spacing.xl,
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  bannedText: { color: colors.error, fontSize: 13, textAlign: 'center', fontWeight: 'bold' },
  privateContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateIcon: { fontSize: 48, marginBottom: spacing.sm },
  privateTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: spacing.xs },
  privateText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
export default PublicProfileScreen;
