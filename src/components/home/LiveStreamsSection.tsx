import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { formatViewers } from '../../utils/formatNumbers';

interface LiveStreamsProps {
  lives: any[];
  onLivePress: (liveId: string) => void;
}

export const LiveStreamsSection = ({ lives, onLivePress }: LiveStreamsProps) => {
  if (!lives || lives.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Streams 📺</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {lives.map((live) => (
          <TouchableOpacity 
            key={live.id} 
            style={styles.card}
            onPress={() => onLivePress(live.id)}
          >
            <View style={styles.cover}>
              <Text style={styles.coverEmoji}>{live.coverImage}</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <View style={styles.viewersBadge}>
                <Text style={styles.viewersText}>👁️ {formatViewers(live.viewerCount)}</Text>
              </View>
            </View>
            <View style={styles.info}>
              <Text style={styles.liveTitle} numberOfLines={1}>{live.title}</Text>
              <View style={styles.hostRow}>
                <View style={styles.hostAvatar}>
                  <Text style={styles.hostEmoji}>{live.hostAvatar}</Text>
                </View>
                <Text style={styles.hostName} numberOfLines={1}>{live.hostName}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: {
    height: 160,
    backgroundColor: '#292440',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coverEmoji: { fontSize: 60 },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
    marginRight: 4,
  },
  liveText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
  viewersBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  viewersText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
  info: {
    padding: spacing.sm,
  },
  liveTitle: {
    ...textPresets.bodySmall,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  hostEmoji: { fontSize: 10 },
  hostName: {
    ...textPresets.caption,
    color: colors.textMuted,
    flex: 1,
  },
});
