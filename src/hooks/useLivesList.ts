import { useState, useEffect, useCallback } from 'react';
import { LiveStream } from '../types/live';
import {
  getLiveStreams,
  getLivesByCategory,
  searchLives,
} from '../services/firebase/firestore/livesService';
import { mockLives } from '../constants/mockData';

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

      // Fallback mock check if Firestore returns no live streams
      if (data.length === 0) {
        data = mockLives.map(mock => ({
          id: mock.id,
          hostId: mock.hostId,
          hostName: mock.hostName,
          hostUsername: mock.hostName.toLowerCase(),
          hostPhotoURL: mock.hostAvatar, // emoji as avatar
          title: mock.title,
          description: 'Live Stream divertido. ¡Únete a nosotros!',
          category: selectedCategory === 'Popular' ? 'Conversación' : selectedCategory,
          thumbnailUrl: '',
          country: 'CL',
          language: 'es',
          tags: mock.tags,
          viewersCount: mock.viewerCount,
          peakViewersCount: mock.viewerCount,
          likesCount: Math.floor(Math.random() * 500) + 10,
          giftsCount: Math.floor(Math.random() * 50) + 2,
          diamondsEarned: Math.floor(Math.random() * 1000),
          status: 'live',
          isPrivate: false,
          allowChat: true,
          allowGifts: true,
          moderatorIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as LiveStream));
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
