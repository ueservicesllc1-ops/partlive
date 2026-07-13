import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

// ─── Single Skeleton Block ────────────────────────────────────────────────────

interface SkeletonBlockProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

const SkeletonBlock = ({
  width = '100%',
  height,
  borderRadius = 10,
  style,
}: SkeletonBlockProps) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.65],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surfaceLight,
          opacity,
        },
        style,
      ]}
    />
  );
};

// ─── Banner skeleton ─────────────────────────────────────────────────────────

const SkeletonBanner = () => (
  <SkeletonBlock height={160} borderRadius={20} style={styles.banner} />
);

// ─── Quick Actions row ────────────────────────────────────────────────────────

const SkeletonQuickActions = () => (
  <View style={styles.quickActions}>
    {[...Array(4)].map((_, i) => (
      <View key={i} style={styles.quickActionItem}>
        <SkeletonBlock height={48} width={48} borderRadius={14} />
        <SkeletonBlock height={10} width={40} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
    ))}
  </View>
);

// ─── Section header ───────────────────────────────────────────────────────────

const SkeletonSectionHeader = () => (
  <View style={styles.sectionHeader}>
    <SkeletonBlock height={18} width={160} borderRadius={6} />
    <SkeletonBlock height={14} width={60} borderRadius={6} />
  </View>
);

// ─── Horizontal card row ──────────────────────────────────────────────────────

const SkeletonCardRow = ({ count = 3, cardWidth = 160, cardHeight = 110 }: {
  count?: number;
  cardWidth?: number;
  cardHeight?: number;
}) => (
  <View style={styles.cardRow}>
    {[...Array(count)].map((_, i) => (
      <View key={i} style={[styles.card, { width: cardWidth, height: cardHeight }]}>
        <SkeletonBlock height={cardHeight - 30} width="100%" borderRadius={12} />
        <SkeletonBlock height={12} width="70%" borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    ))}
  </View>
);

// ─── Full Home Skeleton ───────────────────────────────────────────────────────

export const HomeScreenSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <SkeletonBlock height={22} width={200} borderRadius={8} />
        <SkeletonBlock height={14} width={130} borderRadius={6} style={{ marginTop: 6 }} />
      </View>

      {/* Banner */}
      <SkeletonBanner />

      {/* Quick Actions */}
      <SkeletonQuickActions />

      {/* Popular Rooms */}
      <SkeletonSectionHeader />
      <SkeletonCardRow count={3} cardWidth={160} cardHeight={120} />

      {/* Live Streams */}
      <SkeletonSectionHeader />
      <SkeletonCardRow count={3} cardWidth={140} cardHeight={100} />

      {/* Rankings */}
      <SkeletonSectionHeader />
      {[...Array(3)].map((_, i) => (
        <View key={i} style={styles.rankRow}>
          <SkeletonBlock height={40} width={40} borderRadius={20} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <SkeletonBlock height={14} width="60%" borderRadius={4} />
            <SkeletonBlock height={10} width="40%" borderRadius={4} style={{ marginTop: 5 }} />
          </View>
          <SkeletonBlock height={20} width={60} borderRadius={10} />
        </View>
      ))}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.md,
  },
  greeting: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  banner: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: 14,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
});
