import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../theme';

export interface RecentGiftItem {
  id: string;
  senderName: string;
  giftName: string;
  giftEmoji: string;
  quantity: number;
}

interface RecentGiftsTickerProps {
  recentGifts: RecentGiftItem[];
}

export const RecentGiftsTicker: React.FC<RecentGiftsTickerProps> = ({ recentGifts }) => {
  if (!recentGifts || recentGifts.length === 0) {
    return null;
  }

  // Keep last 5
  const items = recentGifts.slice(-5).reverse();

  return (
    <View style={styles.container} pointerEvents="none">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.pill}>
            <Text style={styles.emoji}>{item.giftEmoji}</Text>
            <Text style={styles.senderText} numberOfLines={1}>
              {item.senderName}
            </Text>
            <Text style={styles.giftText}>
              x{item.quantity}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  listContent: {
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 17, 36, 0.75)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emoji: {
    fontSize: 12,
    marginRight: 4,
  },
  senderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 4,
  },
  giftText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.accent,
  },
});
