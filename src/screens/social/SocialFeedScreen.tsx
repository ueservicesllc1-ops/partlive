import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { useSocialFeed } from '../../hooks/useSocialFeed';
import { SocialActivityList } from '../../components/social/SocialActivityList';
import { RecommendedUsersCarousel } from '../../components/social/RecommendedUsersCarousel';
import { MAIN_ROUTES } from '../../app/routes';
import { SocialActivity } from '../../types/social';

export const SocialFeedScreen = ({ navigation }: any) => {
  const { activities, recommendedUsers, loading, refreshing, refresh } = useSocialFeed();

  const handlePressActivity = (activity: SocialActivity) => {
    switch (activity.actionType) {
      case 'open_profile':
        navigation.navigate(MAIN_ROUTES.PUBLIC_PROFILE, { userId: activity.actionValue });
        break;
      case 'open_room':
        navigation.navigate(MAIN_ROUTES.ROOM_DETAILS, { roomId: activity.actionValue });
        break;
      case 'open_live':
        navigation.navigate(MAIN_ROUTES.LIVE_DETAILS, { liveId: activity.actionValue });
        break;
      case 'open_event':
        navigation.navigate(MAIN_ROUTES.EVENTS, { eventId: activity.actionValue });
        break;
      default:
        break;
    }
  };

  const handlePressUser = (userId: string) => {
    navigation.navigate(MAIN_ROUTES.PUBLIC_PROFILE, { userId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Actividad Social</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recommended Carousel */}
        {recommendedUsers.length > 0 && (
          <RecommendedUsersCarousel
            users={recommendedUsers}
            onPressUser={handlePressUser}
          />
        )}

        <Text style={styles.feedTitle}>Actividad de personas que sigues</Text>

        {/* Social Activities Feed */}
        <SocialActivityList
          activities={activities}
          loading={loading}
          refreshing={refreshing}
          onRefresh={refresh}
          onPressActivity={handlePressActivity}
          onPressUser={handlePressUser}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    ...textPresets.header,
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  feedTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
});
export default SocialFeedScreen;
