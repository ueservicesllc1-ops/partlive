import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { KaraokeSong } from '../../types/karaoke';

interface KaraokeSongCardProps {
  song: KaraokeSong;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRequestSing: () => void;
  isRequested?: boolean;
}

export const KaraokeSongCard: React.FC<KaraokeSongCardProps> = ({
  song,
  isFavorite,
  onToggleFavorite,
  onRequestSing,
  isRequested = false,
}) => {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: song.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150' }}
        style={styles.cover}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist}
        </Text>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{song.genre}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: 'rgba(138, 79, 255, 0.15)' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {song.language ? song.language.toUpperCase() : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.favButton} onPress={onToggleFavorite}>
          <Text style={{ fontSize: 18, color: isFavorite ? colors.secondary : colors.textMuted }}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.requestBtn, isRequested && styles.requestedBtn]}
          onPress={onRequestSing}
          disabled={isRequested}
        >
          <Text style={styles.requestBtnText}>
            {isRequested ? 'Pedida' : 'Cantar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  favButton: {
    padding: 6,
  },
  requestBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestedBtn: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requestBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
