import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { TrendingSearch } from '../../types/search';

interface TrendingSearchesListProps {
  trendings: TrendingSearch[];
  onSelectSearch: (query: string) => void;
}

export const TrendingSearchesList: React.FC<TrendingSearchesListProps> = ({
  trendings,
  onSelectSearch,
}) => {
  if (trendings.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Tendencias de Búsqueda</Text>
      
      <View style={styles.list}>
        {trendings.slice(0, 8).map((item, index) => {
          const rank = index + 1;
          let rankColor = colors.textMuted;
          if (rank === 1) rankColor = colors.secondary;
          if (rank === 2) rankColor = colors.primary;
          if (rank === 3) rankColor = colors.accent;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelectSearch(item.query)}
              style={styles.item}
            >
              <Text style={[styles.rankText, { color: rankColor }]}>{rank}</Text>
              <View style={styles.textContainer}>
                <Text style={styles.queryText}>{item.query}</Text>
                {item.count > 5 && (
                  <Text style={styles.hotText}>HOT</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  queryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  hotText: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
