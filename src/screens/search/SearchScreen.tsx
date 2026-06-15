import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { colors } from '../../theme';
import { MAIN_ROUTES } from '../../app/routes';
import { useSearch } from '../../hooks/useSearch';
import { SearchBar } from '../../components/search/SearchBar';
import { SearchTabs } from '../../components/search/SearchTabs';
import { SearchFiltersSheet } from '../../components/search/SearchFiltersSheet';
import { RecentSearchesList } from '../../components/search/RecentSearchesList';
import { TrendingSearchesList } from '../../components/search/TrendingSearchesList';
import { SearchResultsList } from '../../components/search/SearchResultsList';
import { SearchEmptyState } from '../../components/search/SearchEmptyState';
import { SearchLoadingState } from '../../components/search/SearchLoadingState';
import { SearchResult, SearchEntityType } from '../../types/search';

export const SearchScreen = ({ navigation }: any) => {
  const {
    query,
    filters,
    results,
    groupedResults,
    recentSearches,
    trendingSearches,
    loading,
    setQuery,
    setFilter,
    clearFilters,
    search,
    clearRecent,
  } = useSearch();

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<SearchEntityType | 'all'>('all');

  const handleTabSelect = (tabKey: SearchEntityType | 'all') => {
    setSelectedTab(tabKey);
    setFilter('entityTypes', tabKey === 'all' ? [] : [tabKey]);
  };

  const handleItemPress = (item: SearchResult) => {
    switch (item.type) {
      case 'user':
      case 'host':
        navigation.navigate(MAIN_ROUTES.PUBLIC_PROFILE, { userId: item.id });
        break;
      case 'room':
        navigation.navigate(MAIN_ROUTES.ROOM_DETAILS, { roomId: item.id });
        break;
      case 'live':
        navigation.navigate(MAIN_ROUTES.LIVE_DETAILS, { liveId: item.id });
        break;
      case 'game':
        navigation.navigate(MAIN_ROUTES.GAME_DETAILS, { gameId: item.id });
        break;
      case 'event':
        navigation.navigate(MAIN_ROUTES.EVENTS, { eventId: item.id });
        break;
      case 'agency':
        Alert.alert('Agencia', `Perfil de Agencia: ${item.title}`);
        break;
      default:
        break;
    }
  };

  const hasActiveFilters = !!(
    filters.country ||
    filters.language ||
    filters.category ||
    filters.sortBy !== 'relevance'
  );

  const showHistoryAndTrends = query.trim().length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search Bar Input */}
      <SearchBar
        query={query}
        onQueryChange={setQuery}
        onBackPress={() => navigation.goBack()}
        onFilterPress={() => setFiltersVisible(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Categories Tabs */}
      <SearchTabs selectedType={selectedTab} onSelectType={handleTabSelect} />

      {/* Main Container */}
      <View style={styles.content}>
        {loading ? (
          <SearchLoadingState />
        ) : showHistoryAndTrends ? (
          <View>
            <RecentSearchesList
              searches={recentSearches}
              onSelectSearch={setQuery}
              onClearAll={clearRecent}
            />
            <TrendingSearchesList
              trendings={trendingSearches}
              onSelectSearch={setQuery}
            />
          </View>
        ) : results.length === 0 ? (
          <SearchEmptyState query={query} />
        ) : (
          <SearchResultsList
            results={results}
            groupedResults={groupedResults}
            selectedType={selectedTab}
            onTypeSelect={handleTabSelect}
            onItemPress={handleItemPress}
            onRefresh={search}
            refreshing={loading}
          />
        )}
      </View>

      {/* Bottom Sheet Filter Modal */}
      <SearchFiltersSheet
        visible={filtersVisible}
        filters={filters}
        onClose={() => setFiltersVisible(false)}
        onApply={newFilters => {
          setFilter('country', newFilters.country);
          setFilter('language', newFilters.language);
          setFilter('category', newFilters.category);
          setFilter('sortBy', newFilters.sortBy);
        }}
        onReset={() => {
          clearFilters();
          setFiltersVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
