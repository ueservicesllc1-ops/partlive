import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { SearchResult } from '../../types/search';

interface SearchResultItemProps {
  item: SearchResult;
  onPress: (item: SearchResult) => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({ item, onPress }) => {
  const getEntityIcon = () => {
    switch (item.type) {
      case 'user':
        return '👤';
      case 'host':
        return '🎙️';
      case 'room':
        return '🏠';
      case 'live':
        return '🔴';
      case 'game':
        return '🎮';
      case 'event':
        return '🎉';
      case 'agency':
        return '🏢';
      default:
        return '🔍';
    }
  };

  const getEntityLabel = () => {
    switch (item.type) {
      case 'host':
        return 'Host';
      case 'room':
        return item.metadata?.isLive ? 'Sala En Vivo' : 'Sala';
      case 'live':
        return 'Live';
      case 'game':
        return 'Juego';
      case 'event':
        return 'Evento';
      case 'agency':
        return 'Agencia';
      default:
        return '';
    }
  };

  const renderBadge = () => {
    const label = getEntityLabel();
    if (!label) return null;

    let badgeColor = colors.surfaceLight;
    if (item.type === 'live') badgeColor = colors.liveBadge;
    if (item.type === 'host') badgeColor = colors.primary;
    if (item.type === 'game') badgeColor = colors.accent;

    return (
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity onPress={() => onPress(item)} style={styles.container}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.placeholderIcon}>{getEntityIcon()}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {renderBadge()}
        </View>

        {item.subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}

        <View style={styles.metaRow}>
          {item.country && (
            <Text style={styles.metaText}>
              📍 {item.country}
            </Text>
          )}
          {item.language && (
            <Text style={[styles.metaText, styles.metaGap]}>
              🗣️ {item.language.toUpperCase()}
            </Text>
          )}
          {item.type === 'live' && item.metadata?.viewersCount !== undefined && (
            <Text style={[styles.metaText, styles.metaGap, { color: colors.secondary }]}>
              👁️ {item.metadata.viewersCount}
            </Text>
          )}
          {item.type === 'room' && item.metadata?.listenersCount !== undefined && (
            <Text style={[styles.metaText, styles.metaGap, { color: colors.accent }]}>
              🔊 {item.metadata.listenersCount}
            </Text>
          )}
          {item.metadata?.followersCount !== undefined && item.metadata.followersCount > 0 && (
            <Text style={[styles.metaText, styles.metaGap]}>
              👥 {item.metadata.followersCount}
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.chevron}>➔</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceLight,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    color: colors.textDark,
    fontSize: 12,
  },
  metaGap: {
    marginLeft: spacing.sm,
  },
  chevron: {
    color: colors.textDark,
    fontSize: 16,
    marginLeft: spacing.sm,
  },
});
