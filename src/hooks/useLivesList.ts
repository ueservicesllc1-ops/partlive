import { useState, useEffect, useCallback } from 'react';
import { LiveStream } from '../types/live';
import {
  getLiveStreams,
  getLivesByCategory,
  searchLives,
} from '../services/firebase/firestore/livesService';


export const useLivesList = () => {
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Popular');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLives = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let data: LiveStream[] = [];

      if (searchQuery.trim().length > 0) {
        data = await searchLives(searchQuery);
      } else {
        data = await getLivesByCategory(selectedCategory);
      }



      setLives(data);
    } catch (err: any) {
      console.error('Error fetching live streams:', err);
      setError(err?.message || 'Error al obtener los streams en vivo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchLives();
  }, [fetchLives]);

  const refresh = () => fetchLives(true);

  return {
    lives,
    loading,
    refreshing,
    error,
    selectedCategory,
    searchQuery,
    refresh,
    setCategory: setSelectedCategory,
    setSearchQuery,
  };
};
