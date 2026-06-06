import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LiveStream } from '../../types/live';
import { colors, spacing, textPresets } from '../../theme';
import { Card } from '../Card';
import { Avatar } from '../Avatar';

interface LiveCardProps {
  item: LiveStream;
  onPress: () => void;
}

export const LiveCard: React.FC<LiveCardProps> = ({ item, onPress }) => {
  // Determine standard placeholder emojis for categories if cover/thumbnail is missing
  const getCategoryEmoji = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'música': return '🎵';
      case 'fiesta': return '🥳';
      case 'juegos': return '🎮';
      case 'conversación': return '💬';
      case 'talento': return '✨';
      default: return '📺';
    }
  };

  return (
    <TouchableOpacity style={styles.cardWrapper} onPress={onPress} activeOpacity={0.9}>
      <Card variant="bordered" style={styles.liveCard}>
        <View style={styles.coverWrapper}>
          <Text style={styles.coverEmoji}>
            {item.thumbnailUrl ? item.thumbnailUrl : getCategoryEmoji(item.category || '')}
          </Text>
          
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          <View style={styles.spectatorsIndicator}>
            <Text style={styles.spectatorsText}>👁️ {item.viewersCount || 0}</Text>
          </View>

          {item.country && (
            <View style={styles.countryIndicator}>
              <Text style={styles.countryText}>{item.country === 'CL' ? '🇨🇱' : item.country}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoWrapper}>
          <Text style={styles.streamTitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          <View style={styles.hostRow}>
            <Avatar source={item.hostPhotoURL} emoji="👤" size={24} />
            <Text style={styles.hostName} numberOfLines={1}>
              {item.hostName}
            </Text>
          </View>
          
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category || 'Popular'}</Text>
            </View>
            <Text style={styles.metaText}>❤️ {item.likesCount || 0}</Text>
            <Text style={styles.metaText}>🎁 {item.giftsCount || 0}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 0.5,
    maxWidth: '50%',
    padding: spacing.xs,
  },
  liveCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#292440',
  },
  coverWrapper: {
    height: 120,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverEmoji: {
    fontSize: 50,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 4,
  },
  liveText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
  },
  spectatorsIndicator: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  spectatorsText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.accent,
  },
  countryIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryText: {
    fontSize: 10,
  },
  infoWrapper: {
    padding: spacing.sm,
  },
  streamTitle: {
    ...textPresets.bodySmall,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 18,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  hostName: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 8,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  metaText: {
    fontSize: 9,
    color: colors.textMuted,
  },
});
