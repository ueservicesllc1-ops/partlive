import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../../components/Button';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileStats } from '../../components/profile/ProfileStats';
import { BadgesList } from '../../components/profile/BadgesList';
import { getPublicUserProfile } from '../../services/firebase/firestore/usersService';
import { UserProfile } from '../../types/user';
import { ScreenLoading } from '../../components/ScreenLoading';
import { ScreenError } from '../../components/ScreenError';

export const PublicProfileScreen = ({ route, navigation }: any) => {
  const { userId } = route.params || {};
  
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('Usuario no especificado.');
      setLoading(false);
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const data = await getPublicUserProfile(userId);
        if (data) {
          setProfile(data);
        } else {
          setError('Este usuario no existe o ha sido eliminado.');
        }
      } catch (err) {
        setError('No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);

  if (loading) return <ScreenLoading message="Cargando perfil..." />;
  if (error || !profile) return <ScreenError message={error || 'Error desconocido'} onBack={() => navigation.goBack()} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.topActions}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {/* Options Modal */}}>
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

        <ProfileStats
          followers={profile.followersCount!}
          following={profile.followingCount!}
          gifts={profile.totalGiftsReceived || 0}
          rooms={profile.roomsJoinedCount || 0}
        />

        <BadgesList badges={profile.badges || []} />

        <View style={styles.actionsContainer}>
          <Button
            title="Seguir"
            variant="primary"
            size="large"
            onPress={() => {/* Placeholder */}}
            style={styles.followButton}
          />
          <View style={styles.secondaryActions}>
            <Button title="Reportar" variant="outline" size="medium" onPress={() => {}} style={{ flex: 1 }} />
            <Button title="Bloquear" variant="outline" size="medium" onPress={() => {}} style={{ flex: 1 }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backIcon: { paddingRight: spacing.lg, paddingVertical: spacing.xs },
  optionsIcon: { fontSize: 24, color: colors.text, paddingLeft: spacing.lg, paddingVertical: spacing.xs },
  scrollContent: { paddingBottom: spacing.xxl },
  actionsContainer: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl, gap: spacing.md },
  followButton: { width: '100%' },
  secondaryActions: { flexDirection: 'row', gap: spacing.md },
});
