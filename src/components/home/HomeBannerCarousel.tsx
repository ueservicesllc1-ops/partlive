import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';

interface BannerProps {
  banners: any[];
  onPress: (banner: any) => void;
}

export const HomeBannerCarousel = ({ banners, onPress }: BannerProps) => {
  if (!banners || banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={300 + spacing.md}
        decelerationRate="fast"
      >
        {banners.map((banner) => (
          <TouchableOpacity 
            key={banner.id} 
            style={[styles.banner, { backgroundColor: banner.color || colors.primary }]}
            onPress={() => onPress(banner)}
            activeOpacity={0.9}
          >
            <View style={styles.overlay}>
              <Text style={styles.title}>{banner.title}</Text>
              <Text style={styles.actionText}>Toca para ver ❯</Text>
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
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  banner: {
    width: 300,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)', // Slight dark overlay for contrast
  },
  title: {
    ...textPresets.h2,
    color: '#fff',
  },
  actionText: {
    ...textPresets.caption,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 'bold',
  },
});
