import React from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { RecommendedUser } from '../../types/social';
import { FollowButton } from './FollowButton';
import { useFollow } from '../../hooks/useFollow';

interface RecommendedUsersCarouselProps {
  users: RecommendedUser[];
  onPressUser: (userId: string) => void;
}

const RecommendedCard: React.FC<{ item: RecommendedUser; onPress: () => void }> = ({ item, onPress }) => {
  const { isFollowing, toggleFollow, actionLoading } = useFollow(item.userId);

  const getReasonLabel = () => {
    switch (item.reason) {
      case 'active_now':
        return '🔴 En vivo';
      case 'same_country':
        return '📍 Cerca de ti';
      case 'same_language':
        return '🗣️ Mismo idioma';
      case 'vip':
        return '💎 VIP';
      case 'popular_host':
        return '👑 Host popular';
      default:
        return '✨ Recomendado';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      {item.photoURL ? (
        <Image source={{ uri: item.photoURL }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      )}

      <Text style={styles.displayName} numberOfLines={1}>
        {item.displayName}
      </Text>
      <Text style={styles.reason}>{getReasonLabel()}</Text>

      <View style={styles.buttonWrapper}>
        <FollowButton
          isFollowing={isFollowing}
          onPress={toggleFollow}
          loading={actionLoading}
        />
      </View>
    </TouchableOpacity>
  );
};

export const RecommendedUsersCarousel: React.FC<RecommendedUsersCarouselProps> = ({
  users,
  onPressUser,
}) => {
  if (users.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recomendados para ti</Text>
      <FlatList
        horizontal
        data={users}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.carouselContainer}
        renderItem={({ item }) => (
          <RecommendedCard item={item} onPress={() => onPressUser(item.userId)} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  carouselContainer: {
    paddingLeft: spacing.md,
  },
  card: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing.xs,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: {
    fontSize: 22,
  },
  displayName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  reason: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
});
export default RecommendedUsersCarousel;
