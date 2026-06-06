import { useState, useEffect, useCallback } from 'react';
import { Room } from '../types';
import {
  getActiveRooms,
  getPopularRooms,
  getRoomsByCategory,
  searchRooms,
} from '../services/firebase/firestore/roomsService';

export const useRoomsList = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Popular');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchRooms = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let data: Room[] = [];

      if (searchQuery.trim().length > 0) {
        data = await searchRooms(searchQuery);
      } else if (selectedCategory === 'Popular') {
        data = await getPopularRooms();
      } else {
        data = await getRoomsByCategory(selectedCategory);
      }

      setRooms(data);
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      setError(err?.message || 'Error al obtener las salas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const refresh = () => fetchRooms(true);

  return {
    rooms,
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
