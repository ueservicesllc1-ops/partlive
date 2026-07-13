import { useState, useEffect } from 'react';
import { Room } from '../types';
import { listenToActiveRooms } from '../services/firebase/firestore/roomsService';

export const useRoomsList = () => {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Popular');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Subscribe to active rooms in real-time
  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = listenToActiveRooms(
      (data) => {
        setAllRooms(data);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Perform client-side filtering and sorting
  useEffect(() => {
    let filtered = [...allRooms];

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        room =>
          room.title.toLowerCase().includes(lowerQuery) ||
          (room.description && room.description.toLowerCase().includes(lowerQuery)) ||
          (room.tags && room.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    }

    // Filter by category and sort
    if (selectedCategory === 'Popular') {
      // Sort by listenersCount descending (most popular first)
      filtered.sort((a, b) => (b.listenersCount || 0) - (a.listenersCount || 0));
    } else {
      const categoryMap: Record<string, string> = {
        'Música': 'music',
        'Karaoke': 'karaoke',
        'Fiesta': 'party',
        'Juegos': 'games',
        'Conversación': 'talk',
        'Talentos': 'talents',
        'Cristiana': 'christian',
        'Podcast': 'podcast',
        'Debate': 'debate',
        'Amistad': 'friends',
        'Privada': 'private',
        'VIP': 'vip',
      };
      const categoryId = categoryMap[selectedCategory] || selectedCategory.toLowerCase();
      filtered = filtered.filter(room => room.category === categoryId);
      
      // Sort by createdAt descending (newest first)
      filtered.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    }

    setRooms(filtered);
  }, [allRooms, selectedCategory, searchQuery]);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

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
