import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { SearchResult, SearchEntityType } from '../../types/search';
import { SearchResultItem } from './SearchResultItem';

interface SearchResultsListProps {
  results: SearchResult[];
  groupedResults: Record<SearchEntityType, SearchResult[]>;
  selectedType: SearchEntityType | 'all';
  onTypeSelect: (type: SearchEntityType) => void;
  onItemPress: (item: SearchResult) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  results,
  groupedResults,
  selectedType,
  onTypeSelect,
  onItemPress,
  onRefresh,
  refreshing,
}) => {
  if (selectedType === 'all') {
    // Render grouped dashboard
    const sections: { type: SearchEntityType; title: string; data: SearchResult[] }[] = [
      { type: 'live', title: '🔴 Lives en Directo', data: groupedResults.live },
      { type: 'room', title: '🏠 Salas de Voz Activas', data: groupedResults.room },
      { type: 'host', title: '🎙️ Hosts Populares', data: groupedResults.host },
      { type: 'user', title: '👥 Usuarios', data: groupedResults.user },
      { type: 'game', title: '🎮 Juegos recomendados', data: groupedResults.game },
      { type: 'event', title: '🎉 Eventos Especiales', data: groupedResults.event },
    ];

    const activeSections = sections.filter(s => s.data.length > 0);

    if (activeSections.length === 0) {
      return null;
    }

    return (
      <FlatList
        data={activeSections}
        keyExtractor={item => item.type}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.container}
        renderItem={({ item: section }) => (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.data.length > 3 && (
                <TouchableOpacity onPress={() => onTypeSelect(section.type)}>
                  <Text style={styles.seeAllText}>Ver todos ›</Text>
                </TouchableOpacity>
              )}
            </View>
            {section.data.slice(0, 3).map(item => (
              <SearchResultItem key={item.id} item={item} onPress={onItemPress} />
            ))}
          </View>
        )}
      />
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={item => `${item.type}_${item.id}`}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => <SearchResultItem item={item} onPress={onItemPress} />}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
