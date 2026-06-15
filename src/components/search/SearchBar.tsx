import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../../theme';

interface SearchBarProps {
  query: string;
  onQueryChange: (text: string) => void;
  onBackPress: () => void;
  onFilterPress: () => void;
  hasActiveFilters: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  onBackPress,
  onFilterPress,
  hasActiveFilters,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.searchSection}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Buscar usuarios, salas, lives, juegos..."
          placeholderTextColor={colors.textDark}
          value={query}
          onChangeText={onQueryChange}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => onQueryChange('')} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
        <Text style={styles.filterIcon}>🎛️</Text>
        {hasActiveFilters && <View style={styles.activeFilterBadge} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  backText: {
    fontSize: 24,
    color: colors.text,
  },
  searchSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    height: 40,
    padding: 0,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
    position: 'relative',
  },
  filterIcon: {
    fontSize: 22,
    color: colors.text,
  },
  activeFilterBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
