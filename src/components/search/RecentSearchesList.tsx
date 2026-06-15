import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { RecentSearch } from '../../types/search';

interface RecentSearchesListProps {
  searches: RecentSearch[];
  onSelectSearch: (query: string) => void;
  onClearAll: () => void;
}

export const RecentSearchesList: React.FC<RecentSearchesListProps> = ({
  searches,
  onSelectSearch,
  onClearAll,
}) => {
  if (searches.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Búsquedas Recientes</Text>
        <TouchableOpacity onPress={onClearAll} style={styles.clearButton}>
          <Text style={styles.clearText}>Borrar todo 🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {searches.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelectSearch(item.query)}
            style={styles.chip}
          >
            <Text style={styles.chipText}>{item.query}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearText: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
