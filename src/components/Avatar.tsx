import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, StyleProp } from 'react-native';
import { colors, typography } from '../theme';

interface AvatarProps {
  source?: string; // Image URL
  emoji?: string; // Emoji fallback
  size?: number;
  isLive?: boolean;
  level?: number;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  emoji = '👤',
  size = 50,
  isLive = false,
  level,
  style,
}) => {
  const containerSize = size;
  const badgeSize = Math.max(16, size * 0.35);

  const getContainerStyle = (): StyleProp<ViewStyle> => {
    return [
      styles.container,
      {
        width: containerSize,
        height: containerSize,
        borderRadius: containerSize / 2,
        borderColor: isLive ? colors.secondary : colors.border,
        borderWidth: isLive ? 2 : 1,
      },
      style,
    ];
  };

  return (
    <View style={getContainerStyle()}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={{ width: '100%', height: '100%', borderRadius: containerSize / 2 }}
        />
      ) : (
        <View style={[styles.fallback, { borderRadius: containerSize / 2 }]}>
          <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
        </View>
      )}

      {/* Live Badge indicator */}
      {isLive && (
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Level Badge overlay */}
      {level !== undefined && (
        <View
          style={[
            styles.levelBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: -2,
              right: -2,
            },
          ]}
        >
          <Text style={[styles.levelText, { fontSize: Math.max(8, badgeSize * 0.55) }]}>
            Lv.{level}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    position: 'relative',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.background,
  },
  liveText: {
    color: colors.text,
    fontSize: 8,
    fontWeight: 'bold',
  },
  levelBadge: {
    position: 'absolute',
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background,
  },
  levelText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
