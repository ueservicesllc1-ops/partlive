import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { Button } from '../Button';

interface FeaturedHostsProps {
  hosts: any[];
  onHostPress: (userId: string) => void;
}

export const FeaturedHostsSection = ({ hosts, onHostPress }: FeaturedHostsProps) => {
  if (!hosts || hosts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hosts Destacados ⭐</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {hosts.map((host) => (
          <TouchableOpacity 
            key={host.id} 
            style={styles.card}
            onPress={() => onHostPress(host.id)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{host.avatar}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv.{host.level}</Text>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={1}>{host.name}</Text>
            <Text style={styles.followers}>❤️ {(host.followers / 1000).toFixed(1)}k</Text>
            <Button 
              title="Seguir" 
              variant="outline" 
              size="small" 
              style={styles.followBtn} 
              onPress={() => {}} 
            />
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
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#292440',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  avatarEmoji: { fontSize: 32 },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  levelText: { fontSize: 8, color: '#fff', fontWeight: 'bold' },
  name: {
    ...textPresets.bodyMedium,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  followers: {
    ...textPresets.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  followBtn: {
    width: '100%',
  },
});
