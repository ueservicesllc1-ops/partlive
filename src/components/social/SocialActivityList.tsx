import React from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../../theme';
import { SocialActivity } from '../../types/social';
import { SocialActivityItem } from './SocialActivityItem';

interface SocialActivityListProps {
  activities: SocialActivity[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onPressActivity: (activity: SocialActivity) => void;
  onPressUser: (userId: string) => void;
}

export const SocialActivityList: React.FC<SocialActivityListProps> = ({
  activities,
  loading,
  refreshing,
  onRefresh,
  onPressActivity,
  onPressUser,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      keyExtractor={item => item.id}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => (
        <SocialActivityItem
          activity={item}
          onPressActivity={onPressActivity}
          onPressUser={onPressUser}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay actividad reciente.</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
export default SocialActivityList;
