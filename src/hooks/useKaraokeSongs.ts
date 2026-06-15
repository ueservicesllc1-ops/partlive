import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { KaraokeSong } from '../types/karaoke';
import {
  getSongs,
  getFavorites,
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
} from '../services/api/karaokeApi';

export function useKaraokeSongs() {
  const { user } = useAuth();
  const [songs, setSongs] = useState<KaraokeSong[]>([]);
  const [favorites, setFavorites] = useState<KaraokeSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchSongs = useCallback(async (filters?: { genre?: string; language?: string; query?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSongs(filters);
      setSongs(data);
    } catch (err: any) {
      setError(err?.message || 'Error al buscar canciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    setFavLoading(true);
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (err: any) {
      console.error('Error loading favorites:', err);
    } finally {
      setFavLoading(false);
    }
  }, [user]);

  const toggleFavorite = useCallback(async (songId: string) => {
    if (!user) return;
    const isFav = favorites.some(s => s.id === songId);
    try {
      if (isFav) {
        await apiRemoveFavorite(songId);
        setFavorites(prev => prev.filter(s => s.id !== songId));
      } else {
        await apiAddFavorite(songId);
        // Reload all favorites to get complete metadata
        await loadFavorites();
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
    }
  }, [user, favorites, loadFavorites]);

  useEffect(() => {
    searchSongs();
    loadFavorites();
  }, [searchSongs, loadFavorites]);

  return {
    songs,
    favorites,
    loading,
    favLoading,
    error,
    searchSongs,
    loadFavorites,
    toggleFavorite,
    isFavorite: useCallback((songId: string) => favorites.some(s => s.id === songId), [favorites]),
  };
}
