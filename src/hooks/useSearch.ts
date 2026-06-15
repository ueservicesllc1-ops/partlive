import { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchFilter, SearchResult, RecentSearch, TrendingSearch, SearchEntityType } from '../types/search';
import {
  searchAll,
  saveRecentSearch,
  getRecentSearches,
  clearRecentSearches,
  getTrendingSearches,
} from '../services/firebase/firestore/searchService';
import auth from '@react-native-firebase/auth';

const initialFilters: SearchFilter = {
  entityTypes: [], // empty means all
  sortBy: 'relevance',
};

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter>(initialFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = auth().currentUser;
  const userId = currentUser?.uid || '';

  // Fetch recent searches
  const loadRecent = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getRecentSearches(userId);
      setRecentSearches(data);
    } catch (err) {
      console.error('Error loading recent searches:', err);
    }
  }, [userId]);

  // Fetch trending searches
  const loadTrending = useCallback(async () => {
    try {
      const data = await getTrendingSearches(filters.country, filters.language);
      setTrendingSearches(data);
    } catch (err) {
      console.error('Error loading trending searches:', err);
    }
  }, [filters.country, filters.language]);

  // Clear all recent searches
  const clearRecent = useCallback(async () => {
    if (!userId) return;
    try {
      await clearRecentSearches(userId);
      setRecentSearches([]);
    } catch (err) {
      console.error('Error clearing recent searches:', err);
    }
  }, [userId]);

  // Perform search
  const executeSearch = useCallback(
    async (searchQuery: string, currentFilters: SearchFilter) => {
      setLoading(true);
      setError(null);
      try {
        const activeFilters = {
          ...currentFilters,
          query: searchQuery || undefined,
        };
        const searchResults = await searchAll(activeFilters);
        setResults(searchResults);

        // Auto save successful query to recent list
        if (searchQuery.trim().length > 1 && userId) {
          await saveRecentSearch(userId, searchQuery.trim(), currentFilters);
          loadRecent();
        }
      } catch (err: any) {
        console.error('Search execution failed:', err);
        setError('Error al realizar la búsqueda. Por favor intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    },
    [userId, loadRecent]
  );

  // Debounced search logic on query change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      executeSearch(query, filters);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, filters, executeSearch]);

  // Initial load
  useEffect(() => {
    loadRecent();
    loadTrending();
  }, [loadRecent, loadTrending]);

  // Update specific filter key
  const setFilter = useCallback(<K extends keyof SearchFilter>(key: K, value: SearchFilter[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Reset to initial filter state
  const clearFilters = useCallback(() => {
    setFilters({
      ...initialFilters,
      country: filters.country, // keep user locale country/lang if preferred
      language: filters.language,
    });
  }, [filters.country, filters.language]);

  // Grouped results helper
  const groupedResults = useMemo(() => {
    const groups: Record<SearchEntityType, SearchResult[]> = {
      user: [],
      host: [],
      room: [],
      live: [],
      game: [],
      event: [],
      agency: [],
    };

    results.forEach(item => {
      if (groups[item.type]) {
        groups[item.type].push(item);
      }
    });

    return groups;
  }, [results]);

  return {
    query,
    filters,
    results,
    groupedResults,
    recentSearches,
    trendingSearches,
    loading,
    error,
    setQuery,
    setFilter,
    clearFilters,
    search: () => executeSearch(query, filters),
    clearRecent,
    refreshTrending: loadTrending,
  };
};
