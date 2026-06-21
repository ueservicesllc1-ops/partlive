// TopGiftersPanel.tsx
// Premium component to display the top gifters in a room, live stream, or game session.
// Integrates with Firestore via @react-native-firebase/firestore and uses the app's theme.

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, Easing, Image } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { colors, spacing, textPresets } from '../../theme';
import { Avatar } from '../Avatar';

export interface TopGifter {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalGifts: number;
}

interface TopGiftersPanelProps {
  /** "room" | "live" | "game" */
  targetType: 'room' | 'live' | 'game';
  /** Identifier of the target (roomId, liveId, or gameSessionId) */
  targetId: string;
  /** How many top donors to show */
  limit?: number;
}

export const TopGiftersPanel: React.FC<TopGiftersPanelProps> = ({ targetType, targetId, limit = 5 }) => {
  const [topGifters, setTopGifters] = useState<TopGifter[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Build the Firestore path based on target type – same logic as useGiftEvents
  const getPath = () => {
    switch (targetType) {
      case 'room':
        return `rooms/${targetId}/giftEvents`;
      case 'live':
        return `lives/${targetId}/giftEvents`;
      case 'game':
        return `gameSessions/${targetId}/giftEvents`;
      default:
        return '';
    }
  };

  useEffect(() => {
    const path = getPath();
    if (!path) return;

    const unsubscribe = firestore()
      .collection(path)
      .orderBy('createdAt', 'desc')
      .limit(100) // fetch recent events; aggregation is done client‑side
      .onSnapshot(
        (snapshot) => {
          const aggregator: Record<string, TopGifter> = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            const receiverId = data.receiverId as string;
            const receiverName = data.receiverName as string;
            const receiverPhoto = data.receiverPhotoURL as string | undefined;
            const quantity = (data.quantity as number) ?? 1;
            if (!receiverId) return;
            if (!aggregator[receiverId]) {
              aggregator[receiverId] = {
                userId: receiverId,
                displayName: receiverName ?? 'Usuario',
                photoURL: receiverPhoto,
                totalGifts: 0,
              };
            }
            aggregator[receiverId].totalGifts += quantity;
          });

          // Convert to array and sort descending by totalGifts
          const sorted = Object.values(aggregator).sort((a, b) => b.totalGifts - a.totalGifts).slice(0, limit);
          setTopGifters(sorted);
        },
        (error) => console.error('[TopGiftersPanel] Firestore listener error:', error)
      );

    // Fade‑in animation when data loads
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    return () => unsubscribe();
  }, [targetType, targetId, limit]);

  if (topGifters.length === 0) {
    return null; // nothing to show yet
  }

  const renderItem = ({ item }: { item: TopGifter }) => (
    <View style={styles.card}>
      <Avatar source={item.photoURL} emoji="👤" size={48} />
      <Text style={styles.name} numberOfLines={1}>
        {item.displayName.split(' ')[0]}
      </Text>
      <Text style={styles.gifts}>💎 {item.totalGifts}</Text>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }] } >
      <Text style={styles.title}>Top Donadores</Text>
      <FlatList
        data={topGifters}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    alignItems: 'center',
    width: 72,
    backgroundColor: 'rgba(0,229,255,0.06)',
    borderRadius: 12,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  name: {
    ...textPresets.bodySmall,
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  gifts: {
    ...textPresets.caption,
    color: colors.secondary,
    marginTop: 2,
    fontWeight: '600',
  },
});

export default TopGiftersPanel;
